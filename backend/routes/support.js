import express from "express";
import authenticateToken from "../middleware/authenticateToken.js";
import { sendFeedbackEmail } from "../config/mailer.js";

const router = express.Router();

/**
 * POST /api/v1/support/report
 * Wysyła zgłoszenie problemu do admina (z opcjonalnym URL zrzutu ekranu)
 */
router.post("/report", authenticateToken, async (req, res) => {
    try {
        const { subject, message, screenshotUrl } = req.body;

        if (!subject || !subject.trim()) {
            return res.status(400).json({
                code: "SUBJECT_REQUIRED",
                message: "Temat zgłoszenia jest wymagany"
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                code: "MESSAGE_REQUIRED",
                message: "Treść zgłoszenia jest wymagana"
            });
        }

        await sendFeedbackEmail({
            userEmail: req.user.email,
            username: req.user.username,
            subject: subject.trim(),
            message: message.trim(),
            screenshotUrl: screenshotUrl || null
        });

        res.json({
            code: "FEEDBACK_SENT",
            message: "Dziękujemy za zgłoszenie! Odpowiemy najszybciej jak to możliwe."
        });
    } catch (error) {
        console.error("Błąd wysyłania zgłoszenia:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: "Nie udało się wysłać zgłoszenia. Spróbuj ponownie później."
        });
    }
});

export default router;
