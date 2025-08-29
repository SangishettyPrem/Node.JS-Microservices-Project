const Media = require("../models/media.model");
const cloudinary = require('../utils/cloudinary.config')
const logger = require("../utils/logger")

const getPostsByPostsId = async (req, res) => {
    try {
        const { postIds } = req.body;
        if (!Array.isArray(postIds)) {
            return res.status(500).json({ message: "Invalid Request", success: false });
        }
        const media = await Media.find({ postId: { $in: postIds } });
        const grouped = media.reduce((acc, item) => {
            if (!acc[item.postId]) acc[item.postId] = [];

            item.media.forEach(m => {
                acc[item.postId].push({
                    publicId: m.publicId,
                    url: m.url,
                    _id: m._id
                });
            });
            return acc;
        }, {});

        return res.status(200).json({ media: grouped, success: true });
    } catch (error) {
        logger.error("Error while fetching posts by postsId: ", error);
        return res.status(500).json({ message: error.message || "Internal Server Error", success: false });
    }
}

const deleteMedia = async (req, res) => {
    try {
        const postId = req.params.postId;
        if (!postId) {
            logger.info("Post Id Not found.");
            return res.status(400).json({ message: "Invalid Request", success: false });
        }
        const mediaUrls = await Media.find({ postId: postId });
        if (mediaUrls.length > 0) {
            const mediaList = mediaUrls[0].media;
            mediaList.forEach(async m => {
                const publicId = m.publicId;
                await cloudinary.uploader.destroy(publicId);
            })
        }
        await Media.findOneAndDelete({ postId: postId });
        return res.status(200).json({ message: "Media deleted successfully", success: true });
    } catch (error) {
        logger.error("Error while deleting media: ", error);
        return res.status(500).json({ message: error.message || "Internal Server Error", success: false })
    }
}

module.exports = {
    getPostsByPostsId,
    deleteMedia
}