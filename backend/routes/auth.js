import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authenticateToken from "../middleware/authenticateToken.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Brak konfiguracji JWT_SECRET");

// Centralne definicje komunikatów
const ERROR_MESSAGES = {
    REGISTER_MISSING_FIELDS: "Wymagane pola: nazwa użytkownika, hasło i email",
    REGISTER_INVALID_EMAIL: "Nieprawidłowy format email",
    REGISTER_USER_EXISTS: "Nazwa użytkownika lub email jest już zajęty",
    REGISTER_PASSWORD_TOO_WEAK: "Hasło musi mieć co najmniej 6 znaków",

    LOGIN_MISSING_FIELDS: "Wymagane pola: login (email lub nazwa użytkownika) oraz hasło",
    LOGIN_FAILED: "Nieprawidłowe dane logowania",

    TOKEN_GENERATION_ERROR: "Błąd generowania tokenów",
    SERVER_ERROR: "Błąd serwera",

    REFRESH_TOKEN_MISSING: "Brak tokena odświeżającego",
    REFRESH_TOKEN_INVALID: "Nieprawidłowy token odświeżający",
    REFRESH_TOKEN_EXPIRED: "Token odświeżający wygasł",

    PROFILE_NO_FIELDS: "Brak danych do aktualizacji",
    PROFILE_INVALID_EMAIL: "Nieprawidłowy format email",
    PROFILE_CONFLICT: "Nazwa użytkownika lub email jest już zajęty",

    CHANGE_PASSWORD_MISSING_FIELDS: "Wymagane pola: obecne hasło i nowe hasło",
    CHANGE_PASSWORD_INVALID_CURRENT: "Obecne hasło jest nieprawidłowe",
    CHANGE_PASSWORD_TOO_WEAK: "Nowe hasło musi mieć co najmniej 6 znaków"
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Funkcja generująca tokeny
const generateTokens = (user) => {
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
                role: user.role
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

        const newUser = await User.create({
            username,
            password,
            email
        });

        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
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

// ======================= PROFIL (GET) =======================
router.get("/profile", authenticateToken, (req, res) => {
    const safeUserData = {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt
    };

    res.json(safeUserData);
});

// ======================= PROFIL (PATCH) =======================
router.patch("/profile", authenticateToken, async (req, res) => {
    try {
        const { username, email } = req.body;

        if (!username && !email) {
            return res.status(400).json({
                code: "PROFILE_NO_FIELDS",
                message: ERROR_MESSAGES.PROFILE_NO_FIELDS
            });
        }

        const updateData = {};

        if (username) {
            updateData.username = username;
        }

        if (email) {
            if (!isValidEmail(email)) {
                return res.status(400).json({
                    code: "PROFILE_INVALID_EMAIL",
                    message: ERROR_MESSAGES.PROFILE_INVALID_EMAIL
                });
            }
            updateData.email = email;
        }

        if (username || email) {
            const conflictUser = await User.findOne({
                $or: [
                    username ? { username } : null,
                    email ? { email } : null
                ].filter(Boolean),
                _id: { $ne: req.user._id }
            });

            if (conflictUser) {
                return res.status(409).json({
                    code: "PROFILE_CONFLICT",
                    message: ERROR_MESSAGES.PROFILE_CONFLICT
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                code: "USER_NOT_FOUND",
                message: "Użytkownik nie został znaleziony"
            });
        }

        res.json({
            id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt
        });

    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
});

// ======================= ZMIANA HASŁA =======================
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

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(
            user
        );

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
