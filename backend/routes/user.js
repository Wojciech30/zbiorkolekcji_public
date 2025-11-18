import express from "express";
import User from "../models/User.js";
import authenticateToken from "../middleware/authenticateToken.js";
import adminCheck from "../middleware/checkAdmin.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";
const TOKEN_EXPIRATION = "2h";

// Rejestracja
router.post("/register", async (req, res) => {
    try {
        const { username, password, email } = req.body;

        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({
                error: "Nazwa użytkownika lub email już istnieje",
                code: "USER_EXISTS"
            });
        }

        const newUser = await User.create({
            username,
            password,
            email
        });

        res.status(201).json(newUser.toProfile());
    } catch (error) {
        res.status(400).json({
            error: "Błąd walidacji danych",
            details: error.errors
        });
    }
});

// Logowanie
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username })
            .select("+password")
            .exec();

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                error: "Nieprawidłowe dane logowania",
                code: "INVALID_CREDENTIALS"
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRATION }
        );

        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        res.json({
            token,
            expiresIn: 7200, // 2h w sekundach
            user: user.toProfile()
        });
    } catch (error) {
        res.status(500).json({
            error: "Błąd serwera podczas logowania",
            code: "LOGIN_ERROR"
        });
    }
});

// Profil użytkownika
router.get("/me", authenticateToken, (req, res) => {
    res.json(req.user.toProfile());
});

// Zarządzanie użytkownikami (tylko admin)
router.get("/users", authenticateToken, adminCheck, async (req, res) => {
    try {
        const users = await User.find()
            .sort("-createdAt")
            .lean();

        res.json(users.map(u => ({
            id: u._id,
            username: u.username,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt
        })));
    } catch (error) {
        res.status(500).json({
            error: "Błąd pobierania użytkowników",
            code: "USER_FETCH_ERROR"
        });
    }
});

export default router;