import express from "express";
import Item from "../models/Item.js";
import Collection from "../models/Collection.js";
import Category from "../models/Category.js";
import authenticateToken from "../middleware/authenticateToken.js";
import verifyCollectionOwnerOnly from "../middleware/verifyCollectionOwnerOnly.js";

const router = express.Router();

const handleError = (res, error, defaultMessage) => {
    console.error(error);
    const response = {
        code: "ITEM_ERROR",
        message: error.message || defaultMessage,
    };
    if (error.name === "ValidationError") {
        response.details = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json(response);
    }
    res.status(500).json(response);
};

const setParentCollectionForUpdate = async (req, res, next) => {
    if (!req.body.parentCollection) {
        const item = await Item.findById(req.params.id);
        if (item) {
            req.body.parentCollection = item.parentCollection;
        }
    }
    next();
};

const validateAttributes = async (req, res, next) => {
    try {
        const collection = await Collection.findById(req.body.parentCollection).populate("category");
        if (!collection) {
            return res.status(404).json({
                code: "COLLECTION_NOT_FOUND",
                message: "Kolekcja nie istnieje",
            });
        }
        const category = await Category.findById(collection.category);
        const attributesSchema = new Map(category.attributes.map(attr => [attr.name, attr]));
        const errors = [];
        const attributes = req.body.attributes || {};
        for (const [name, schema] of attributesSchema) {
            if (schema.required && !(name in attributes)) {
                errors.push(`Atrybut '${name}' jest wymagany`);
            }
        }
        for (const [name, value] of Object.entries(attributes)) {
            const schema = attributesSchema.get(name);
            if (!schema) {
                errors.push(`Nieznany atrybut '${name}'`);
                continue;
            }
            let actualValue;
            let actualType = schema.type;
            if (value && typeof value === "object" && "value" in value) {
                actualValue = value.value;
                if (value.type && value.type !== schema.type) {
                    errors.push(`Nieprawidłowy typ dla atrybutu '${name}'. Oczekiwano ${schema.type}, otrzymano ${value.type}.`);
                }
            } else {
                actualValue = value;
            }

            if (schema.type === 'number') {
                actualValue = Number(actualValue);
                if (isNaN(actualValue)) {
                    errors.push(`Nieprawidłowa wartość liczbowa dla atrybutu '${name}'.`);
                }
            }
            else if (schema.type === 'boolean') {
                actualValue = String(actualValue).toLowerCase() === 'true';
            }

            if (typeof actualValue !== schema.type && schema.type !== 'select') {
                errors.push(`Nieprawidłowy typ dla atrybutu '${name}'. Oczekiwano ${schema.type}, otrzymano ${typeof actualValue}.`);
            }
            if (schema.type !== "select" && typeof actualValue !== schema.type) {
                errors.push(
                    `Nieprawidłowy typ dla atrybutu '${name}'. Oczekiwano ${schema.type}, otrzymano ${typeof actualValue}.`
                );
            }
        }
        if (errors.length > 0) {
            return res.status(400).json({
                code: "INVALID_ATTRIBUTES",
                message: "Błędy w atrybutach",
                errors,
            });
        }
        req.collection = collection;
        next();
    } catch (error) {
        handleError(res, error, "Błąd walidacji atrybutów");
    }
};

router.post("/", authenticateToken, validateAttributes, verifyCollectionOwnerOnly, async (req, res) => {
    try {
        const item = await Item.create({
            ...req.body,
            createdBy: req.user._id,
        });
        res.status(201).json({
            code: "ITEM_CREATED",
            item: item.toJSON(),
        });
    } catch (error) {
        handleError(res, error, "Błąd tworzenia przedmiotu");
    }
});

router.get("/:id", async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate("parentCollection", "name")
            .populate("createdBy", "username email")
            .lean();
        if (!item) {
            return res.status(404).json({
                code: "ITEM_NOT_FOUND",
                message: "Przedmiot nie istnieje",
            });
        }
        res.json({
            code: "ITEM_FETCHED",
            item,
        });
    } catch (error) {
        handleError(res, error, "Błąd pobierania przedmiotu");
    }
});

router.patch(
    "/:id",
    authenticateToken,
    setParentCollectionForUpdate,
    validateAttributes,
    async (req, res) => {
        try {
            const item = await Item.findById(req.params.id);
            if (!item) {
                return res.status(404).json({
                    code: "ITEM_NOT_FOUND",
                    message: "Przedmiot nie istnieje",
                });
            }
            const isOwner = item.createdBy.toString() === req.user._id.toString();
            const isAdmin = req.user.role === "admin";
            const canEdit = isOwner || isAdmin || req.collection.privacy === "public";
            if (!canEdit) {
                return res.status(403).json({
                    code: "EDIT_DENIED",
                    message: "Brak uprawnień do edycji",
                });
            }

            // Pobierz definicje atrybutów z kategorii
            const categoryAttributes = req.collection.category.attributes;
            // Pobierz istniejące atrybuty z przedmiotu (jako obiekt zwykły)
            const existingAttributes = item.attributes ? item.attributes.toObject() : {};
            // Pobierz atrybuty przesłane w żądaniu
            const incomingAttributes = req.body.attributes || {};

            // Budujemy nowy obiekt atrybutów
            const mergedAttributes = {};
            for (const attrDef of categoryAttributes) {
                const key = attrDef.name;
                let oldValue = existingAttributes[key];
                let incoming = incomingAttributes[key];
                if (incoming === undefined) {
                    // Jeśli nie przesłano atrybutu, zachowujemy starą wartość lub ustawiamy domyślnie
                    mergedAttributes[key] =
                        oldValue || { type: attrDef.type, value: attrDef.type === "number" ? 0 : "" };
                } else if (typeof incoming === "object" && incoming !== null && "value" in incoming) {
                    mergedAttributes[key] = incoming;
                } else {
                    mergedAttributes[key] = { type: attrDef.type, value: incoming };
                }
            }
            req.body.attributes = mergedAttributes;

            const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true,
            });
            res.json({
                code: "ITEM_UPDATED",
                item: updatedItem.toJSON(),
            });
        } catch (error) {
            handleError(res, error, "Błąd aktualizacji przedmiotu");
        }
    }
);

router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                code: "ITEM_NOT_FOUND",
                message: "Przedmiot nie istnieje",
            });
        }
        const isOwner = item.createdBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                code: "DELETE_DENIED",
                message: "Brak uprawnień do usunięcia",
            });
        }
        await item.deleteOne();
        res.status(204).end();
    } catch (error) {
        handleError(res, error, "Błąd usuwania przedmiotu");
    }
});

router.get("/search", async (req, res) => {
    try {
        const { query, collection, category } = req.query;
        const searchFilter = {
            $text: { $search: query },
        };
        if (collection) searchFilter.collection = collection;
        if (category) {
            const collections = await Collection.find({ category }).distinct("_id");
            searchFilter.collection = { $in: collections };
        }
        const items = await Item.find(searchFilter)
            .populate("collection", "name")
            .limit(50)
            .lean();
        res.json({
            code: "ITEMS_FOUND",
            count: items.length,
            items,
        });
    } catch (error) {
        handleError(res, error, "Błąd wyszukiwania");
    }
});

export default router;
