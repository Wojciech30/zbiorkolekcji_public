import mongoose from "mongoose";

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
    images: [
      {
        type: String,
        validate: {
          validator: v => typeof v === "string" && /^(https?:\/\/|\/)[^ "]+$/.test(v),
          message: "Nieprawidłowy format URL obrazu (musi zaczynać się od http://, https:// lub /)"
        }
      }
    ],
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
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    likesCount: {
      type: Number,
      default: 0
    },
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

itemSchema.index({ name: "text", description: "text" });
itemSchema.index({ parentCollection: 1, createdAt: -1 });

itemSchema.pre("save", async function () {
  // Skip validation if only comments/likes are being modified (not attributes)
  const modifiedPaths = this.modifiedPaths();
  const onlyCommentsOrLikes = modifiedPaths.every(path =>
    path.startsWith("comments") || path.startsWith("likes") || path === "likesCount"
  );
  if (onlyCommentsOrLikes && !this.isNew) {
    return;
  }

  const collection = await mongoose.model("Collection").findById(this.parentCollection).populate("category");
  if (!collection) {
    throw new Error("Kolekcja nie istnieje");
  }

  if (!collection.category || !Array.isArray(collection.category.attributes)) {
    throw new Error("Kategoria kolekcji nie ma zdefiniowanych atrybutów");
  }

  const defs = new Map(collection.category.attributes.map(a => [a.name, a]));

  // Handle both Map and plain Object for attributes
  const attributesEntries = this.attributes instanceof Map
    ? this.attributes.entries()
    : Object.entries(this.attributes || {});

  for (const [attrName, attrValue] of attributesEntries) {
    const def = defs.get(attrName);
    if (!def) {
      throw new Error(`Nieznany atrybut: ${attrName}`);
    }

    if (!attrValue || typeof attrValue !== "object") {
      throw new Error(`Nieprawidłowa wartość atrybutu: ${attrName}`);
    }

    // Normalizuj typ 'text' do 'string'
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
