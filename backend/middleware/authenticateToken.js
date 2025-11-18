import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Collection from "../models/Collection.js";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            code: "MISSING_TOKEN",
            message: "Token autoryzacyjny jest wymagany"
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id)
            .select("-password -__v")
            .lean();

        if (!user) {
            return res.status(404).json({
                code: "USER_NOT_FOUND",
                message: "Konto użytkownika nie istnieje"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                code: "ACCOUNT_DISABLED",
                message: "Konto jest nieaktywne"
            });
        }

        req.user = user;
        next();
    } catch (err) {
        const errorType = err.name === "TokenExpiredError"
            ? { status: 401, code: "TOKEN_EXPIRED" }
            : { status: 403, code: "INVALID_TOKEN" };

        res.status(errorType.status).json({
            code: errorType.code,
            message: err.message
        });
    }
}