const verifyCollectionOwnerOnly = (req, res, next) => {
    if (req.collection.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            code: "FORBIDDEN_RESOURCE_ACCESS",
            message: "Tylko właściciel kolekcji może dodawać przedmioty."
        });
    }
    next();
};

export default verifyCollectionOwnerOnly;