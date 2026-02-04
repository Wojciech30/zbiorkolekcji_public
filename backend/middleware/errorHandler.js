/**
 * @fileoverview Globalny middleware obsługi błędów Express
 * @description Przechwytuje nieobsłużone błędy i zwraca ustandaryzowaną odpowiedź JSON.
 * W development dodaje stack trace do odpowiedzi.
 * 
 * @module middleware/errorHandler
 * 
 * @param {Error} err - Obiekt błędu z statusCode i code
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */

export default (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const response = {
        code: err.code || "INTERNAL_ERROR",
        message: err.message || "Wewnętrzny błąd serwera"
    };

    if (process.env.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};