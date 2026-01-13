import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authenticateToken from "../middleware/authenticateToken.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Upewnij się że folder uploads istnieje
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Konfiguracja multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

// Filtrowanie typów plików
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Niedozwolony typ pliku. Dozwolone: JPEG, PNG, GIF, WebP"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Upload pojedynczego pliku
router.post("/", authenticateToken, upload.single("image"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                code: "NO_FILE",
                message: "Nie przesłano pliku"
            });
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        res.json({
            code: "UPLOAD_SUCCESS",
            message: "Plik przesłany pomyślnie",
            url: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            code: "UPLOAD_ERROR",
            message: error.message || "Błąd podczas przesyłania pliku"
        });
    }
});

// Upload wielu plików
router.post("/multiple", authenticateToken, upload.array("images", 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                code: "NO_FILES",
                message: "Nie przesłano żadnych plików"
            });
        }

        const urls = req.files.map(file => ({
            url: `/uploads/${file.filename}`,
            filename: file.filename
        }));

        res.json({
            code: "UPLOAD_SUCCESS",
            message: `Przesłano ${req.files.length} plików`,
            files: urls
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            code: "UPLOAD_ERROR",
            message: error.message || "Błąd podczas przesyłania plików"
        });
    }
});

// Usuwanie pliku
router.delete("/:filename", authenticateToken, (req, res) => {
    try {
        const filePath = path.join(uploadsDir, req.params.filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                code: "FILE_NOT_FOUND",
                message: "Plik nie istnieje"
            });
        }

        fs.unlinkSync(filePath);

        res.json({
            code: "DELETE_SUCCESS",
            message: "Plik usunięty"
        });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({
            code: "DELETE_ERROR",
            message: "Błąd podczas usuwania pliku"
        });
    }
});

// Obsługa błędów multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                code: "FILE_TOO_LARGE",
                message: "Plik jest zbyt duży. Maksymalny rozmiar to 5MB"
            });
        }
        return res.status(400).json({
            code: "UPLOAD_ERROR",
            message: error.message
        });
    }
    next(error);
});

export default router;
