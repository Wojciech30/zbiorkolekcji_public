import mongoose from "mongoose";
import Collection from "../models/Collection.js";
import User from "../models/User.js";

export const verifyCollectionAccess = async (req, res, next) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate("category", "name attributes")
      .populate("allowedUsers", "username email");

    if (!collection) {
      return res.status(404).json({
        code: "COLLECTION_NOT_FOUND",
        message: "Kolekcja nie istnieje"
      });
    }

    if (collection.privacy === "public") {
      req.collection = collection;
      return next();
    }

    const userId = req.user?._id ? req.user._id.toString() : null;

    if (!userId) {
      return res.status(401).json({
        code: "AUTH_REQUIRED",
        message: "Ta kolekcja jest prywatna. Zaloguj się, aby uzyskać dostęp."
      });
    }

    const isOwner = collection.owner.toString() === userId;
    const isAdmin = req.user?.role === "admin";
    const isAllowed = collection.allowedUsers.some(u => u._id.toString() === userId);

    if (!isOwner && !isAdmin && !isAllowed) {
      return res.status(403).json({
        code: "COLLECTION_ACCESS_DENIED",
        message: "Nie masz dostępu do tej kolekcji"
      });
    }

    req.collection = collection;
    next();
  } catch (error) {
    console.error("Błąd weryfikacji dostępu:", error);
    res.status(500).json({
      code: "SERVER_ERROR",
      message: "Wewnętrzny błąd serwera"
    });
  }
};

export const verifyCollectionOwnership = (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        code: "AUTH_REQUIRED",
        message: "Wymagana autentykacja"
      });
    }

    if (!req.collection) {
      return res.status(500).json({
        code: "SERVER_ERROR",
        message: "Brak kolekcji w kontekście żądania"
      });
    }

    const userId = req.user._id.toString();
    const isOwner = req.collection.owner.toString() === userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        code: "FORBIDDEN_RESOURCE_ACCESS",
        message: "Brak uprawnień do modyfikacji kolekcji"
      });
    }

    next();
  } catch (error) {
    console.error("Błąd weryfikacji właściciela:", error);
    res.status(500).json({
      code: "SERVER_ERROR",
      message: "Błąd serwera podczas weryfikacji uprawnień"
    });
  }
};

export const validateAllowedUsers = async (req, res, next) => {
  try {
    const { privacy, allowedUsers } = req.body;

    if (privacy === "public" && Array.isArray(allowedUsers) && allowedUsers.length > 0) {
      return res.status(400).json({
        code: "PUBLIC_COLLECTION_CONFLICT",
        message: "Kolekcja publiczna nie może mieć przypisanych użytkowników"
      });
    }

    if (privacy !== "private") {
      return next();
    }

    if (!allowedUsers) {
      return next();
    }

    if (!Array.isArray(allowedUsers)) {
      return res.status(400).json({
        code: "ALLOWED_USERS_INVALID",
        message: "allowedUsers musi być tablicą identyfikatorów użytkowników"
      });
    }

    const invalidIds = allowedUsers.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        code: "ALLOWED_USERS_INVALID_IDS",
        message: "allowedUsers zawiera nieprawidłowe identyfikatory",
        invalidIds
      });
    }

    const requesterId = req.user?._id ? req.user._id.toString() : null;

    const users = await User.find({ _id: { $in: allowedUsers } }).select("_id isActive");
    const existingIds = new Set(users.map(u => u._id.toString()));

    const missing = allowedUsers.filter(id => !existingIds.has(id.toString()));
    if (missing.length > 0) {
      return res.status(400).json({
        code: "ALLOWED_USERS_NOT_FOUND",
        message: "Wskazani użytkownicy nie istnieją",
        missing
      });
    }

    const inactive = users.filter(u => u.isActive === false).map(u => u._id.toString());
    if (inactive.length > 0) {
      return res.status(400).json({
        code: "ALLOWED_USERS_INACTIVE",
        message: "Nie można dodać nieaktywnych użytkowników",
        inactive
      });
    }

    if (requesterId && allowedUsers.some(id => id.toString() === requesterId)) {
      return res.status(400).json({
        code: "ALLOWED_USERS_SELF",
        message: "Nie możesz dodać samego siebie do listy dostępu"
      });
    }

    next();
  } catch (error) {
    console.error("Błąd walidacji użytkowników:", error);
    res.status(500).json({
      code: "SERVER_ERROR",
      message: "Błąd serwera podczas walidacji"
    });
  }
};
