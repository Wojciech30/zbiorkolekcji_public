/**
 * @fileoverview Model przedmiotu (Item)
 * @description Schema Mongoose dla przedmiotów w kolekcjach z dynamicznymi
 * atrybutami, komentarzami i polubieniami.
 */

import mongoose from "mongoose";

/**
 * Sub-schema dla wartości atrybutu
 * Przechowuje typ i wartość atrybutu zdefiniowanego w kategorii
 * @typedef {Object} AttributeValueSchema
 * @property {string} type - Typ wartości: string, number, date, boolean, url, select
 * @property {Mixed} value - Wartość atrybutu (dowolnego typu)
 */
const attributeValueSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["string", "number", "date", "boolean", "url", "select"],
      required: true
    },
    value: mongoose.Schema.Types.Mixed
  },
  { _id: false }
);

/**
 * Schema przedmiotu
 * @typedef {Object} ItemSchema
 * @property {string} name - Nazwa przedmiotu (2-100 znaków)
 * @property {string} description - Opis przedmiotu (max 500 znaków)
 * @property {ObjectId} parentCollection - Kolekcja do której należy przedmiot
 * @property {string[]} images - Lista URL-i obrazów przedmiotu
 * @property {Map} attributes - Mapa atrybutów (klucz: nazwa, wartość: {type, value})
 * @property {ObjectId} createdBy - Użytkownik który utworzył przedmiot
 * @property {ObjectId[]} likes - Lista użytkowników którzy polubili
 * @property {number} likesCount - Licznik polubień (denormalizowany)
 * @property {Object[]} comments - Komentarze do przedmiotu
 */
const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nazwa przedmiotu jest wymagana"],
      minlength: [2, "Nazwa musi mieć przynajmniej 2 znaki"],
      maxlength: [100, "Nazwa nie może być dłuższa niż 100 znaków"],
      trim: true
    },
    description: {
      type: String,
      maxlength: [500, "Opis nie może przekraczać 500 znaków"],
      default: "",
      trim: true
    },
    parentCollection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
      index: true
    },
    // Lista obrazów - wspiera zarówno lokalne uploady jak i zewnętrzne URL-e
    images: [
      {
        type: String,
        validate: {
          validator: v => typeof v === "string" && /^(https?:\/\/|\/)[^ "]+$/.test(v),
          message: "Nieprawidłowy format URL obrazu (musi zaczynać się od http://, https:// lub /)"
        }
      }
    ],
    // Dynamiczne atrybuty zdefiniowane przez kategorię kolekcji
    attributes: {
      type: Map,
      of: attributeValueSchema,
      default: () => new Map(),
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // System polubień
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    likesCount: {
      type: Number,
      default: 0
    },
    // Komentarze do przedmiotu
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      text: {
        type: String,
        required: true,
        maxlength: 500
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indeksy dla wyszukiwania i sortowania
itemSchema.index({ name: "text", description: "text" }); // Pełnotekstowe wyszukiwanie
itemSchema.index({ parentCollection: 1, createdAt: -1 }); // Przedmioty w kolekcji, najnowsze pierwsze

/**
 * Pre-save hook - waliduje atrybuty względem definicji kategorii
 * Pomija walidację jeśli modyfikowane są tylko komentarze/polubienia
 */
itemSchema.pre("save", async function () {
  // Pomijamy walidację atrybutów jeśli tylko komentarze/polubienia są modyfikowane
  const modifiedPaths = this.modifiedPaths();
  const onlyCommentsOrLikes = modifiedPaths.every(path =>
    path.startsWith("comments") || path.startsWith("likes") || path === "likesCount"
  );
  if (onlyCommentsOrLikes && !this.isNew) {
    return;
  }

  // Pobierz kolekcję z kategorią
  const collection = await mongoose.model("Collection").findById(this.parentCollection).populate("category");
  if (!collection) {
    throw new Error("Kolekcja nie istnieje");
  }

  if (!collection.category || !Array.isArray(collection.category.attributes)) {
    throw new Error("Kategoria kolekcji nie ma zdefiniowanych atrybutów");
  }

  // Mapa definicji atrybutów z kategorii
  const defs = new Map(collection.category.attributes.map(a => [a.name, a]));

  // Obsługa zarówno Map jak i zwykłego obiektu dla atrybutów
  const attributesEntries = this.attributes instanceof Map
    ? this.attributes.entries()
    : Object.entries(this.attributes || {});

  // Waliduj każdy atrybut
  for (const [attrName, attrValue] of attributesEntries) {
    const def = defs.get(attrName);
    if (!def) {
      throw new Error(`Nieznany atrybut: ${attrName}`);
    }

    if (!attrValue || typeof attrValue !== "object") {
      throw new Error(`Nieprawidłowa wartość atrybutu: ${attrName}`);
    }

    // Normalizuj typ 'text' do 'string' dla kompatybilności
    const normalizedType = attrValue.type === "text" ? "string" : attrValue.type;
    const defType = def.type === "text" ? "string" : def.type;

    if (normalizedType !== defType) {
      throw new Error(
        `Nieprawidłowy typ dla atrybutu ${attrName}. Oczekiwano ${def.type}, otrzymano ${attrValue.type}`
      );
    }
  }
});

export default mongoose.model("Item", itemSchema);
