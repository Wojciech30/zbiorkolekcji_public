/**
 * @fileoverview Model kolekcji
 * @description Schema Mongoose dla kolekcji przedmiotów z obsługą komentarzy,
 * polubień, prywatności i obrazków okładek.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Sub-schema komentarza do kolekcji
 * @typedef {Object} CommentSubSchema
 * @property {ObjectId} user - Referencja do użytkownika (autor komentarza)
 * @property {string} text - Treść komentarza (max 1000 znaków)
 * @property {Date} createdAt - Data utworzenia
 */
const commentSubSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: [1000, "Komentarz nie może przekraczać 1000 znaków"]
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: true,
        id: false
    }
);

/**
 * Schema kolekcji
 * @typedef {Object} CollectionSchema
 * @property {string} name - Nazwa kolekcji (2-100 znaków)
 * @property {string} description - Opis kolekcji (max 500 znaków)
 * @property {ObjectId} owner - Właściciel kolekcji (referencja do User)
 * @property {ObjectId} category - Kategoria kolekcji (nie można zmienić po utworzeniu)
 * @property {string} privacy - Prywatność: 'public' lub 'private'
 * @property {ObjectId[]} allowedUsers - Użytkownicy z dostępem do prywatnej kolekcji
 * @property {number} views - Licznik wyświetleń
 * @property {ObjectId[]} likes - Lista użytkowników, którzy polubili
 * @property {CommentSubSchema[]} comments - Komentarze do kolekcji
 * @property {string} coverImage - URL obrazka okładki
 * @property {boolean} hideDescription - Czy ukryć opis na stronie kolekcji
 */
const collectionSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Nazwa kolekcji jest wymagana"],
            minlength: [2, "Nazwa musi mieć przynajmniej 2 znaki"],
            maxlength: [100, "Nazwa nie może być dłuższa niż 100 znaków"],
            trim: true
        },
        description: {
            type: String,
            maxlength: [500, "Opis nie może przekraczać 500 znaków"],
            trim: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true,
            immutable: true // Nie można zmienić kategorii po utworzeniu
        },
        privacy: {
            type: String,
            enum: ["public", "private"],
            default: "public"
        },
        // Użytkownicy którzy mają dostęp do prywatnej kolekcji
        allowedUsers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        views: {
            type: Number,
            default: 0,
            min: 0
        },
        // Lista użytkowników którzy polubili kolekcję
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        comments: [commentSubSchema],
        coverImage: {
            type: String,
            default: ""
        },
        hideDescription: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                delete ret.__v;
                return ret;
            }
        }
    }
);

// Indeksy dla wyszukiwania i sortowania
collectionSchema.index({ name: "text", description: "text" }); // Pełnotekstowe wyszukiwanie
collectionSchema.index({ privacy: 1, owner: 1 }); // Kolekcje użytkownika
collectionSchema.index({ privacy: 1, views: -1 }); // Popularne publiczne kolekcje

/**
 * Wirtualne pole - liczba polubień
 * @returns {number}
 */
collectionSchema.virtual("likesCount").get(function () {
    return Array.isArray(this.likes) ? this.likes.length : 0;
});

/**
 * Wirtualne pole - liczba komentarzy
 * @returns {number}
 */
collectionSchema.virtual("commentsCount").get(function () {
    return Array.isArray(this.comments) ? this.comments.length : 0;
});

/**
 * Pre-delete hook - usuwa wszystkie przedmioty należące do kolekcji
 * Uruchamia się przy collection.deleteOne()
 */
collectionSchema.pre("deleteOne", { document: true, query: false }, async function () {
    await mongoose.model("Item").deleteMany({ parentCollection: this._id });
});

export default mongoose.model("Collection", collectionSchema);
