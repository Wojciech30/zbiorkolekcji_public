/**
 * @fileoverview Middleware uprawnień do kolekcji
 * @description Zestaw middleware do weryfikacji dostępu i własności
 * kolekcji. Uwzględnia prywatność, allowed users i role admina.
 * 
 * @module middleware/collectionMiddleware
 */

import mongoose from "mongoose";
import Collection from "../models/Collection.js";
import User from "../models/User.js";

/**
 * Middleware weryfikacji dostępu do kolekcji
 * 
 * @description
 * Sprawdza czy użytkownik może CZYTAĆ kolekcję:
 * - Publiczne kolekcje: dostęp dla wszystkich
 * - Prywatne kolekcje: tylko właściciel, admin lub użytkownik z allowedUsers
 * 
 * Po weryfikacji dołącza kolekcję do req.collection
 * 
 * @param {Object} req - Obiekt request (req.params.id wymagane)
 * @param {Object} res - Obiekt response
 * @param {Function} next - Następny middleware
 * 
 * @returns {void|Object}
 * - 404 jeśli kolekcja nie istnieje
 * - 401 jeśli prywatna i brak autoryzacji
 * - 403 jeśli prywatna i brak dostępu
 */
export const verifyCollectionAccess = async (req, res, next) => {
  try {
    // Pobierz kolekcję z populacją właściciela i kategorii
    const collection = await Collection.findById(req.params.id)
      .populate("owner", "_id username avatar")
      .populate("category", "name attributes")
      .populate("allowedUsers", "username email");

    if (!collection) {
      return res.status(404).json({
        code: "COLLECTION_NOT_FOUND",
        message: "Kolekcja nie istnieje"
      });
    }

    // Publiczne kolekcje - dostęp dla wszystkich
    if (collection.privacy === "public") {
      req.collection = collection;
      return next();
    }

    // Prywatne kolekcje - sprawdź uprawnienia
    const userId = req.user?._id ? req.user._id.toString() : null;

    if (!userId) {
      return res.status(401).json({
        code: "AUTH_REQUIRED",
        message: "Ta kolekcja jest prywatna. Zaloguj się, aby uzyskać dostęp."
      });
    }

    const ownerId = collection.owner._id || collection.owner;
    const isOwner = ownerId.toString() === userId;
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

/**
 * Middleware weryfikacji własności kolekcji
 * 
 * @description
 * Sprawdza czy użytkownik może MODYFIKOWAĆ kolekcję.
 * Musi być właścicielem lub adminem.
 * UWAGA: Wymaga wcześniejszego wywołania verifyCollectionAccess!
 * 
 * @param {Object} req - Obiekt request (req.collection wymagane)
 * @param {Object} res - Obiekt response
 * @param {Function} next - Następny middleware
 * 
 * @returns {void|Object}
 * - 401 jeśli brak autoryzacji
 * - 403 jeśli nie jest właścicielem/adminem
 * - 500 jeśli brak req.collection
 */
export const verifyCollectionOwnership = (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        code: "AUTH_REQUIRED",
        message: "Wymagana autentykacja"
      });
    }

    // Sprawdź czy middleware dostępu był wywołany
    if (!req.collection) {
      return res.status(500).json({
        code: "SERVER_ERROR",
        message: "Brak kolekcji w kontekście żądania"
      });
    }

    const userId = req.user._id.toString();
    const ownerId = req.collection.owner._id || req.collection.owner;
    const isOwner = ownerId.toString() === userId;
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

/**
 * Middleware walidacji listy allowedUsers
 * 
 * @description
 * Waliduje pole allowedUsers przy tworzeniu/edycji kolekcji:
 * - Nie można dodać użytkowników do kolekcji publicznej
 * - Wszystkie ID muszą być prawidłowymi ObjectId
 * - Wszyscy użytkownicy muszą istnieć i być aktywni
 * - Nie można dodać samego siebie
 * 
 * @param {Object} req - Obiekt request
 * @param {Object} res - Obiekt response
 * @param {Function} next - Następny middleware
 * 
 * @returns {void|Object}
 * - 400 z różnymi kodami błędów w zależności od problemu
 */
export const validateAllowedUsers = async (req, res, next) => {
  try {
    const { privacy, allowedUsers } = req.body;

    // Publiczna kolekcja nie może mieć allowedUsers
    if (privacy === "public" && Array.isArray(allowedUsers) && allowedUsers.length > 0) {
      return res.status(400).json({
        code: "PUBLIC_COLLECTION_CONFLICT",
        message: "Kolekcja publiczna nie może mieć przypisanych użytkowników"
      });
    }

    // Nie waliduj jeśli nie jest prywatna lub brak allowedUsers
    if (privacy !== "private") {
      return next();
    }

    if (!allowedUsers) {
      return next();
    }

    // Walidacja formatu tablicy
    if (!Array.isArray(allowedUsers)) {
      return res.status(400).json({
        code: "ALLOWED_USERS_INVALID",
        message: "allowedUsers musi być tablicą identyfikatorów użytkowników"
      });
    }

    // Walidacja ObjectId
    const invalidIds = allowedUsers.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        code: "ALLOWED_USERS_INVALID_IDS",
        message: "allowedUsers zawiera nieprawidłowe identyfikatory",
        invalidIds
      });
    }

    const requesterId = req.user?._id ? req.user._id.toString() : null;

    // Sprawdź czy wszyscy użytkownicy istnieją
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

    // Sprawdź czy użytkownicy są aktywni
    const inactive = users.filter(u => u.isActive === false).map(u => u._id.toString());
    if (inactive.length > 0) {
      return res.status(400).json({
        code: "ALLOWED_USERS_INACTIVE",
        message: "Nie można dodać nieaktywnych użytkowników",
        inactive
      });
    }

    // Nie można dodać samego siebie
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
