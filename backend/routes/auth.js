/**
 * @fileoverview Routes autoryzacji
 * @description Endpointy dla rejestracji, logowania, weryfikacji email,
 * resetowania hasła, zarządzania profilem i tokenami JWT.
 * 
 * @module routes/auth
 */

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

/**
 * Stałe komunikatów błędów
 * Używane do spójnych odpowiedzi API
 */
const ERROR_MESSAGES = {
    // Rejestracja
    REGISTER_MISSING_FIELDS: "Wymagane pola: nazwa użytkownika, hasło i email",
    REGISTER_INVALID_EMAIL: "Nieprawidłowy format email",
    REGISTER_USER_EXISTS: "Nazwa użytkownika lub email jest już zajęty",
    REGISTER_PASSWORD_TOO_WEAK: "Hasło musi mieć co najmniej 6 znaków",
    // Logowanie
    LOGIN_MISSING_FIELDS: "Wymagane pola: login (email lub nazwa użytkownika) oraz hasło",
    LOGIN_FAILED: "Nieprawidłowe dane logowania",
    EMAIL_NOT_VERIFIED: "Adres e-mail nie został jeszcze potwierdzony. Sprawdź swoją skrzynkę pocztową.",
    // Tokeny
    TOKEN_GENERATION_ERROR: "Błąd generowania tokenów",
    SERVER_ERROR: "Błąd serwera",
    REFRESH_TOKEN_MISSING: "Brak tokena odświeżającego",
    REFRESH_TOKEN_INVALID: "Nieprawidłowy token odświeżający",
    REFRESH_TOKEN_EXPIRED: "Token odświeżający wygasł",
    // Profil
    PROFILE_NO_FIELDS: "Brak danych do aktualizacji",
    PROFILE_INVALID_EMAIL: "Nieprawidłowy format email",
    PROFILE_CONFLICT: "Nazwa użytkownika lub email jest już zajęty",
    // Zmiana hasła
    CHANGE_PASSWORD_MISSING_FIELDS: "Wymagane pola: obecne hasło i nowe hasło",
    CHANGE_PASSWORD_INVALID_CURRENT: "Obecne hasło jest nieprawidłowe",
    CHANGE_PASSWORD_TOO_WEAK: "Nowe hasło musi mieć co najmniej 6 znaków",
    // Weryfikacja email
    EMAIL_VERIFICATION_MISSING_TOKEN: "Brak tokena weryfikacyjnego",
    EMAIL_VERIFICATION_INVALID: "Nieprawidłowy token weryfikacyjny",
    EMAIL_VERIFICATION_EXPIRED: "Token weryfikacyjny wygasł. Poproś o nowy link.",
    // Reset hasła
    FORGOT_PASSWORD_MISSING_EMAIL: "Adres e-mail jest wymagany.",
    PASSWORD_RESET_MISSING_TOKEN: "Brak tokena do resetu hasła.",
    PASSWORD_RESET_MISSING_PASSWORD: "Nowe hasło jest wymagane.",
    PASSWORD_RESET_TOO_WEAK: "Nowe hasło musi mieć co najmniej 6 znaków.",
    PASSWORD_RESET_INVALID: "Nieprawidłowy lub wygasły token resetu hasła."
};

/**
 * Walidacja formatu email
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = email =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Generuje parę tokenów JWT (access + refresh)
 * @param {Object} user - Obiekt użytkownika z _id i role
 * @returns {{accessToken: string, refreshToken: string}}
 */
const generateTokens = user => {
    // Access token - krótkotrwały (15 min)
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: "15m" }
    );

    // Refresh token - długotrwały (7 dni)
    const refreshToken = jwt.sign(
        { id: user._id },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
};

// ======================= LOGOWANIE =======================
/**
 * @route POST /api/v1/auth/login
 * @description Logowanie użytkownika (email lub username)
 * @access Public
 * @param {string} req.body.identifier - Email lub nazwa użytkownika
 * @param {string} req.body.password - Hasło
 * @returns {Object} accessToken, refreshToken, user
 */
router.post("/login", async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                code: "LOGIN_MISSING_FIELDS",
                message: ERROR_MESSAGES.LOGIN_MISSING_FIELDS
            });
        }

        // Szukaj po email lub username
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

        // Sprawdź czy email został zweryfikowany
        if (!user.isEmailVerified) {
            return res.status(403).json({
                code: "EMAIL_NOT_VERIFIED",
                message: ERROR_MESSAGES.EMAIL_NOT_VERIFIED
            });
        }

        // Generuj tokeny
        let accessToken, refreshToken;
        try {
            ({ accessToken, refreshToken } = generateTokens(user));
        } catch (error) {
            return res.status(500).json({
                code: "TOKEN_GENERATION_ERROR",
                message: ERROR_MESSAGES.TOKEN_GENERATION_ERROR
            });
        }

        // Aktualizuj datę ostatniego logowania
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
                isActive: user.isActive,
                avatar: user.avatar,
                isProfilePublic: user.isProfilePublic,
                createdAt: user.createdAt
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
/**
 * @route POST /api/v1/auth/register
 * @description Rejestracja nowego użytkownika
 * @access Public
 * @param {string} req.body.username - Nazwa użytkownika (3-30 znaków)
 * @param {string} req.body.email - Adres email
 * @param {string} req.body.password - Hasło (min 6 znaków)
 * @returns {Object} user, message, verificationUrl (dev only)
 */
router.post("/register", async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Walidacja wymaganych pól
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

        // Sprawdź czy użytkownik istnieje
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({
                code: "REGISTER_USER_EXISTS",
                message: ERROR_MESSAGES.REGISTER_USER_EXISTS
            });
        }

        // Utwórz użytkownika i wygeneruj token weryfikacyjny
        const newUser = new User({ username, password, email });
        const emailVerificationToken = newUser.generateEmailVerificationToken();
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
            message: "Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail, aby potwierdzić adres.",
            verificationUrl: process.env.NODE_ENV !== "production" ? verificationUrl : undefined
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
/**
 * @route POST /api/v1/auth/verify-email
 * @description Weryfikacja adresu email tokenem z linku
 * @access Public
 * @param {string} req.body.token - Token weryfikacyjny
 */
router.post("/verify-email", async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                code: "EMAIL_VERIFICATION_MISSING_TOKEN",
                message: ERROR_MESSAGES.EMAIL_VERIFICATION_MISSING_TOKEN
            });
        }

        // Hashuj token i znajdź użytkownika
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

        // Oznacz email jako zweryfikowany
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
/**
 * @route POST /api/v1/auth/resend-verification
 * @description Ponowne wysłanie linku weryfikacyjnego (rate limit: 5 min)
 * @access Public
 * @param {string} req.body.email - Adres email
 */
router.post("/resend-verification", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                code: "EMAIL_REQUIRED",
                message: "Adres e-mail jest wymagany."
            });
        }

        const user = await User.findOne({ email }).select("+emailVerificationLastSent");

        // Bezpieczna odpowiedź - nie ujawniaj czy konto istnieje
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

        // Rate limiting - max raz na 5 minut
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

        // Generuj nowy token
        const newToken = user.generateEmailVerificationToken();
        user.emailVerificationLastSent = new Date();
        await user.save({ validateBeforeSave: false });

        const verifyUrl = `${FRONTEND_BASE_URL}/verify-email?token=${newToken}`;

        // Wyślij email
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
/**
 * @route POST /api/v1/auth/forgot-password
 * @description Wysłanie linku do resetu hasła
 * @access Public
 * @param {string} req.body.email - Adres email
 */
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
        
        // Bezpieczna odpowiedź - nie ujawniaj czy konto istnieje
        if (!user) {
            return res.json({
                code: "FORGOT_PASSWORD_EMAIL_SENT",
                message: "Jeśli konto z tym adresem istnieje, wysłaliśmy instrukcje resetu hasła."
            });
        }

        // Generuj token resetu (ważny 1h)
        const resetToken = user.generatePasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${FRONTEND_BASE_URL}/reset-password?token=${resetToken}`;

        // Wyślij email z linkiem do resetu
        try {
            await sendPasswordResetEmail(user.email, user.username, resetToken);
        } catch (emailError) {
            console.error("Błąd wysyłania emaila resetującego hasło:", emailError);
        }

        res.json({
            code: "FORGOT_PASSWORD_EMAIL_SENT",
            message: "Jeśli konto z tym adresem istnieje, wysłaliśmy instrukcje resetu hasła.",
            resetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined
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
/**
 * @route POST /api/v1/auth/reset-password
 * @description Reset hasła z tokenem z emaila
 * @access Public
 * @param {string} req.body.token - Token resetu
 * @param {string} req.body.newPassword - Nowe hasło (min 6 znaków)
 */
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

        // Hashuj token i znajdź użytkownika
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

        // Ustaw nowe hasło i wyczyść token
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
/**
 * @route GET /api/v1/auth/profile
 * @description Pobierz profil zalogowanego użytkownika
 * @access Private
 */
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
/**
 * @route POST /api/v1/auth/change-password
 * @description Zmiana hasła zalogowanego użytkownika
 * @access Private
 * @param {string} req.body.currentPassword - Obecne hasło
 * @param {string} req.body.newPassword - Nowe hasło (min 6 znaków)
 */
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

        // Sprawdź obecne hasło
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
/**
 * @route PUT /api/v1/auth/update-avatar
 * @description Aktualizacja avatara użytkownika
 * @access Private
 * @param {string} req.body.avatar - URL avatara
 */
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

// ======================= AKTUALIZACJA WIDOCZNOŚCI PROFILU =======================
/**
 * @route PUT /api/v1/auth/update-profile-visibility
 * @description Zmiana widoczności profilu (publiczny/prywatny)
 * @access Private
 * @param {boolean} req.body.isProfilePublic - Czy profil ma być publiczny
 */
router.put("/update-profile-visibility", authenticateToken, async (req, res) => {
    try {
        const { isProfilePublic } = req.body;

        if (typeof isProfilePublic !== "boolean") {
            return res.status(400).json({
                code: "VISIBILITY_INVALID",
                message: "Pole isProfilePublic musi być wartością true/false"
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                code: "USER_NOT_FOUND",
                message: "Użytkownik nie został znaleziony"
            });
        }

        user.isProfilePublic = isProfilePublic;
        await user.save();

        res.json({
            code: "VISIBILITY_UPDATED",
            message: isProfilePublic 
                ? "Twój profil jest teraz publiczny" 
                : "Twój profil jest teraz ukryty",
            isProfilePublic: user.isProfilePublic
        });
    } catch (error) {
        console.error("Update profile visibility error:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
});

// ======================= REFRESH TOKEN =======================
/**
 * @route POST /api/v1/auth/refresh
 * @description Odświeżenie tokena JWT
 * @access Public
 * @param {string} req.body.refreshToken - Token odświeżający
 * @returns {Object} accessToken, refreshToken
 */
router.post("/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                code: "REFRESH_TOKEN_MISSING",
                message: ERROR_MESSAGES.REFRESH_TOKEN_MISSING
            });
        }

        // Weryfikuj token
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

        // Generuj nową parę tokenów
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

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
/**
 * @route POST /api/v1/auth/logout
 * @description Wylogowanie użytkownika (unieważnienie refresh tokena)
 * @access Public
 * @param {string} req.body.refreshToken - Token do unieważnienia
 */
router.post("/logout", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            code: "LOGOUT_MISSING_TOKEN",
            message: "Brak tokena odświeżającego"
        });
    }

    // Token jest unieważniany po stronie klienta
    // Server nie przechowuje listy tokenów (stateless JWT)
    return res.json({
        code: "LOGOUT_SUCCESS",
        message: "Wylogowano pomyślnie"
    });
});

// ======================= HARD DELETE ACCOUNT =======================
/**
 * @route DELETE /api/v1/auth/delete-account
 * @description Trwałe usunięcie konta wraz ze wszystkimi danymi
 * @access Private
 * @param {string} req.body.password - Hasło do potwierdzenia
 * 
 * Cascade delete:
 * 1. Usuwa wszystkie przedmioty użytkownika
 * 2. Usuwa wszystkie kolekcje użytkownika
 * 3. Usuwa konto użytkownika
 */
router.delete("/delete-account", authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                code: "PASSWORD_REQUIRED",
                message: "Hasło jest wymagane do usunięcia konta"
            });
        }

        const user = await User.findById(req.user._id).select("+password");
        if (!user) {
            return res.status(404).json({
                code: "USER_NOT_FOUND",
                message: "Użytkownik nie został znaleziony"
            });
        }

        // Weryfikuj hasło
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                code: "INVALID_PASSWORD",
                message: "Nieprawidłowe hasło"
            });
        }

        // Import modeli do cascade delete
        const Collection = (await import("../models/Collection.js")).default;
        const Item = (await import("../models/Item.js")).default;

        // Usuń wszystkie przedmioty użytkownika
        const userCollections = await Collection.find({ owner: user._id }).select("_id");
        const collectionIds = userCollections.map(c => c._id);
        await Item.deleteMany({ parentCollection: { $in: collectionIds } });

        // Usuń wszystkie kolekcje użytkownika
        await Collection.deleteMany({ owner: user._id });

        // Usuń konto
        await User.findByIdAndDelete(user._id);

        res.json({
            code: "ACCOUNT_DELETED",
            message: "Twoje konto zostało trwale usunięte"
        });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
});

export default router;
