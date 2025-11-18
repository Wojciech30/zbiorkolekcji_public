import mongoose from "mongoose";

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