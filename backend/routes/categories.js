import express from "express";
import Category from "../models/Category.js";
import Collection from "../models/Collection.js";
import authenticateToken from "../middleware/authenticateToken.js";
import checkAdmin from "../middleware/checkAdmin.js";
import mongoose from "mongoose";

const router = express.Router();

const handleError = (res, error, defaultMessage) => {
    console.error(error);

    const response = {
        code: "CATEGORY_ERROR",
        message: error.message || defaultMessage
    };

    if (error.name === "ValidationError") {
        response.details = Object.values(error.errors).map(e => e.message);
        return res.status(400).json(response);
    }

    res.status(500).json(response);
};

router.post("/", authenticateToken, checkAdmin, async (req, res) => {
    try {
        const category = new Category({
            name: req.body.name,
            description: req.body.description,
            attributes: req.body.attributes
        });

        const savedCategory = await category.save();
        res.status(201).json({
            code: "CATEGORY_CREATED",
            category: savedCategory.toJSON()
        });
    } catch (error) {
        handleError(res, error, "Błąd tworzenia kategorii");
    }
});

router.get("/", async (req, res) => {
    try {
        const categories = await Category.find()
            .sort("-createdAt")
            .lean();

        res.json({
            code: "CATEGORIES_FETCHED",
            count: categories.length,
            categories
        });
    } catch (error) {
        handleError(res, error, "Błąd pobierania kategorii");
    }
});

router.get("/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                code: "INVALID_ID_FORMAT",
                message: "Nieprawidłowy format identyfikatora kategorii"
            });
        }

        const category = await Category.findById(categoryId).lean();

        if (!category) {
            return res.status(404).json({
                code: "CATEGORY_NOT_FOUND",
                message: "Kategoria o podanym ID nie istnieje"
            });
        }

        res.json({
            code: "CATEGORY_FETCHED",
            message: "Pomyślnie pobrano kategorię",
            data: {
                _id: category._id,
                name: category.name,
                description: category.description,
                attributes: category.attributes,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt
            }
        });

    } catch (error) {
        handleError(res, error, "Błąd pobierania kategorii");
    }
});

router.patch("/:id", authenticateToken, checkAdmin, async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            description: req.body.description,
            attributes: req.body.attributes
        };

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).lean();

        if (!category) {
            return res.status(404).json({
                code: "CATEGORY_NOT_FOUND",
                message: "Kategoria nie istnieje"
            });
        }

        res.json({
            code: "CATEGORY_UPDATED",
            category
        });
    } catch (error) {
        handleError(res, error, "Błąd aktualizacji kategorii");
    }
});

router.get('/:id/collections', async (req, res) => {
    try {
        const categoryId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                code: 'INVALID_ID_FORMAT',
                message: 'Nieprawidłowy format identyfikatora kategorii'
            });
        }

        if (page < 1 || limit < 1) {
            return res.status(400).json({
                code: 'INVALID_PAGINATION',
                message: 'Parametry paginacji muszą być liczbami większymi od 0'
            });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                code: 'CATEGORY_NOT_FOUND',
                message: 'Kategoria nie istnieje'
            });
        }

        const [collections, total] = await Promise.all([
            Collection.find({
                category: categoryId,
                privacy: 'public'
            })
                .populate('owner', 'username')
                .populate('category', 'name')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .lean(),

            Collection.countDocuments({
                category: categoryId,
                privacy: 'public'
            })
        ]);

        res.json({
            code: 'CATEGORY_COLLECTIONS_FETCHED',
            message: 'Pomyślnie pobrano kolekcje kategorii',
            data: {
                category: {
                    _id: category._id,
                    name: category.name,
                    description: category.description
                },
                collections
            },
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        });

    } catch (error) {
        handleError(res, error, 'Błąd pobierania kolekcji w kategorii');
    }
});

router.delete("/:id", authenticateToken, checkAdmin, async (req, res) => {
    try {
        const categoryInUse = await Collection.exists({ category: req.params.id });

        if (categoryInUse) {
            return res.status(400).json({
                code: "CATEGORY_IN_USE",
                message: "Nie można usunąć kategorii używanej w kolekcjach"
            });
        }

        const deletedCategory = await Category.findByIdAndDelete(req.params.id);

        if (!deletedCategory) {
            return res.status(404).json({
                code: "CATEGORY_NOT_FOUND",
                message: "Kategoria nie istnieje"
            });
        }

        res.status(204).end();
    } catch (error) {
        handleError(res, error, "Błąd usuwania kategorii");
    }
});

export default router;