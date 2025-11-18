export default (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const response = {
        code: err.code || "INTERNAL_ERROR",
        message: err.message || "Wewnętrzny błąd serwera"
    };

    if (process.env.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};