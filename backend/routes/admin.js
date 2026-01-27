/**
 * @fileoverview Routes panelu administratora
 * @description Endpointy administracyjne do zarządzania użytkownikami i kolekcjami.
 * Wszystkie endpointy wymagają autentykacji i roli admin.
 * 
 * @module routes/admin
 * 
 * @routes
 * GET    /users              - Lista użytkowników (paginacja, wyszukiwanie)
 * POST   /users/:id/block    - Zablokuj użytkownika (usuwa kolekcje i przedmioty)
 * POST   /users/:id/unblock  - Odblokuj użytkownika
 * GET    /collections        - Lista wszystkich kolekcji (publiczne/prywatne)
 * 
 * @access Admin only - wszystkie endpointy chronione przez authenticateToken + checkAdmin
 */

import express from "express";
import User from "../models/User.js";
import Collection from "../models/Collection.js";
import Item from "../models/Item.js";
import authenticateToken from "../middleware/authenticateToken.js";
import checkAdmin from "../middleware/checkAdmin.js";
import mongoose from "mongoose";

const router = express.Router();

// Wszystkie endpointy wymagają autentykacji i uprawnień admina
router.use(authenticateToken, checkAdmin);

const handleError = (res, error, defaultMessage) => {
    console.error(error);
    res.status(500).json({
        code: "ADMIN_ERROR",
        message: error.message || defaultMessage
    });
};

// ======================= LISTA UŻYTKOWNIKÓW =======================
router.get("/users", async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const filter = {};
        if (search) {
            filter.username = { $regex: search, $options: "i" };
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("username email role isActive lastLogin createdAt")
                .sort("-createdAt")
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            User.countDocuments(filter)
        ]);

        res.json({
            code: "USERS_FETCHED",
            users,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
                limit: Number(limit)
            }
        });
    } catch (error) {
        handleError(res, error, "Błąd pobierania listy użytkowników");
    }
});

// ======================= BLOKADA UŻYTKOWNIKA =======================
router.post("/users/:id/block", async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                code: "INVALID_ID_FORMAT",
                message: "Nieprawidłowy format identyfikatora użytkownika"
            });
        }

        // Sprawdź czy użytkownik istnieje
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                code: "USER_NOT_FOUND",
                message: "Użytkownik nie istnieje"
            });
        }

        // Nie można zablokować admina
        if (user.role === "admin") {
            return res.status(403).json({
                code: "CANNOT_BLOCK_ADMIN",
                message: "Nie można zablokować konta administratora"
            });
        }

        // Sprawdź czy użytkownik nie jest już zablokowany
        if (!user.isActive) {
            return res.status(400).json({
                code: "USER_ALREADY_BLOCKED",
                message: "Użytkownik jest już zablokowany"
            });
        }

        // Pobierz kolekcje użytkownika do usunięcia itemów
        const userCollections = await Collection.find({ owner: userId }).select("_id");
        const collectionIds = userCollections.map(c => c._id);

        // Usuń wszystkie itemy z kolekcji użytkownika
        const deletedItemsResult = await Item.deleteMany({
            parentCollection: { $in: collectionIds }
        });

        // Usuń wszystkie kolekcje użytkownika
        const deletedCollectionsResult = await Collection.deleteMany({ owner: userId });

        // Zablokuj użytkownika
        user.isActive = false;
        await user.save();

        res.json({
            code: "USER_BLOCKED",
            message: "Użytkownik został zablokowany, jego kolekcje i przedmioty zostały usunięte",
            deletedCollections: deletedCollectionsResult.deletedCount,
            deletedItems: deletedItemsResult.deletedCount
        });
    } catch (error) {
        handleError(res, error, "Błąd blokowania użytkownika");
    }
});

// ======================= ODBLOKOWANIE UŻYTKOWNIKA =======================
router.post("/users/:id/unblock", async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                code: "INVALID_ID_FORMAT",
                message: "Nieprawidłowy format identyfikatora użytkownika"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                code: "USER_NOT_FOUND",
                message: "Użytkownik nie istnieje"
            });
        }

        if (user.isActive) {
            return res.status(400).json({
                code: "USER_NOT_BLOCKED",
                message: "Użytkownik nie jest zablokowany"
            });
        }

        user.isActive = true;
        await user.save();

        res.json({
            code: "USER_UNBLOCKED",
            message: "Użytkownik został odblokowany"
        });
    } catch (error) {
        handleError(res, error, "Błąd odblokowywania użytkownika");
    }
});

// ======================= WSZYSTKIE KOLEKCJE =======================
router.get("/collections", async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const [collections, total] = await Promise.all([
            Collection.find(filter)
                .populate("owner", "username")
                .populate("category", "name")
                .select("name description privacy owner category views likesCount createdAt")
                .sort("-createdAt")
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Collection.countDocuments(filter)
        ]);

        // Dodaj liczbę itemów do każdej kolekcji
        const collectionsWithStats = await Promise.all(
            collections.map(async (collection) => {
                const itemsCount = await Item.countDocuments({
                    parentCollection: collection._id
                });
                return {
                    ...collection,
                    itemsCount
                };
            })
        );

        res.json({
            code: "ADMIN_COLLECTIONS_FETCHED",
            collections: collectionsWithStats,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
                limit: Number(limit)
            }
        });
    } catch (error) {
        handleError(res, error, "Błąd pobierania kolekcji");
    }
});

export default router;
