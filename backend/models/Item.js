import mongoose from "mongoose";

const attributeValueSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["string", "number", "date", "boolean", "url"],
        required: true
    },
    value: mongoose.Schema.Types.Mixed
});

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Nazwa przedmiotu jest wymagana"],
        minlength: [2, "Nazwa musi mieć przynajmniej 2 znaki"],
        maxlength: [100, "Nazwa nie może być dłuższa niż 100 znaków"]
    },
    description: {
        type: String,
        maxlength: [500, "Opis nie może przekraczać 500 znaków"]
    },
    parentCollection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collection",
        required: true,
        index: true
    },
    images: [{
        type: String,
        validate: {
            validator: v => /^(http|https):\/\/[^ "]+$/.test(v),
            message: "Nieprawidłowy format URL obrazu"
        }
    }],
    attributes: {
        type: Map,
        of: attributeValueSchema,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

itemSchema.index({ name: "text", description: "text" });
itemSchema.index({ parentCollection: 1, createdAt: -1 });

itemSchema.pre("save", async function(next) {
    try {
        const collection = await mongoose.model("Collection")
            .findById(this.parentCollection)
            .populate("category");

        const categoryAttributes = new Map(
            collection.category.attributes.map(attr => [attr.name, attr])
        );

        for (const [attrName, attrValue] of this.attributes) {
            const attrDef = categoryAttributes.get(attrName);

            if (!attrDef) {
                throw new Error(`Nieznany atrybut: ${attrName}`);
            }

            if (typeof attrValue.value !== attrDef.type && attrDef.type !== 'select') {
                throw new Error(
                    `Nieprawidłowy typ dla atrybutu ${attrName}. ` +
                    `Oczekiwano ${attrDef.type}, otrzymano ${typeof attrValue.value}`
                );
            }
        }

        next();
    } catch (error) {
        next(error);
    }
});

export default mongoose.model("Item", itemSchema);
