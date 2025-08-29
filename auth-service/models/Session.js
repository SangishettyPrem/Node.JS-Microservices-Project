const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        required: true,
    },
    ip: {
        type: String,
    },
    userAgent: {
        type: String,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
});

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model('Session', SessionSchema);

module.exports = Session;