/**
 * @fileoverview Model użytkownika
 * @description Schema Mongoose dla użytkowników systemu z obsługą autoryzacji,
 * weryfikacji email i resetowania hasła.
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * Schema użytkownika
 * @typedef {Object} UserSchema
 * @property {string} username - Unikalna nazwa użytkownika (3-30 znaków, alfanumeryczne + _ -)
 * @property {string} password - Zahashowane hasło (ukryte w zapytaniach)
 * @property {string} email - Unikalny adres email
 * @property {string} role - Rola użytkownika: 'admin' lub 'user'
 * @property {boolean} isActive - Czy konto jest aktywne (można zablokować)
 * @property {Date} lastLogin - Data ostatniego logowania
 * @property {boolean} isEmailVerified - Czy email został zweryfikowany
 * @property {string} emailVerificationToken - Token weryfikacji email (ukryty)
 * @property {Date} emailVerificationExpires - Data wygaśnięcia tokena weryfikacji
 * @property {string} passwordResetToken - Token resetowania hasła (ukryty)
 * @property {Date} passwordResetExpires - Data wygaśnięcia tokena resetu (1h)
 * @property {string} avatar - URL avatara użytkownika
 * @property {boolean} isProfilePublic - Czy profil jest publiczny
 */
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            unique: true,
            required: [true, "Nazwa użytkownika jest wymagana"],
            trim: true,
            minlength: 3,
            maxlength: 30,
            match: /^[a-zA-Z0-9_\-]+$/,
            index: true
        },
        password: {
            type: String,
            required: [true, "Hasło jest wymagane"],
            select: false // Hasło nie jest zwracane w zapytaniach
        },
        email: {
            type: String,
            unique: true,
            required: [true, "Email jest wymagany"],
            validate: {
                validator: v => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
                message: "Nieprawidłowy format email"
            }
        },
        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastLogin: {
            type: Date,
            default: null
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        emailVerificationToken: {
            type: String,
            select: false
        },
        emailVerificationExpires: {
            type: Date,
            select: false
        },
        passwordResetToken: {
            type: String,
            select: false
        },
        passwordResetExpires: {
            type: Date,
            select: false
        },
        emailVerificationLastSent: {
            type: Date,
            default: null,
            select: false
        },
        avatar: {
            type: String,
            default: ""
        },
        isProfilePublic: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true, // Dodaje createdAt i updatedAt
        toJSON: {
            virtuals: true,
            // Usuwa wrażliwe dane przy serializacji do JSON
            transform: (doc, ret) => {
                delete ret.password;
                delete ret.__v;
                delete ret.emailVerificationToken;
                delete ret.emailVerificationExpires;
                delete ret.passwordResetToken;
                delete ret.passwordResetExpires;
                return ret;
            }
        }
    }
);

// Indeks dla wyszukiwania użytkowników (admin panel)
userSchema.index({ role: 1, createdAt: -1 });

/**
 * Pre-save hook - hashuje hasło przed zapisem
 * Uruchamia się tylko gdy hasło zostało zmodyfikowane
 */
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Metody instancji użytkownika
 */
userSchema.methods = {
    /**
     * Porównuje podane hasło z zahashowanym hasłem użytkownika
     * @param {string} candidatePassword - Hasło do sprawdzenia
     * @returns {Promise<boolean>} Czy hasło jest poprawne
     */
    comparePassword: async function (candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    },

    /**
     * Zwraca bezpieczny obiekt profilu użytkownika
     * @returns {Object} Dane profilu bez wrażliwych informacji
     */
    toProfile: function () {
        return {
            id: this._id,
            username: this.username,
            email: this.email,
            role: this.role,
            createdAt: this.createdAt,
            isEmailVerified: this.isEmailVerified
        };
    },

    /**
     * Generuje token weryfikacji email
     * Token wygasa po 24 godzinach
     * @returns {string} Surowy token (do wysłania w linku)
     */
    generateEmailVerificationToken: function () {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        this.emailVerificationToken = hashedToken;
        this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h

        return rawToken;
    },

    /**
     * Generuje token resetowania hasła
     * Token wygasa po 1 godzinie
     * @returns {string} Surowy token (do wysłania w linku)
     */
    generatePasswordResetToken: function () {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        this.passwordResetToken = hashedToken;
        this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1h

        return rawToken;
    }
};

export default mongoose.model("User", userSchema);
