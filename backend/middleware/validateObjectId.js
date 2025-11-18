import mongoose from "mongoose";

const validateObjectId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            code: 'INVALID_ID_FORMAT',
            message: 'Nieprawidłowy format identyfikatora'
        });
    }
    next();
};

export default validateObjectId;