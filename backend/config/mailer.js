import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

let transporter;

if (isProduction) {
    // Produkcja: prawdziwy SMTP
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
} else {
    // Development: MailDev lub MailHog (172.23.52.141:1025)
    transporter = nodemailer.createTransport({
        host: process.env.MAILDEV_HOST || "172.23.52.141",
        port: parseInt(process.env.MAILDEV_PORT || "1025"),
        ignoreTLS: true
    });
}

const emailFrom = process.env.EMAIL_FROM || "noreply@zbiorkolekcji.local";

/**
 * Wysyłanie maila
 * @param {Object} options
 * @param {string} options.to - adres odbiorcy
 * @param {string} options.subject - temat
 * @param {string} options.html - treść HTML
 * @param {string} [options.text] - treść tekstowa
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const info = await transporter.sendMail({
            from: emailFrom,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]+>/g, "")
        });

        if (!isProduction) {
            console.log(`[MailDev] Email wysłany do ${to}: ${subject}`);
            console.log(`[MailDev] Preview: http://172.23.52.141:1080`);
        }

        return info;
    } catch (error) {
        console.error("Błąd wysyłania maila:", error);
        throw error;
    }
};

/**
 * Email weryfikacyjny
 */
export const sendVerificationEmail = async (to, username, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL || "http://172.23.52.141:8080"}/verify-email?token=${verificationToken}`;

    return sendEmail({
        to,
        subject: "Zbiór Kolekcji - Weryfikacja adresu email",
        html: `
            <h1>Witaj ${username}!</h1>
            <p>Dziękujemy za rejestrację w Zbiór Kolekcji.</p>
            <p>Kliknij poniższy link, aby zweryfikować swój adres email:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>Link wygaśnie za 24 godziny.</p>
        `
    });
};

/**
 * Email resetowania hasła
 */
export const sendPasswordResetEmail = async (to, username, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || "http://172.23.52.141:8080"}/reset-password?token=${resetToken}`;

    return sendEmail({
        to,
        subject: "Zbiór Kolekcji - Reset hasła",
        html: `
            <h1>Reset hasła</h1>
            <p>Otrzymaliśmy prośbę o reset hasła dla konta ${username}.</p>
            <p>Kliknij poniższy link, aby ustawić nowe hasło:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>Link wygaśnie za 1 godzinę.</p>
            <p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
        `
    });
};

export default transporter;
