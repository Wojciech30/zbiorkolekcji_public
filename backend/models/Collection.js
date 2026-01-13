import mongoose from "mongoose";

const { Schema } = mongoose;

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
        _id: true,
        id: false
    }
);

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
            immutable: true
        },
        privacy: {
            type: String,
            enum: ["public", "private"],
            default: "public"
        },
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

collectionSchema.index({ name: "text", description: "text" });
collectionSchema.index({ privacy: 1, owner: 1 });
collectionSchema.index({ privacy: 1, views: -1 });

collectionSchema.virtual("likesCount").get(function () {
    return Array.isArray(this.likes) ? this.likes.length : 0;
});

collectionSchema.virtual("commentsCount").get(function () {
    return Array.isArray(this.comments) ? this.comments.length : 0;
});

collectionSchema.pre("deleteOne", { document: true, query: false }, async function () {
    await mongoose.model("Item").deleteMany({ parentCollection: this._id });
});

export default mongoose.model("Collection", collectionSchema);
