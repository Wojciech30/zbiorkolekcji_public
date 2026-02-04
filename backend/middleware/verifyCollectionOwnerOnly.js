/**
 * @fileoverview Middleware weryfikacji właściciela kolekcji
 * @description Sprawdza czy zalogowany użytkownik jest właścicielem kolekcji.
 * Używane przy operacjach wymagających pełnej własności (nie admin).
 * 
 * @module middleware/verifyCollectionOwnerOnly
 * @requires req.collection - Załadowana kolekcja (z wcześniejszego middleware)
 * @requires req.user - Zalogowany użytkownik
 */

const verifyCollectionOwnerOnly = (req, res, next) => {
    const ownerId = req.collection.owner._id || req.collection.owner;
    if (ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            code: "FORBIDDEN_RESOURCE_ACCESS",
            message: "Tylko właściciel kolekcji może dodawać przedmioty."
        });
    }
    next();
};

export default verifyCollectionOwnerOnly;