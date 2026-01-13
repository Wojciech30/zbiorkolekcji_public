import mongoose from "mongoose";
import bcrypt from "bcrypt";
import readline from "readline";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../backend/.env") });

// Dynamiczny import modelu User
const User = (await import("../backend/models/User.js")).default;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

async function setup() {
    console.log("\n=== Zbiór Kolekcji - Konfiguracja ===\n");

    try {
        // Połączenie z MongoDB
        const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/zbiorkolekcji";
        console.log(`Łączenie z MongoDB: ${mongoUri}`);

        await mongoose.connect(mongoUri);
        console.log("✅ Połączono z bazą danych\n");

        // Sprawdzenie czy admin istnieje
        const existingAdmin = await User.findOne({ role: "admin" });
        if (existingAdmin) {
            console.log("⚠️  Administrator już istnieje w bazie danych.");
            console.log(`   Username: ${existingAdmin.username}`);
            console.log(`   Email: ${existingAdmin.email}\n`);

            const createAnother = await question("Czy chcesz utworzyć kolejnego admina? (t/n): ");
            if (createAnother.toLowerCase() !== "t") {
                console.log("\nKonfiguracja zakończona.");
                process.exit(0);
            }
        }

        // Zbieranie danych admina
        console.log("\n--- Tworzenie konta administratora ---\n");

        const username = await question("Nazwa użytkownika: ");
        const email = await question("Email: ");
        const password = await question("Hasło (min. 6 znaków): ");

        if (!username || !email || password.length < 6) {
            console.error("❌ Nieprawidłowe dane. Hasło musi mieć min. 6 znaków.");
            process.exit(1);
        }

        // Sprawdzenie czy użytkownik istnieje
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            console.error("❌ Użytkownik o takiej nazwie lub emailu już istnieje.");
            process.exit(1);
        }

        // Tworzenie admina
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await User.create({
            username,
            email,
            password: hashedPassword,
            role: "admin",
            isActive: true,
            isEmailVerified: true
        });

        console.log("\n✅ Administrator utworzony pomyślnie!");
        console.log(`   Username: ${admin.username}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}\n`);

        console.log("Możesz teraz uruchomić aplikację: npm start\n");

    } catch (error) {
        console.error("❌ Błąd podczas konfiguracji:", error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        rl.close();
    }
}

setup();
