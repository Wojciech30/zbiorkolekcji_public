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