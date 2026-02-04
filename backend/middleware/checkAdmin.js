/**
 * @fileoverview Middleware sprawdzania uprawnień administratora
 * @description Sprawdza czy zalogowany użytkownik ma rolę "admin".
 * Używany po middleware authenticateToken.
 * 
 * @module middleware/checkAdmin
 */

/**
 * Middleware wymagający uprawnień administratora
 * 
 * @description
 * UWAGA: Musi być użyty PO authenticateToken!
 * Sprawdza czy req.user.role === "admin"
 * 
 * @param {Object} req - Obiekt request (z req.user z authenticateToken)
 * @param {Object} res - Obiekt response
 * @param {Function} next - Następny middleware
 * 
 * @returns {void|Object}
 * - 401 jeśli brak użytkownika (nie zalogowany)
 * - 403 jeśli użytkownik nie jest adminem
 */
export default function checkAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            code: "AUTH_REQUIRED",
            message: "Wymagana autentykacja"
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            code: "ADMIN_REQUIRED",
            message: "Wymagane uprawnienia administratora",
            userRole: req.user.role
        });
    }

    next();
}