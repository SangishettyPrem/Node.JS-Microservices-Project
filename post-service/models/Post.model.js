const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

PostSchema.index({ title: 'text' });

PostSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;