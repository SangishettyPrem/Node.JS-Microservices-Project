const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    media: [
        {
            publicId: { type: String, required: true },
            url: { type: String, required: true }
        }
    ]
}, {
    timestamps: true,
});

const Media = mongoose.model('Media', MediaSchema);

module.exports = Media;
