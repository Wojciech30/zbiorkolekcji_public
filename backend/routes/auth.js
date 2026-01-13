import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import authenticateToken from "../middleware/authenticateToken.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../config/mailer.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Brak konfiguracji JWT_SECRET");

const FRONTEND_BASE_URL =
    process.env.FRONTEND_BASE_URL || "http://localhost:8080";

const ERROR_MESSAGES = {
    REGISTER_MISSING_FIELDS:
        "Wymagane pola: nazwa użytkownika, hasło i email",
    REGISTER_INVALID_EMAIL: "Nieprawidłowy format email",
    REGISTER_USER_EXISTS: "Nazwa użytkownika lub email jest już zajęty",
    REGISTER_PASSWORD_TOO_WEAK:
        "Hasło musi mieć co najmniej 6 znaków",

    LOGIN_MISSING_FIELDS:
        "Wymagane pola: login (email lub nazwa użytkownika) oraz hasło",
    LOGIN_FAILED: "Nieprawidłowe dane logowania",
    EMAIL_NOT_VERIFIED:
        "Adres e-mail nie został jeszcze potwierdzony. Sprawdź swoją skrzynkę pocztową.",

    TOKEN_GENERATION_ERROR: "Błąd generowania tokenów",
    SERVER_ERROR: "Błąd serwera",

    REFRESH_TOKEN_MISSING: "Brak tokena odświeżającego",
    REFRESH_TOKEN_INVALID: "Nieprawidłowy token odświeżający",
    REFRESH_TOKEN_EXPIRED: "Token odświeżający wygasł",

    PROFILE_NO_FIELDS: "Brak danych do aktualizacji",
    PROFILE_INVALID_EMAIL: "Nieprawidłowy format email",
    PROFILE_CONFLICT: "Nazwa użytkownika lub email jest już zajęty",

    CHANGE_PASSWORD_MISSING_FIELDS:
        "Wymagane pola: obecne hasło i nowe hasło",
    CHANGE_PASSWORD_INVALID_CURRENT:
        "Obecne hasło jest nieprawidłowe",
    CHANGE_PASSWORD_TOO_WEAK:
        "Nowe hasło musi mieć co najmniej 6 znaków",

    EMAIL_VERIFICATION_MISSING_TOKEN: "Brak tokena weryfikacyjnego",
    EMAIL_VERIFICATION_INVALID:
        "Nieprawidłowy token weryfikacyjny",
    EMAIL_VERIFICATION_EXPIRED:
        "Token weryfikacyjny wygasł. Poproś o nowy link.",

    FORGOT_PASSWORD_MISSING_EMAIL: "Adres e-mail jest wymagany.",
    PASSWORD_RESET_MISSING_TOKEN:
        "Brak tokena do resetu hasła.",
    PASSWORD_RESET_MISSING_PASSWORD:
        "Nowe hasło jest wymagane.",
    PASSWORD_RESET_TOO_WEAK:
        "Nowe hasło musi mieć co najmniej 6 znaków.",
    PASSWORD_RESET_INVALID:
        "Nieprawidłowy lub wygasły token resetu hasła."
};

const isValidEmail = email =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Generowanie access + refresh tokenów
const generateTokens = user => {
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
};

// ======================= LOGOWANIE =======================
router.post("/login", async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                code: "LOGIN_MISSING_FIELDS",
                message: ERROR_MESSAGES.LOGIN_MISSING_FIELDS
            });
        }

        const query = isValidEmail(identifier)
            ? { email: identifier }
            : { username: identifier };

        const user = await User.findOne(query).select("+password");
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                code: "INVALID_CREDENTIALS",
                message: ERROR_MESSAGES.LOGIN_FAILED
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                code: "EMAIL_NOT_VERIFIED",
                message: ERROR_MESSAGES.EMAIL_NOT_VERIFIED
            });
        }

        let accessToken, refreshToken;
        try {
            ({ accessToken, refreshToken } = generateTokens(user));
        } catch (error) {
            return res.status(500).json({
                code: "TOKEN_GENERATION_ERROR",
                message: ERROR_MESSAGES.TOKEN_GENERATION_ERROR
            });
        }

        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
});

// ======================= REJESTRACJA =======================
router.post("/register", async (req, res) => {
    try {
        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({
                code: "REGISTER_MISSING_FIELDS",
                message: ERROR_MESSAGES.REGISTER_MISSING_FIELDS
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                code: "REGISTER_INVALID_EMAIL",
                message: ERROR_MESSAGES.REGISTER_INVALID_EMAIL
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                code: "REGISTER_PASSWORD_TOO_WEAK",
                message: ERROR_MESSAGES.REGISTER_PASSWORD_TOO_WEAK
            });
        }

        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({
                code: "REGISTER_USER_EXISTS",
                message: ERROR_MESSAGES.REGISTER_USER_EXISTS
            });
        }

        const newUser = new User({ username, password, email });
        const emailVerificationToken =
            newUser.generateEmailVerificationToken();
        await newUser.save();

        const verificationUrl = `${FRONTEND_BASE_URL}/verify-email?token=${emailVerificationToken}`;

        // Wyślij email weryfikacyjny
        try {
            await sendVerificationEmail(newUser.email, newUser.username, emailVerificationToken);
        } catch (emailError) {
            console.error("Błąd wysyłania emaila weryfikacyjnego:", emailError);
            // Kontynuuj mimo błędu - email można ponownie wysłać
        }

        res.status(201).json({
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                isEmailVerified: newUser.isEmailVerified
            },
            message:
                "Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail, aby potwierdzić adres.",
            verificationUrl:
                process.env.NODE_ENV !== "production"
                    ? verificationUrl
                    : undefined
        });
    } catch (error) {
        console.error("Register error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                code: "VALIDATION_ERROR",
                message: Object.values(error.errors).map(e => e.message)
            });
        }

        res.status(500).json({
            code: "SERVER_ERROR",
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
});

// ======================= POTWIERDZENIE EMAILA =======================
router.post("/verify-email", async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                code: "EMAIL_VERIFICATION_MISSING_TOKEN",
                message: ERROR_MESSAGES.EMAIL_VERIFICATION_MISSING_TOKEN
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                code: "EMAIL_VERIFICATION_INVALID",
                message: ERROR_MESSAGES.EMAIL_VERIFICATION_INVALID
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;

        await user.save();

        res.json({
            code: "EMAIL_VERIFIED",
            message: "Adres e-mail został pomyślnie potwierdzony."
        });
    } catch (error) {
        console.error("Email verification error:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
});

// ======================= PONOWNE WYSŁANIE LINKU WERYFIKACYJNEGO =======================
router.post("/resend-verification", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                code: "EMAIL_REQUIRED",
                message: "Adres e-mail jest wymagany."
            });
        }

        const user = await User.findOne({ email }).select(
            "+emailVerificationLastSent"
        );

        if (!user) {
            return res.json({
                code: "VERIFICATION_LINK_SENT",
                message: "Jeśli konto istnieje, wysłaliśmy link aktywacyjny."
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                code: "EMAIL_ALREADY_VERIFIED",
                message: "Adres e-mail został już potwierdzony."
            });
        }

        const now = Date.now();
        if (user.emailVerificationLastSent) {
            const diff = now - new Date(user.emailVerificationLastSent).getTime();
            const FIVE_MIN = 5 * 60 * 1000;

            if (diff < FIVE_MIN) {
                const remaining = Math.ceil((FIVE_MIN - diff) / 1000);

                return res.status(429).json({
                    code: "VERIFICATION_TOO_SOON",
                    message: `Możesz poprosić o nowy link za ${remaining} sekund.`
                });
            }
        }

        const newToken = user.generateEmailVerificationToken();
        user.emailVerificationLastSent = new Date();
        await user.save({ validateBeforeSave: false });

        const verifyUrl = `${FRONTEND_BASE_URL}/verify-email?token=${newToken}`;

        // Wyślij email weryfikacyjny
        try {
            await sendVerificationEmail(user.email, user.username, newToken);
        } catch (emailError) {
            console.error("Błąd wysyłania emaila weryfikacyjnego:", emailError);
        }

        return res.json({
            code: "VERIFICATION_LINK_SENT",
            message: "Link aktywacyjny został wysłany ponownie.",
            verifyUrl: process.env.NODE_ENV !== "production" ? verifyUrl : undefined
        });

    } catch (error) {
        console.error("Resend verification error:", error);
        return res.status(500).json({
            code: "SERVER_ERROR",
            message: "Błąd serwera. Spróbuj ponownie później."
        });
    }
});


// ======================= FORGOT PASSWORD =======================
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                code: "FORGOT_PASSWORD_MISSING_EMAIL",
                message: ERROR_MESSAGES.FORGOT_PASSWORD_MISSING_EMAIL
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                code: "FORGOT_PASSWORD_EMAIL_SENT",
                message:
                    "Jeśli konto z tym adresem istnieje, wysłaliśmy instrukcje resetu hasła."
            });
        }

        const resetToken = user.generatePasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${FRONTEND_BASE_URL}/reset-password?token=${resetToken}`;

        // Wyślij email z linkiem do resetu hasła
        try {
            await sendPasswordResetEmail(user.email, user.username, resetToken);
        } catch (emailError) {
            console.error("Błąd wysyłania emaila resetującego hasło:", emailError);
        }

        res.json({
            code: "FORGOT_PASSWORD_EMAIL_SENT",
            message:
                "Jeśli konto z tym adresem istnieje, wysłaliśmy instrukcje resetu hasła.",
            resetUrl:
                process.env.NODE_ENV !== "production" ? resetUrl : undefined
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
});

// ======================= RESET PASSWORD =======================
router.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token) {
            return res.status(400).json({
                code: "PASSWORD_RESET_MISSING_TOKEN",
                message: ERROR_MESSAGES.PASSWORD_RESET_MISSING_TOKEN
            });
        }

        if (!newPassword) {
            return res.status(400).json({
                code: "PASSWORD_RESET_MISSING_PASSWORD",
                message: ERROR_MESSAGES.PASSWORD_RESET_MISSING_PASSWORD
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                code: "PASSWORD_RESET_TOO_WEAK",
                message: ERROR_MESSAGES.PASSWORD_RESET_TOO_WEAK
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select("+password");

        if (!user) {
            return res.status(400).json({
                code: "PASSWORD_RESET_INVALID",
                message: ERROR_MESSAGES.PASSWORD_RESET_INVALID
            });
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        res.json({
            code: "PASSWORD_RESET_SUCCESS",
            message: "Hasło zostało pomyślnie zmienione."
        });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
});

// ======================= PROFIL (GET) =======================
router.get("/profile", authenticateToken, (req, res) => {
    const safeUserData = {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
        isEmailVerified: req.user.isEmailVerified
    };

    res.json(safeUserData);
});

// ======================= ZMIANA HASŁA (ZALOGOWANY) =======================
router.post("/change-password", authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                code: "CHANGE_PASSWORD_MISSING_FIELDS",
                message: ERROR_MESSAGES.CHANGE_PASSWORD_MISSING_FIELDS
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                code: "CHANGE_PASSWORD_TOO_WEAK",
                message: ERROR_MESSAGES.CHANGE_PASSWORD_TOO_WEAK
            });
        }

        const user = await User.findById(req.user._id).select("+password");
        if (!user) {
            return res.status(404).json({
                code: "USER_NOT_FOUND",
                message: "Użytkownik nie został znaleziony"
            });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                code: "CHANGE_PASSWORD_INVALID_CURRENT",
                message: ERROR_MESSAGES.CHANGE_PASSWORD_INVALID_CURRENT
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            code: "PASSWORD_CHANGED",
            message: "Hasło zostało pomyślnie zmienione"
        });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
});

// ======================= AKTUALIZACJA AVATARA =======================
router.put("/update-avatar", authenticateToken, async (req, res) => {
    try {
        const { avatar } = req.body;

        if (avatar === undefined) {
            return res.status(400).json({
                code: "AVATAR_MISSING",
                message: "Wymagane pole: avatar (URL zdjęcia)"
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                code: "USER_NOT_FOUND",
                message: "Użytkownik nie został znaleziony"
            });
        }

        user.avatar = avatar || "";
        await user.save();

        res.json({
            code: "AVATAR_UPDATED",
            message: "Avatar został zaktualizowany",
            avatar: user.avatar
        });
    } catch (error) {
        console.error("Update avatar error:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
});

// ======================= REFRESH TOKEN =======================
router.post("/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                code: "REFRESH_TOKEN_MISSING",
                message: ERROR_MESSAGES.REFRESH_TOKEN_MISSING
            });
        }

        let payload;
        try {
            payload = jwt.verify(refreshToken, JWT_SECRET);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    code: "REFRESH_TOKEN_EXPIRED",
                    message: ERROR_MESSAGES.REFRESH_TOKEN_EXPIRED
                });
            }
            return res.status(401).json({
                code: "REFRESH_TOKEN_INVALID",
                message: ERROR_MESSAGES.REFRESH_TOKEN_INVALID
            });
        }

        const user = await User.findById(payload.id);
        if (!user) {
            return res.status(404).json({
                code: "USER_NOT_FOUND",
                message: "Użytkownik nie został znaleziony"
            });
        }

        const { accessToken, refreshToken: newRefreshToken } =
            generateTokens(user);

        res.json({
            accessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
});

// ======================= LOGOUT =======================
router.post("/logout", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            code: "LOGOUT_MISSING_TOKEN",
            message: "Brak tokena odświeżającego"
        });
    }

    return res.json({
        code: "LOGOUT_SUCCESS",
        message: "Wylogowano pomyślnie"
    });
});

export default router;
