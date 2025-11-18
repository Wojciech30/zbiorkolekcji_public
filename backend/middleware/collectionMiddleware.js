import Collection from "../models/Collection.js";

export const verifyCollectionAccess = async (req, res, next) => {
    try {
        const collection = await Collection.findById(req.params.id)
            .populate("allowedUsers");

        if (!collection) {
            return res.status(404).json({
                code: "COLLECTION_NOT_FOUND",
                message: "Kolekcja nie istnieje"
            });
        }

        const isOwner = collection.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";
        const isAllowed = collection.privacy === "public" ||
            collection.allowedUsers.some(user => user._id.toString() === req.user._id.toString());

        if (!isOwner && !isAdmin && !isAllowed) {
            return res.status(403).json({
                code: "ACCESS_DENIED",
                message: "Brak uprawnień do tej kolekcji"
            });
        }

        req.collection = collection;
        next();
    } catch (error) {
        console.error("Błąd weryfikacji dostępu:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: "Wewnętrzny błąd serwera"
        });
    }
};

export const verifyCollectionOwnership = async (req, res, next) => {
    try {
        const isOwner = req.collection.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                code: "FORBIDDEN_RESOURCE_ACCESS",
                message: "Brak uprawnień do modyfikacji kolekcji"
            });
        }

        next();
    } catch (error) {
        console.error("Błąd weryfikacji właściciela:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: "Błąd serwera podczas weryfikacji uprawnień"
        });
    }
};

export const validateAllowedUsers = async (req, res, next) => {
    try {
        const { privacy, allowedUsers } = req.body;

        if (privacy === 'public' && allowedUsers?.length > 0) {
            return res.status(400).json({
                code: 'PUBLIC_COLLECTION_CONFLICT',
                message: 'Kolekcja publiczna nie może mieć przypisanych użytkowników'
            });
        }

        if (privacy === 'private' && allowedUsers) {
            const invalidUsers = await mongoose.model('User').find({
                _id: { $in: allowedUsers },
                $or: [{ isActive: false }, { _id: req.user._id }]
            });

            if (invalidUsers.length > 0) {
                return res.status(400).json({
                    code: 'INVALID_USERS_SELECTED',
                    message: 'Nie można dodać nieaktywnych użytkowników lub samego siebie',
                    invalidUsers: invalidUsers.map(u => u._id)
                });
            }
        }

        next();
    } catch (error) {
        console.error("Błąd walidacji użytkowników:", error);
        res.status(500).json({
            code: "SERVER_ERROR",
            message: "Błąd serwera podczas walidacji"
        });
    }
};