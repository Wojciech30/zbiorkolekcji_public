import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

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
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        emailVerificationToken: {
            type: String,
            select: false
        },
        emailVerificationExpires: {
            type: Date,
            select: false
        },
        passwordResetToken: {
            type: String,
            select: false
        },
        passwordResetExpires: {
            type: Date,
            select: false
        },
        emailVerificationLastSent: {
            type: Date,
            default: null,
            select: false
        },
        avatar: {
            type: String,
            default: ""
        },
        isProfilePublic: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                delete ret.password;
                delete ret.__v;
                delete ret.emailVerificationToken;
                delete ret.emailVerificationExpires;
                delete ret.passwordResetToken;
                delete ret.passwordResetExpires;
                return ret;
            }
        }
    }
);

userSchema.index({ role: 1, createdAt: -1 });

// 🔧 poprawiony hook
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods = {
    comparePassword: async function (candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    },

    toProfile: function () {
        return {
            id: this._id,
            username: this.username,
            email: this.email,
            role: this.role,
            createdAt: this.createdAt,
            isEmailVerified: this.isEmailVerified
        };
    },

    generateEmailVerificationToken: function () {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        this.emailVerificationToken = hashedToken;
        this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

        return rawToken;
    },

    generatePasswordResetToken: function () {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        this.passwordResetToken = hashedToken;
        this.passwordResetExpires = Date.now() + 60 * 60 * 1000;

        return rawToken;
    }
};

export default mongoose.model("User", userSchema);
