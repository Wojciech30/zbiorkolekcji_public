import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Collection from "../models/Collection.js";

const router = express.Router();

/**
 * GET /users/:id - Public user profile
 * Returns user info and their public collections
 */
router.get("/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const { page = 1, limit = 6 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                code: "INVALID_ID_FORMAT",
                message: "Nieprawidłowy format identyfikatora użytkownika"
            });
        }

        const user = await User.findById(userId)
            .select("username avatar createdAt isProfilePublic")
            .lean();

        if (!user) {
            return res.status(404).json({
                code: "USER_NOT_FOUND",
                message: "Użytkownik nie istnieje"
            });
        }

        // Check if profile is public
        if (user.isProfilePublic === false) {
            return res.status(403).json({
                code: "PROFILE_PRIVATE",
                message: "Ten profil jest prywatny"
            });
        }

        // Get total count for pagination
        const totalCollections = await Collection.countDocuments({
            owner: userId,
            privacy: "public"
        });

        // Get user's public collections with stats (paginated)
        const collections = await Collection.find({
            owner: userId,
            privacy: "public"
        })
            .populate("category", "name")
            .sort("-createdAt")
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Calculate totals (from all collections, not just paginated)
        const allCollections = await Collection.find({
            owner: userId,
            privacy: "public"
        }).select("views likes").lean();
        
        const totalViews = allCollections.reduce((sum, c) => sum + (c.views || 0), 0);
        const totalLikes = allCollections.reduce((sum, c) => sum + (c.likes?.length || 0), 0);

        res.json({
            code: "USER_PROFILE_FETCHED",
            user: {
                _id: user._id,
                username: user.username,
                avatar: user.avatar,
                createdAt: user.createdAt
            },
            stats: {
                collections: totalCollections,
                views: totalViews,
                likes: totalLikes
            },
            collections,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCollections,
                pages: Math.ceil(totalCollections / limitNum)
            }
        });

    } catch (error) {
        console.error("Błąd pobierania profilu:", error);
        res.status(500).json({
            code: "USER_PROFILE_ERROR",
            message: "Błąd pobierania profilu użytkownika"
        });
    }
});

export default router;
