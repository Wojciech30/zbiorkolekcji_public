import express from "express";
import Collection from "../models/Collection.js";
import Item from "../models/Item.js";
import authenticateToken from "../middleware/authenticateToken.js";
import optionalAuthenticate from "../middleware/optionalAuthenticate.js";
import {
    validateAllowedUsers,
    verifyCollectionAccess,
    verifyCollectionOwnership
} from "../middleware/collectionMiddleware.js";
import User from "../models/User.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

const handleError = (res, error, defaultMessage) => {
    console.error(error);

    const response = {
        code: "COLLECTION_ERROR",
        message: error.message || defaultMessage
    };

    if (error.name === "ValidationError") {
        response.details = Object.values(error.errors).map(e => e.message);
        return res.status(400).json(response);
    }

    return res.status(500).json(response);
};

router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search } = req.query;
        const filter = { privacy: "public" };

        if (category) filter.category = category;
        if (search) filter.$text = { $search: search };

        const collections = await Collection.find(filter)
            .populate("owner", "username")
            .populate("category", "name")
            .sort("-createdAt")
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const count = await Collection.countDocuments(filter);

        res.json({
            code: "COLLECTIONS_FETCHED",
            total: count,
            page: Number(page),
            pages: Math.ceil(count / Number(limit)),
            collections
        });
    } catch (error) {
        handleError(res, error, "Błąd pobierania kolekcji");
    }
});

router.get("/:id/attributes", validateObjectId, optionalAuthenticate, verifyCollectionAccess, async (req, res) => {
    try {
        res.json({
            code: "ATTRIBUTES_FETCHED",
            attributes: req.collection?.category?.attributes || []
        });
    } catch (error) {
        handleError(res, error, "Błąd pobierania atrybutów kategorii");
    }
});

router.get("/me", authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const collections = await Collection.find({ owner: req.user._id })
            .populate("owner", "username")
            .populate("category", "name")
            .sort("-createdAt")
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await Collection.countDocuments({ owner: req.user._id });

        // Oblicz itemsCount dla każdej kolekcji
        const collectionsWithStats = await Promise.all(
            collections.map(async (collection) => {
                const collectionObj = collection.toObject();
                const itemsCount = await Item.countDocuments({ parentCollection: collection._id });

                // Pobierz przedmioty żeby policzyć komentarze
                const items = await Item.find({ parentCollection: collection._id }).select('comments likes');
                const itemCommentsCount = items.reduce((sum, item) => sum + (item.comments?.length || 0), 0);
                const itemLikesCount = items.reduce((sum, item) => sum + (item.likes?.length || 0), 0);

                return {
                    ...collectionObj,
                    itemsCount,
                    likesCount: (collection.likes?.length || 0) + itemLikesCount,
                    commentsCount: (collection.comments?.length || 0) + itemCommentsCount
                };
            })
        );

        res.json({
            code: "USER_COLLECTIONS_FETCHED",
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            collections: collectionsWithStats
        });
    } catch (error) {
        handleError(res, error, "Błąd pobierania kolekcji użytkownika");
    }
});

router.get("/:id", validateObjectId, optionalAuthenticate, verifyCollectionAccess, async (req, res) => {
    res.json({
        code: "COLLECTION_FETCHED",
        collection: req.collection
    });
});

router.post("/", authenticateToken, validateAllowedUsers, async (req, res) => {
    try {
        const { name, category, privacy, allowedUsers, description } = req.body;

        const collection = await Collection.create({
            name,
            description,
            category,
            owner: req.user._id,
            privacy: privacy || "public",
            allowedUsers
        });

        const populatedCollection = await Collection.findById(collection._id)
            .populate("owner", "_id username")
            .populate("category", "name");

        res.status(201).json({
            code: "COLLECTION_CREATED",
            collection: populatedCollection.toJSON()
        });
    } catch (error) {
        handleError(res, error, "Błąd tworzenia kolekcji");
    }
});

router.patch(
    "/:id",
    validateObjectId,
    authenticateToken,
    verifyCollectionAccess,
    verifyCollectionOwnership,
    validateAllowedUsers,
    async (req, res) => {
        try {
            const allowedUpdates = ["name", "description", "privacy", "coverImage", "allowedUsers", "hideDescription"];
            const updates = Object.keys(req.body)
                .filter(key => allowedUpdates.includes(key))
                .reduce((obj, key) => {
                    obj[key] = req.body[key];
                    return obj;
                }, {});

            const updatedCollection = await Collection.findByIdAndUpdate(
                req.params.id,
                updates,
                { new: true, runValidators: true }
            )
                .populate("owner", "username")
                .populate("category", "name attributes")
                .populate("allowedUsers", "username email");

            res.json({
                code: "COLLECTION_UPDATED",
                collection: updatedCollection
            });
        } catch (error) {
            handleError(res, error, "Błąd aktualizacji kolekcji");
        }
    }
);

router.delete(
    "/:id",
    validateObjectId,
    authenticateToken,
    verifyCollectionAccess,
    verifyCollectionOwnership,
    async (req, res) => {
        try {
            await req.collection.deleteOne();
            res.status(204).end();
        } catch (error) {
            handleError(res, error, "Błąd usuwania kolekcji");
        }
    }
);

router.get("/:id/items", validateObjectId, optionalAuthenticate, verifyCollectionAccess, async (req, res) => {
    try {
        const items = await Item.find({ parentCollection: req.collection._id });

        res.json({
            code: "ITEMS_FETCHED",
            items
        });
    } catch (error) {
        handleError(res, error, "Błąd pobierania przedmiotów");
    }
});

router.get("/special/popular", async (req, res) => {
    try {
        const popularCollections = await Collection.find({ privacy: "public" })
            .sort({ views: -1 })
            .limit(10)
            .populate("owner", "username")
            .populate("category", "name");

        res.json({
            code: "POPULAR_COLLECTIONS",
            collections: popularCollections
        });
    } catch (error) {
        handleError(res, error, "Błąd pobierania popularnych kolekcji");
    }
});

router.get("/:id/stats", validateObjectId, optionalAuthenticate, verifyCollectionAccess, async (req, res) => {
    try {
        const itemsCount = await Item.countDocuments({ parentCollection: req.collection._id });

        res.json({
            code: "COLLECTION_STATS",
            itemsCount,
            views: req.collection.views,
            likesCount: req.collection.likesCount || 0,
            commentsCount: req.collection.comments ? req.collection.comments.length : 0,
            created: req.collection.createdAt
        });
    } catch (error) {
        handleError(res, error, "Błąd pobierania statystyk");
    }
});

router.post("/:id/view", validateObjectId, optionalAuthenticate, verifyCollectionAccess, async (req, res) => {
    try {
        await Collection.findByIdAndUpdate(req.collection._id, { $inc: { views: 1 } });
        res.status(204).end();
    } catch (error) {
        handleError(res, error, "Błąd aktualizacji licznika");
    }
});

router.get("/:id/allowed-users", validateObjectId, authenticateToken, verifyCollectionAccess, async (req, res) => {
    try {
        const collection = await Collection.findById(req.collection._id)
            .populate("allowedUsers", "username email")
            .select("allowedUsers");

        res.json({
            code: "ALLOWED_USERS_FETCHED",
            users: collection.allowedUsers
        });
    } catch (error) {
        handleError(res, error, "Błąd pobierania listy dostępu");
    }
});

router.post("/:id/allowed-users", validateObjectId, authenticateToken, verifyCollectionAccess, verifyCollectionOwnership, async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                code: "INVALID_USERNAME",
                message: "Należy podać nazwę użytkownika"
            });
        }

        const user = await User.findOne({ username: username.trim() });
        if (!user) {
            return res.status(404).json({
                code: "USER_NOT_FOUND",
                message: "Użytkownik o podanej nazwie nie istnieje"
            });
        }

        const updatedCollection = await Collection.findByIdAndUpdate(
            req.collection._id,
            {
                $addToSet: { allowedUsers: user._id },
                $set: { privacy: "private" }
            },
            { new: true }
        ).populate("allowedUsers", "username email");

        res.json({
            code: "USER_ADDED_TO_COLLECTION",
            allowedUsers: updatedCollection.allowedUsers
        });
    } catch (error) {
        handleError(res, error, "Błąd dodawania użytkownika");
    }
});

router.delete("/:id/allowed-users/:userId", validateObjectId, authenticateToken, verifyCollectionAccess, verifyCollectionOwnership, async (req, res) => {
    try {
        const updatedCollection = await Collection.findByIdAndUpdate(
            req.collection._id,
            { $pull: { allowedUsers: req.params.userId } },
            { new: true }
        ).populate("allowedUsers", "username email");

        res.json({
            code: "USER_REMOVED_FROM_COLLECTION",
            removedUserId: req.params.userId,
            allowedUsers: updatedCollection.allowedUsers
        });
    } catch (error) {
        handleError(res, error, "Błąd usuwania użytkownika");
    }
});

router.post("/:id/like", validateObjectId, authenticateToken, verifyCollectionAccess, async (req, res) => {
    try {
        const userId = req.user._id;

        const collection = await Collection.findById(req.collection._id).select("likes likesCount");
        if (!collection) {
            return res.status(404).json({
                code: "COLLECTION_NOT_FOUND",
                message: "Kolekcja nie istnieje"
            });
        }

        const hasLiked = collection.likes.some(id => id.equals(userId));

        const updated = await Collection.findByIdAndUpdate(
            req.collection._id,
            hasLiked
                ? { $pull: { likes: userId } }
                : { $addToSet: { likes: userId } },
            { new: true }
        ).select("likes");

        res.json({
            code: "COLLECTION_LIKE_UPDATED",
            liked: !hasLiked,
            likesCount: updated.likes.length
        });
    } catch (error) {
        handleError(res, error, "Błąd aktualizacji polubień");
    }
});

router.get("/:id/comments", validateObjectId, optionalAuthenticate, verifyCollectionAccess, async (req, res) => {
    try {
        const collection = await Collection.findById(req.collection._id)
            .select("comments")
            .populate("comments.user", "username");

        if (!collection) {
            return res.status(404).json({
                code: "COLLECTION_NOT_FOUND",
                message: "Kolekcja nie istnieje"
            });
        }

        res.json({
            code: "COLLECTION_COMMENTS_FETCHED",
            comments: collection.comments
        });
    } catch (error) {
        handleError(res, error, "Błąd pobierania komentarzy");
    }
});

router.post("/:id/comments", validateObjectId, authenticateToken, verifyCollectionAccess, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                code: "COMMENT_TEXT_REQUIRED",
                message: "Treść komentarza jest wymagana"
            });
        }

        const newComment = {
            user: req.user._id,
            text: text.trim(),
            createdAt: new Date()
        };

        const collection = await Collection.findByIdAndUpdate(
            req.collection._id,
            { $push: { comments: newComment } },
            { new: true }
        ).populate("comments.user", "username");

        if (!collection) {
            return res.status(404).json({
                code: "COLLECTION_NOT_FOUND",
                message: "Kolekcja nie istnieje"
            });
        }

        const addedComment = collection.comments[collection.comments.length - 1];

        res.status(201).json({
            code: "COMMENT_ADDED",
            comment: addedComment
        });
    } catch (error) {
        handleError(res, error, "Błąd dodawania komentarza");
    }
});

router.delete("/:id/comments/:commentId", validateObjectId, authenticateToken, verifyCollectionAccess, async (req, res) => {
    try {
        const collection = await Collection.findById(req.collection._id).select("owner comments");
        if (!collection) {
            return res.status(404).json({
                code: "COLLECTION_NOT_FOUND",
                message: "Kolekcja nie istnieje"
            });
        }

        const comment = collection.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({
                code: "COMMENT_NOT_FOUND",
                message: "Komentarz nie istnieje"
            });
        }

        const isOwner = collection.owner.equals(req.user._id);
        const isAuthor = comment.user.equals(req.user._id);
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAuthor && !isAdmin) {
            return res.status(403).json({
                code: "COMMENT_DELETE_FORBIDDEN",
                message: "Nie masz uprawnień do usunięcia tego komentarza"
            });
        }

        comment.remove();
        await collection.save();

        res.json({
            code: "COMMENT_DELETED",
            commentId: req.params.commentId
        });
    } catch (error) {
        handleError(res, error, "Błąd usuwania komentarza");
    }
});

export default router;
