/**
 * @fileoverview Model kategorii
 * @description Schema Mongoose dla kategorii kolekcji z dynamicznymi
 * definicjami atrybutów (typy: string, number, date, boolean, url, select).
 */

import mongoose from "mongoose";

/**
 * Sub-schema dla definicji atrybutu kategorii
 * @typedef {Object} AttributeSchema
 * @property {string} name - Nazwa atrybutu (2-50 znaków)
 * @property {string} type - Typ atrybutu: string, number, date, boolean, url, select
 * @property {boolean} required - Czy atrybut jest wymagany przy tworzeniu przedmiotu
 * @property {string[]} options - Opcje do wyboru (wymagane dla typu 'select')
 */
const attributeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Nazwa atrybutu jest wymagana"],
        minlength: [2, "Nazwa atrybutu musi mieć przynajmniej 2 znaki"],
        maxlength: [50, "Nazwa atrybutu nie może być dłuższa niż 50 znaków"],
        collation: { locale: "en", strength: 2 }
    },
    type: {
        type: String,
        enum: ["string", "number", "date", "boolean", "url", "select"],
        required: [true, "Typ atrybutu jest wymagany"]
    },
    required: {
        type: Boolean,
        default: false
    },
    // Opcje dla typu 'select' - lista dozwolonych wartości
    options: {
        type: [String],
        validate: {
            validator: function(v) {
                // Typ 'select' wymaga co najmniej jednej opcji
                return this.type === "select" ? v.length > 0 : true;
            },
            message: "Typ 'select' wymaga podania opcji"
        }
    }
});

/**
 * Schema kategorii
 * @typedef {Object} CategorySchema
 * @property {string} name - Unikalna nazwa kategorii (2-50 znaków)
 * @property {string} description - Opis kategorii (max 500 znaków)
 * @property {boolean} requireItemName - Czy nazwa przedmiotu jest wymagana
 * @property {number|null} displayAttribute - Indeks atrybutu wyświetlanego na kartach
 * @property {AttributeSchema[]} attributes - Lista definicji atrybutów
 */
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Nazwa kategorii jest wymagana"],
            unique: true,
            minlength: [2, "Nazwa kategorii musi mieć przynajmniej 2 znaki"],
            maxlength: [50, "Nazwa kategorii nie może być dłuższa niż 50 znaków"],
            index: true
        },
        description: {
            type: String,
            maxlength: [500, "Opis nie może być dłuższy niż 500 znaków"]
        },
        // Czy przedmioty w tej kategorii muszą mieć nazwę
        requireItemName: {
            type: Boolean,
            default: true
        },
        // Który atrybut wyświetlać pod nazwą na karcie przedmiotu (indeks tablicy)
        displayAttribute: {
            type: Number,
            default: null,
            validate: {
                validator: function(value) {
                    if (value === null) return true;
                    return Number.isInteger(value) && value >= 0 && (this.attributes ? value < this.attributes.length : true);
                },
                message: "displayAttribute must be a valid index of the attributes array"
            }
        },
        // Lista definicji atrybutów dla przedmiotów w tej kategorii
        attributes: [attributeSchema]
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        }
    }
);

export default mongoose.model("Category", categorySchema);
