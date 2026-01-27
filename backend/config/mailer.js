/**
 * @fileoverview Konfiguracja wysyłania emaili
 * @description Obsługa nodemailer dla emaili weryfikacyjnych, resetowania hasła i feedbacku.
 * W development używa MailDev, w production prawdziwego SMTP.
 * 
 * @module config/mailer
 * 
 * @exports
 * - sendEmail - podstawowa funkcja wysyłania
 * - sendVerificationEmail - email weryfikacyjny
 * - sendPasswordResetEmail - email resetowania hasła
 * - sendFeedbackEmail - zgłoszenie do admina
 * 
 * @env
 * - NODE_ENV - production/development
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS - produkcyjny SMTP
 * - MAILDEV_HOST, MAILDEV_PORT - development SMTP
 * - EMAIL_FROM - adres nadawcy
 * - FRONTEND_URL - bazowy URL frontendu
 */

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * @param {Array} [options.attachments] - załączniki
 */
export const sendEmail = async ({ to, subject, html, text, attachments }) => {
    try {
        const mailOptions = {
            from: emailFrom,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]+>/g, "")
        };

        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments;
        }

        const info = await transporter.sendMail(mailOptions);

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

/**
 * Wysyłanie zgłoszenia do admina z opcjonalnym załącznikiem
 * @param {Object} options
 * @param {string} options.userEmail
 * @param {string} options.username
 * @param {string} options.subject
 * @param {string} options.message
 * @param {string} [options.screenshotUrl] - URL lub ścieżka do zrzutu ekranu
 */
export const sendFeedbackEmail = async ({ userEmail, username, subject, message, screenshotUrl }) => {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@zbiorkolekcji.local";
    
    // Prepare attachments if screenshot URL provided
    const attachments = [];
    let screenshotHtml = '';
    
    if (screenshotUrl) {
        // If it's a local upload path (starts with /uploads/), convert to file path
        if (screenshotUrl.startsWith('/uploads/')) {
            const filename = screenshotUrl.replace('/uploads/', '');
            const filePath = path.join(__dirname, '..', 'uploads', filename);
            
            try {
                if (fs.existsSync(filePath)) {
                    attachments.push({
                        filename: filename,
                        path: filePath,
                        cid: 'screenshot'
                    });
                    screenshotHtml = `<p><strong>Zrzut ekranu:</strong></p>
                       <img src="cid:screenshot" alt="Screenshot" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;" />`;
                } else {
                    console.log('Screenshot file not found:', filePath);
                    screenshotHtml = `<p><strong>Zrzut ekranu:</strong> <a href="${screenshotUrl}">${screenshotUrl}</a></p>`;
                }
            } catch (err) {
                console.error('Could not attach screenshot:', err);
                screenshotHtml = `<p><strong>Zrzut ekranu:</strong> <a href="${screenshotUrl}">${screenshotUrl}</a></p>`;
            }
        } else {
            // External URL - just link to it
            screenshotHtml = `<p><strong>Zrzut ekranu:</strong></p>
               <img src="${screenshotUrl}" alt="Screenshot" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;" />`;
        }
    }
    
    return sendEmail({
        to: adminEmail,
        subject: `[Feedback] ${subject}`,
        html: `
            <h2>Zgłoszenie od użytkownika</h2>
            <p><strong>Od:</strong> ${username} (${userEmail})</p>
            <p><strong>Temat:</strong> ${subject}</p>
            <hr/>
            <div style="white-space: pre-wrap;">${message}</div>
            ${screenshotHtml}
        `,
        attachments: attachments.length > 0 ? attachments : undefined
    });
};

export default transporter;
