const verifyCollectionOwnerOnly = (req, res, next) => {
    const ownerId = req.collection.owner._id || req.collection.owner;
    if (ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            code: "FORBIDDEN_RESOURCE_ACCESS",
            message: "Tylko właściciel kolekcji może dodawać przedmioty."
        });
    }
    next();
};

export default verifyCollectionOwnerOnly;