/**
 * @fileoverview Middleware opcjonalnej autoryzacji
 * @description Próbuje zweryfikować token JWT, ale nie blokuje
 * jeśli nie ma tokena. Używany dla endpointów publicznych
 * które mogą zachowywać się inaczej dla zalogowanych użytkowników.
 * 
 * @module middleware/optionalAuthenticate
 * 
 * @example
 * // Endpoint dostępny dla wszystkich, ale zalogowany użytkownik
 * // widzi dodatkowe informacje (np. czy polubił kolekcję)
 * router.get("/collections/:id", optionalAuthenticate, getCollection);
 */

import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware opcjonalnej autoryzacji
 * 
 * @description
 * - Jeśli jest token - próbuje go zweryfikować i dołączyć użytkownika
 * - Jeśli nie ma tokena lub jest nieprawidłowy - kontynuuje bez błędu
 * - Nigdy nie zwraca błędu 401/403
 * 
 * @param {Object} req - Obiekt request
 * @param {Object} res - Obiekt response
 * @param {Function} next - Następny middleware
 */
export default async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  // Brak nagłówka - kontynuuj bez użytkownika
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  if (!JWT_SECRET) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    // Dołącz użytkownika tylko jeśli istnieje i jest aktywny
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Ignoruj błędy tokena - traktuj jak niezalogowanego
    return next();
  }

  return next();
}
