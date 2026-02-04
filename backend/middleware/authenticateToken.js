/**
 * @fileoverview Middleware autoryzacji JWT
 * @description Weryfikuje token JWT z nagłówka Authorization,
 * pobiera dane użytkownika i dołącza je do obiektu request.
 * 
 * @module middleware/authenticateToken
 */

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Collection from "../models/Collection.js";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware wymagający autoryzacji
 * 
 * @description
 * - Sprawdza nagłówek Authorization (format: "Bearer <token>")
 * - Weryfikuje token JWT
 * - Pobiera użytkownika z bazy i dołącza do req.user
 * - Sprawdza czy konto jest aktywne
 * 
 * @param {Object} req - Obiekt request
 * @param {Object} res - Obiekt response
 * @param {Function} next - Następny middleware
 * 
 * @returns {void|Object} 
 * - 401 jeśli brak tokena lub token wygasł
 * - 403 jeśli token nieprawidłowy lub konto nieaktywne
 * - 404 jeśli użytkownik nie istnieje
 */
export default async function authenticateToken(req, res, next) {
    // Pobierz token z nagłówka Authorization
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            code: "MISSING_TOKEN",
            message: "Token autoryzacyjny jest wymagany"
        });
    }

    try {
        // Weryfikuj token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Pobierz użytkownika (bez hasła)
        const user = await User.findById(decoded.id)
            .select("-password -__v")
            .lean();

        if (!user) {
            return res.status(404).json({
                code: "USER_NOT_FOUND",
                message: "Konto użytkownika nie istnieje"
            });
        }

        // Sprawdź czy konto jest aktywne (nie zablokowane)
        if (!user.isActive) {
            return res.status(403).json({
                code: "ACCOUNT_DISABLED",
                message: "Konto jest nieaktywne"
            });
        }

        // Dołącz użytkownika do request
        req.user = user;
        next();
    } catch (err) {
        // Rozróżnij błąd wygasłego tokena od nieprawidłowego
        const errorType = err.name === "TokenExpiredError"
            ? { status: 401, code: "TOKEN_EXPIRED" }
            : { status: 403, code: "INVALID_TOKEN" };

        res.status(errorType.status).json({
            code: errorType.code,
            message: err.message
        });
    }
}