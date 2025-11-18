import mongoose from "mongoose";

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
    options: {
        type: [String],
        validate: {
            validator: function(v) {
                return this.type === "select" ? v.length > 0 : true;
            },
            message: "Typ 'select' wymaga podania opcji"
        }
    }
});

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
        requireItemName: {
            type: Boolean,
            default: true
        },
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
