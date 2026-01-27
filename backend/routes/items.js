/**
 * @fileoverview Routes przedmiotów
 * @description Endpointy CRUD dla przedmiotów w kolekcjach,
 * obsługa dynamicznych atrybutów, polubienia i komentarze.
 * 
 * @module routes/items
 * 
 * @routes
 * GET    /                     - Lista przedmiotów (opcjonalne: collectionId)
 * GET    /:id                  - Szczegóły przedmiotu
 * POST   /                     - Utwórz przedmiot (z walidacją atrybutów kategorii)
 * PUT    /:id                  - Aktualizuj przedmiot
 * DELETE /:id                  - Usuń przedmiot
 * GET    /:id/stats            - Statystyki przedmiotu
 * POST   /:id/like             - Polub przedmiot
 * DELETE /:id/like             - Cofnij polubienie
 * POST   /:id/comments         - Dodaj komentarz
 * DELETE /:id/comments/:commentId - Usuń komentarz
 * 
 * @helpers
 * - loadCollectionWithCategory - Ładuje kolekcję z kategorią
 * - canReadCollection - Sprawdza uprawnienia odczytu
 * - canWriteCollection - Sprawdza uprawnienia zapisu
 * - validateAndBuildAttributes - Waliduje atrybuty wg schematu kategorii
 */

import express from "express";
import mongoose from "mongoose";
import Item from "../models/Item.js";
import Collection from "../models/Collection.js";
import Category from "../models/Category.js";
import authenticateToken from "../middleware/authenticateToken.js";
import optionalAuthenticate from "../middleware/optionalAuthenticate.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

/**
 * Obsługa błędów z walidacją Mongoose
 * @param {Object} res - Response object
 * @param {Error} error - Błąd
 * @param {string} defaultMessage - Domyślny komunikat
 */

const handleError = (res, error, defaultMessage) => {
  console.error(error);
  const response = {
    code: "ITEM_ERROR",
    message: error?.message || defaultMessage
  };

  if (error?.name === "ValidationError") {
    response.details = Object.values(error.errors).map(e => e.message);
    return res.status(400).json(response);
  }

  return res.status(500).json(response);
};

const loadCollectionWithCategory = async (collectionId) => {
  const collection = await Collection.findById(collectionId).populate("category");
  if (!collection) return null;
  const category = await Category.findById(collection.category);
  return { collection, category };
};

const canReadCollection = (collection, user) => {
  if (!collection) return false;
  if (collection.privacy === "public") return true;

  if (!user) return false;

  const userId = user._id.toString();
  const isOwner = collection.owner.toString() === userId;
  const isAdmin = user.role === "admin";
  const isAllowed = (collection.allowedUsers || []).some(u => u.toString() === userId);

  return isOwner || isAdmin || isAllowed;
};

const canWriteCollection = (collection, user) => {
  if (!collection || !user) return false;
  const userId = user._id.toString();
  const isOwner = collection.owner.toString() === userId;
  const isAdmin = user.role === "admin";
  return isOwner || isAdmin;
};

// Normalizacja typu - 'text' jako alias dla 'string'
const normalizeType = (type) => {
  if (type === "text") return "string";
  return type;
};

const normalizeAttributesInput = (incomingAttributes) => {
  const attrs = incomingAttributes && typeof incomingAttributes === "object" ? incomingAttributes : {};
  const normalized = {};

  for (const [name, value] of Object.entries(attrs)) {
    if (value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "value")) {
      normalized[name] = {
        type: normalizeType(value.type),
        value: value.value
      };
    } else {
      normalized[name] = { value };
    }
  }

  return normalized;
};

const isValidUrl = (v) => typeof v === "string" && /^(http|https):\/\/[^ "]+$/.test(v);
const isValidDateString = (v) => typeof v === "string" && !Number.isNaN(Date.parse(v));

const castAndValidateValue = (schema, raw) => {
  const type = schema.type;

  if (type === "number") {
    const num = Number(raw);
    if (Number.isNaN(num)) return { ok: false, value: null, error: `Nieprawidłowa wartość liczbowa` };
    return { ok: true, value: num };
  }

  if (type === "boolean") {
    if (typeof raw === "boolean") return { ok: true, value: raw };
    const s = String(raw).toLowerCase();
    if (s === "true") return { ok: true, value: true };
    if (s === "false") return { ok: true, value: false };
    return { ok: false, value: null, error: `Nieprawidłowa wartość logiczna (true/false)` };
  }

  if (type === "date") {
    if (!isValidDateString(raw)) return { ok: false, value: null, error: `Nieprawidłowa data` };
    return { ok: true, value: String(raw) };
  }

  if (type === "url") {
    if (!isValidUrl(raw)) return { ok: false, value: null, error: `Nieprawidłowy URL` };
    return { ok: true, value: String(raw) };
  }

  if (type === "select") {
    const v = String(raw ?? "");
    const options = Array.isArray(schema.options) ? schema.options : [];
    if (!options.includes(v)) return { ok: false, value: null, error: `Wartość spoza dozwolonych opcji` };
    return { ok: true, value: v };
  }

  return { ok: true, value: String(raw ?? "") };
};

const validateAndBuildAttributes = (category, incomingAttributes, { mode, existingAttributes }) => {
  const defs = Array.isArray(category?.attributes) ? category.attributes : [];
  const normalizedIncoming = normalizeAttributesInput(incomingAttributes);
  const errors = [];
  const result = {};

  const existing = existingAttributes && typeof existingAttributes === "object"
    ? existingAttributes
    : {};

  for (const def of defs) {
    const key = def.name;

    const incoming = normalizedIncoming[key];
    const hasIncoming = incoming !== undefined;

    if (mode === "create") {
      if (def.required && (!hasIncoming || incoming.value === undefined || incoming.value === null || String(incoming.value).trim() === "")) {
        errors.push(`Atrybut '${key}' jest wymagany`);
        continue;
      }
    }

    if (!hasIncoming) {
      if (mode === "update") {
        const prev = existing[key];
        if (prev) {
          result[key] = prev;
          continue;
        }
        if (def.required) {
          errors.push(`Atrybut '${key}' jest wymagany`);
          continue;
        }
        continue;
      }

      if (def.required) {
        errors.push(`Atrybut '${key}' jest wymagany`);
      }
      continue;
    }

    const providedType = incoming.type;
    const normalizedDefType = normalizeType(def.type);
    if (providedType && normalizeType(providedType) !== normalizedDefType) {
      errors.push(`Nieprawidłowy typ dla atrybutu '${key}'. Oczekiwano ${def.type}, otrzymano ${providedType}.`);
    }

    const { ok, value, error } = castAndValidateValue({ ...def, type: normalizedDefType }, incoming.value);
    if (!ok) {
      errors.push(`Atrybut '${key}': ${error}`);
      continue;
    }

    result[key] = { type: normalizedDefType, value };
  }

  for (const key of Object.keys(normalizedIncoming)) {
    const existsInDefs = defs.some(d => d.name === key);
    if (!existsInDefs) errors.push(`Nieznany atrybut '${key}'`);
  }

  return { ok: errors.length === 0, errors, attributes: result };
};

const loadItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        code: "ITEM_NOT_FOUND",
        message: "Przedmiot nie istnieje"
      });
    }
    req.item = item;
    return next();
  } catch (error) {
    return handleError(res, error, "Błąd pobierania przedmiotu");
  }
};

const normalizeImagesInput = (body) => {
  const out = [];

  if (Array.isArray(body.images)) {
    for (const v of body.images) {
      if (typeof v === "string" && v.trim()) out.push(v.trim());
    }
  }

  if (typeof body.imageUrl === "string" && body.imageUrl.trim()) {
    out.push(body.imageUrl.trim());
  }

  return out;
};

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { parentCollection } = req.body;

    if (!parentCollection || !mongoose.Types.ObjectId.isValid(parentCollection)) {
      return res.status(400).json({
        code: "INVALID_COLLECTION_ID",
        message: "Nieprawidłowe parentCollection"
      });
    }

    const loaded = await loadCollectionWithCategory(parentCollection);
    if (!loaded) {
      return res.status(404).json({
        code: "COLLECTION_NOT_FOUND",
        message: "Kolekcja nie istnieje"
      });
    }

    const { collection, category } = loaded;

    if (!canWriteCollection(collection, req.user)) {
      return res.status(403).json({
        code: "ITEM_CREATE_FORBIDDEN",
        message: "Nie masz uprawnień do dodawania przedmiotów w tej kolekcji"
      });
    }

    const { ok, errors, attributes } = validateAndBuildAttributes(
      category,
      req.body.attributes,
      { mode: "create" }
    );

    if (!ok) {
      return res.status(400).json({
        code: "INVALID_ATTRIBUTES",
        message: "Błędy w atrybutach",
        errors
      });
    }

    const images = normalizeImagesInput(req.body);

    const item = await Item.create({
      name: req.body.name,
      description: req.body.description,
      parentCollection,
      images,
      attributes,
      createdBy: req.user._id
    });

    return res.status(201).json({
      code: "ITEM_CREATED",
      item: item.toJSON()
    });
  } catch (error) {
    return handleError(res, error, "Błąd tworzenia przedmiotu");
  }
});

router.get("/:id", validateObjectId, optionalAuthenticate, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate("parentCollection")
      .populate("createdBy", "username email")
      .lean();

    if (!item) {
      return res.status(404).json({
        code: "ITEM_NOT_FOUND",
        message: "Przedmiot nie istnieje"
      });
    }

    const collection = item.parentCollection;
    if (!canReadCollection(collection, req.user)) {
      return res.status(403).json({
        code: "COLLECTION_ACCESS_DENIED",
        message: "Nie masz dostępu do tej kolekcji"
      });
    }

    return res.json({
      code: "ITEM_FETCHED",
      item
    });
  } catch (error) {
    return handleError(res, error, "Błąd pobierania przedmiotu");
  }
});

router.patch("/:id", validateObjectId, authenticateToken, loadItem, async (req, res) => {
  try {
    const parentCollection = req.item.parentCollection;

    const loaded = await loadCollectionWithCategory(parentCollection);
    if (!loaded) {
      return res.status(404).json({
        code: "COLLECTION_NOT_FOUND",
        message: "Kolekcja nie istnieje"
      });
    }

    const { collection, category } = loaded;

    if (!canWriteCollection(collection, req.user)) {
      return res.status(403).json({
        code: "ITEM_UPDATE_FORBIDDEN",
        message: "Nie masz uprawnień do edycji przedmiotów w tej kolekcji"
      });
    }

    const existingAttributes = req.item.attributes ? req.item.attributes.toObject() : {};
    const incomingAttributes = req.body.attributes;

    let attributes = existingAttributes;
    if (incomingAttributes !== undefined) {
      const validated = validateAndBuildAttributes(
        category,
        incomingAttributes,
        { mode: "update", existingAttributes }
      );

      if (!validated.ok) {
        return res.status(400).json({
          code: "INVALID_ATTRIBUTES",
          message: "Błędy w atrybutach",
          errors: validated.errors
        });
      }

      attributes = validated.attributes;
    }

    const allowedUpdates = ["name", "description"];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (req.body.images !== undefined || req.body.imageUrl !== undefined) {
      updates.images = normalizeImagesInput(req.body);
    }

    updates.attributes = attributes;

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    return res.json({
      code: "ITEM_UPDATED",
      item: updatedItem.toJSON()
    });
  } catch (error) {
    return handleError(res, error, "Błąd aktualizacji przedmiotu");
  }
});

router.delete("/:id", validateObjectId, authenticateToken, loadItem, async (req, res) => {
  try {
    const loaded = await loadCollectionWithCategory(req.item.parentCollection);
    if (!loaded) {
      return res.status(404).json({
        code: "COLLECTION_NOT_FOUND",
        message: "Kolekcja nie istnieje"
      });
    }

    const { collection } = loaded;

    if (!canWriteCollection(collection, req.user)) {
      return res.status(403).json({
        code: "ITEM_DELETE_FORBIDDEN",
        message: "Nie masz uprawnień do usunięcia przedmiotu w tej kolekcji"
      });
    }

    await req.item.deleteOne();
    return res.status(204).end();
  } catch (error) {
    return handleError(res, error, "Błąd usuwania przedmiotu");
  }
});

router.get("/search", async (req, res) => {
  try {
    const { query, parentCollection, category } = req.query;

    const filter = {};
    if (query && String(query).trim()) {
      filter.$text = { $search: String(query).trim() };
    }

    if (parentCollection) {
      filter.parentCollection = parentCollection;
    }

    if (category) {
      const collections = await Collection.find({ category }).distinct("_id");
      filter.parentCollection = { $in: collections };
    }

    const items = await Item.find(filter)
      .populate("parentCollection", "name")
      .limit(50)
      .lean();

    return res.json({
      code: "ITEMS_FOUND",
      count: items.length,
      items
    });
  } catch (error) {
    return handleError(res, error, "Błąd wyszukiwania");
  }
});

// ======================= POLUBIENIA PRZEDMIOTÓW =======================
router.post("/:id/like", validateObjectId, authenticateToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).select("likes likesCount parentCollection");
    if (!item) {
      return res.status(404).json({
        code: "ITEM_NOT_FOUND",
        message: "Przedmiot nie istnieje"
      });
    }

    const collection = await Collection.findById(item.parentCollection);
    if (!canReadCollection(collection, req.user)) {
      return res.status(403).json({
        code: "COLLECTION_ACCESS_DENIED",
        message: "Nie masz dostępu do tej kolekcji"
      });
    }

    const userId = req.user._id;
    const hasLiked = item.likes.some(id => id.equals(userId));

    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      hasLiked
        ? { $pull: { likes: userId }, $inc: { likesCount: -1 } }
        : { $addToSet: { likes: userId }, $inc: { likesCount: 1 } },
      { new: true }
    ).select("likesCount");

    res.json({
      code: "ITEM_LIKE_UPDATED",
      liked: !hasLiked,
      likesCount: updated.likesCount
    });
  } catch (error) {
    return handleError(res, error, "Błąd aktualizacji polubień");
  }
});

// ======================= KOMENTARZE PRZEDMIOTÓW =======================
router.get("/:id/comments", validateObjectId, optionalAuthenticate, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .select("comments parentCollection")
      .populate("comments.user", "username");

    if (!item) {
      return res.status(404).json({
        code: "ITEM_NOT_FOUND",
        message: "Przedmiot nie istnieje"
      });
    }

    const collection = await Collection.findById(item.parentCollection);
    if (!canReadCollection(collection, req.user)) {
      return res.status(403).json({
        code: "COLLECTION_ACCESS_DENIED",
        message: "Nie masz dostępu do tej kolekcji"
      });
    }

    res.json({
      code: "ITEM_COMMENTS_FETCHED",
      comments: item.comments
    });
  } catch (error) {
    return handleError(res, error, "Błąd pobierania komentarzy");
  }
});

router.post("/:id/comments", validateObjectId, authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        code: "COMMENT_TEXT_REQUIRED",
        message: "Treść komentarza jest wymagana"
      });
    }

    const item = await Item.findById(req.params.id).select("parentCollection");
    if (!item) {
      return res.status(404).json({
        code: "ITEM_NOT_FOUND",
        message: "Przedmiot nie istnieje"
      });
    }

    const collection = await Collection.findById(item.parentCollection);
    if (!canReadCollection(collection, req.user)) {
      return res.status(403).json({
        code: "COLLECTION_ACCESS_DENIED",
        message: "Nie masz dostępu do tej kolekcji"
      });
    }

    const newComment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };

    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: newComment } },
      { new: true }
    ).populate("comments.user", "username");

    const addedComment = updated.comments[updated.comments.length - 1];

    res.status(201).json({
      code: "COMMENT_ADDED",
      comment: addedComment
    });
  } catch (error) {
    return handleError(res, error, "Błąd dodawania komentarza");
  }
});

router.delete("/:id/comments/:commentId", validateObjectId, authenticateToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).select("comments parentCollection");
    if (!item) {
      return res.status(404).json({
        code: "ITEM_NOT_FOUND",
        message: "Przedmiot nie istnieje"
      });
    }

    const comment = item.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        code: "COMMENT_NOT_FOUND",
        message: "Komentarz nie istnieje"
      });
    }

    const collection = await Collection.findById(item.parentCollection);
    const isOwner = collection.owner.equals(req.user._id);
    const isAuthor = comment.user.equals(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAuthor && !isAdmin) {
      return res.status(403).json({
        code: "COMMENT_DELETE_FORBIDDEN",
        message: "Nie masz uprawnień do usunięcia tego komentarza"
      });
    }
    // Use pull() to remove subdocument from array (Mongoose 6+ compatible)
    item.comments.pull(req.params.commentId);
    await item.save();

    res.json({
      code: "COMMENT_DELETED",
      commentId: req.params.commentId
    });
  } catch (error) {
    return handleError(res, error, "Błąd usuwania komentarza");
  }
});

export default router;

