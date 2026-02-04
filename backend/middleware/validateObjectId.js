/**
 * @fileoverview Middleware walidacji ObjectId MongoDB
 * @description Sprawdza czy req.params.id jest prawidłowym
 * formatem MongoDB ObjectId przed próbą zapytania do bazy.
 * 
 * @module middleware/validateObjectId
 */

import mongoose from "mongoose";

/**
 * Middleware walidacji formatu ObjectId
 * 
 * @description
 * Sprawdza req.params.id przed zapytaniem do bazy.
 * Zapobiega błędom CastError w MongoDB.
 * 
 * @param {Object} req - Obiekt request
 * @param {Object} res - Obiekt response
 * @param {Function} next - Następny middleware
 * 
 * @returns {void|Object}
 * - 400 jeśli id nie jest prawidłowym ObjectId
 */
const validateObjectId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            code: 'INVALID_ID_FORMAT',
            message: 'Nieprawidłowy format identyfikatora'
        });
    }
    next();
};

export default validateObjectId;