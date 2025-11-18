export default function checkAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: "Wymagana autentykacja",
            code: "AUTH_REQUIRED"
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            error: "Wymagane uprawnienia administratora",
            code: "ADMIN_REQUIRED",
            userRole: req.user.role
        });
    }

    next();
}