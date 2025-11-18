import express from "express";
        import jwt from "jsonwebtoken";
        import User from "../models/User.js";
        import authenticateToken from "../middleware/authenticateToken.js";

        const router = express.Router();
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) throw new Error("Brak konfiguracji JWT_SECRET");

        const ERROR_MESSAGES = {
            MISSING_FIELDS: "Wymagane pola: nazwa użytkownika, hasło i email",
            INVALID_EMAIL: "Nieprawidłowy format email",
            USER_EXISTS: "Nazwa użytkownika lub email jest już zajęty",
            LOGIN_FAILED: "Nieprawidłowe dane logowania",
            SERVER_ERROR: "Błąd serwera"
        };

        const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        router.post("/login", async (req, res) => {
            try {
                const { username, password } = req.body;

                const user = await User.findOne({ username }).select("+password");
                if (!user || !(await user.comparePassword(password))) {
                    return res.status(401).json({
                        code: "INVALID_CREDENTIALS",
                        message: "Nieprawidłowe dane logowania"
                    });
                }

                let accessToken, refreshToken;
                try {
                    accessToken = jwt.sign(
                        { id: user._id, role: user.role },
                        JWT_SECRET,
                        { expiresIn: "15m" }
                    );

                    refreshToken = jwt.sign(
                        { id: user._id },
                        JWT_SECRET,
                        { expiresIn: "7d" }
                    );
                } catch (error) {
                    return res.status(500).json({
                        code: "TOKEN_GENERATION_ERROR",
                        message: "Błąd generowania tokenów"
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
                res.status(500).json({
                    code: "SERVER_ERROR",
                    message: "Błąd serwera"
                });
            }
        });

        router.post("/register", async (req, res) => {
            try {
                const { username, password, email } = req.body;

                if (!username || !password || !email) {
                    return res.status(400).json({
                        code: "REGISTER_MISSING_FIELDS",
                        message: ERROR_MESSAGES.MISSING_FIELDS
                    });
                }

                if (!isValidEmail(email)) {
                    return res.status(400).json({
                        code: "REGISTER_INVALID_EMAIL",
                        message: ERROR_MESSAGES.INVALID_EMAIL
                    });
                }

                const existingUser = await User.findOne({
                    $or: [{ username }, { email }]
                });

                if (existingUser) {
                    return res.status(409).json({
                        code: "REGISTER_USER_EXISTS",
                        message: ERROR_MESSAGES.USER_EXISTS
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

        export default router;