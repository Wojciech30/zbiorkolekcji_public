import express from "express";
import cors from "cors";
import 'dotenv/config';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import connectDB from "./config/database.js";
import categoriesRouter from "./routes/categories.js";
import authRouter from "./routes/auth.js";
import collectionsRouter from "./routes/collections.js";
import userRouter from "./routes/user.js";
import itemsRouter from "./routes/items.js";
import errorHandler from "./middleware/errorHandler.js";
import mongoose from "mongoose";

const app = express();

// 1. Konfiguracja bezpieczeństwa
app.use(helmet());

// Poprawiona konfiguracja CORS z obsługą wielu środowisk
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ["http://172.23.52.141:8080"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Client-Version"],
    credentials: true
}));

// 2. Aktywacja ograniczenia liczby żądań
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(apiLimiter); // Aktywacja limitera dla wszystkich ścieżek

// 3. Logowanie żądań
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// 4. Parsowanie JSON
app.use(express.json({ limit: "10kb" }));

// 5. Połączenie z bazą danych
connectDB().then(() => {
    console.log("Database connection verified");
}).catch((error) => {
    console.error("Critical DB connection error:", error);
    process.exit(1);
});

// 6. Wersjonowanie API
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/collections", collectionsRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/items", itemsRouter);

// 7. Testowa trasa
app.get("/api/v1/healthcheck", (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        dbStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
});

// 8. Obsługa błędów
app.use((req, res) => {
    res.status(404).json({
        code: "ENDPOINT_NOT_FOUND",
        message: "Żądany endpoint nie istnieje"
    });
});

app.use(errorHandler);

// 9. Graceful shutdown
const server = app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});

const shutdown = async () => {
    console.log("Closing server...");
    await server.close();
    console.log("Closing database connection...");
    await mongoose.disconnect();
    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);