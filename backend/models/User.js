import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            unique: true,
            required: [true, "Nazwa użytkownika jest wymagana"],
            trim: true,
            minlength: 3,
            maxlength: 30,
            match: /^[a-zA-Z0-9_\-]+$/,
            index: true
        },
        password: {
            type: String,
            required: [true, "Hasło jest wymagane"],
            select: false
        },
        email: {
            type: String,
            unique: true,
            required: [true, "Email jest wymagany"],
            validate: {
                validator: v => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
                message: "Nieprawidłowy format email"
            }
        },
        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastLogin: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                delete ret.password;
                delete ret.__v;
                return ret;
            }
        }
    }
);

userSchema.index({ role: 1, createdAt: -1 });

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(new Error("Błąd podczas hashowania hasła"));
    }
});

userSchema.methods = {
    comparePassword: async function(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    },
    toProfile: function() {
        return {
            id: this._id,
            username: this.username,
            email: this.email,
            role: this.role,
            createdAt: this.createdAt
        };
    }
};

export default mongoose.model("User", userSchema);