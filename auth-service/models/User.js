const mongoose = require('mongoose');
const argon2 = require('argon2');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        select: false
    },
},
    {
        timestamps: true,
    }
);

UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        try {
            this.password = await argon2.hash(this.password);
            next();
        } catch (error) {
            next(error);
        }
    }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
        throw error;
    }
}

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ name: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);

module.exports = User;