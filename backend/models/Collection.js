import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Nazwa kolekcji jest wymagana"],
        minlength: [2, "Nazwa musi mieć przynajmniej 2 znaki"],
        maxlength: [100, "Nazwa nie może być dłuższa niż 100 znaków"],
        trim: true
    },
    description: {
        type: String,
        maxlength: [500, "Opis nie może przekraczać 500 znaków"]
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true
    },
    privacy: {
        type: String,
        enum: ["public", "private"],
        default: "public"
    },
    allowedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    coverImage: {
        type: String,
        default: ""
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.__v;
            return ret;
        }
    }
});

collectionSchema.index({ name: "text", description: "text" });
collectionSchema.index({ privacy: 1, owner: 1 });

collectionSchema.pre("deleteOne", { document: true }, async function(next) {
    await mongoose.model("Item").deleteMany({ parentCollection: this._id });
    next();
});

export default mongoose.model("Collection", collectionSchema);