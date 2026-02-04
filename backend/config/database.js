/**
 * @fileoverview Konfiguracja połączenia z bazą danych MongoDB
 * @description Funkcja łącząca z MongoDB używając zmiennej MONGODB_URI z .env
 * 
 * @module config/database
 * @env MONGODB_URI - Connection string do MongoDB
 */

import mongoose from "mongoose";

/**
 * Nawiązuje połączenie z bazą danych MongoDB
 * @async
 * @throws {Error} Jeśli połączenie się nie powiedzie - kończy proces
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Połączono z MongoDB');
    } catch (err) {
        console.error(`Błąd połączenia z MongoDB: ${err.message}`);
        process.exit(1);
    }
};

export default connectDB;