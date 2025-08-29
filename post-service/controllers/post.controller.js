const { default: mongoose } = require("mongoose");
const axios = require("axios");
const validateCreatePost = require("../middleware/Validation");
const Post = require("../models/Post.model");
const logger = require("../utils/logger");
const { PublishEvent } = require("../utils/rabbitmq");

const invalidateCachedPosts = async (req, input) => {
    try {
        const cacheKey = `post-${input}`;
        await req.redisClient.del(cacheKey);

        const keys = await req.redisClient.keys('posts-*');
        if (keys.length > 0 && keys) {
            await req.redisClient.del(keys);
        }
    } catch (error) {
        throw error;
    }
}

const getAllPosts = async (req, res) => {
    try {
        let { limit, cursor } = req.query;
        limit = parseInt(limit) || 10; // default 10 posts
        const query = {};
        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }
        const cacheKey = `posts-limit-${limit}-cursor-${cursor ? cursor : ""}`;
        const cachePosts = await req.redisClient.get(cacheKey);
        if (cachePosts) {
            return res.status(200).json({ posts: JSON.parse(cachePosts), success: true })
        }
        const posts = await Post.find(query).sort({ createdAt: -1 }).limit(limit + 1);
        const postIds = posts.map(post => post._id.toString());
        const { data: { media } } = await axios.post(`${process.env.API_GATEWAY_URL}/v1/media/getPostsByPostsIds`, { postIds }, {
            headers: {
                Authorization: req.headers.authorization || `Bearer ${req.cookies.accessToken}`,
                "Content-Type": "application/json"
            }
        });
        const postsWithMedia = posts.map(post => {
            return {
                ...post.toObject(),
                media: media[post._id] || []   // attach media if available
            }
        });
        let nextCursor = null;
        if (posts.length > limit) {
            nextCursor = posts[limit - 1].createdAt; // save cursor
            posts.pop();
        }
        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(postsWithMedia));
        return res.status(200).json({ message: "All Posts Fetched Successfully", success: true, posts: postsWithMedia, nextCursor });
    } catch (error) {
        logger.error("Error while Fetching All Posts: ", error);
        return res.status(500).json({ message: error.message || "Internal Server Error", success: false });
    }
}

const getPost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const cacheKey = `post-${postId}`;
        const cachePost = await req.redisClient.get(cacheKey);
        if (cachePost) {
            return res.status(200).json({ post: JSON.parse(cachePost), success: true })
        }
        if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
            logger.error("Error while Fetching Single Post: ", "Post Id Not Found");
            return res.status(400).json({ message: "Invalid Post ID", success: false });
        }
        const post = await Post.findById(postId).lean();
        if (!post) {
            logger.error("Error while Fetching Single Post: ", "Post Not Found");
            return res.status(404).json({ message: "Post Not Found", success: false });
        }
        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(post));
        return res.status(200).json({ message: "Post Fetched Successfully", success: true, post });

    } catch (error) {
        logger.error("Error while Fetching Single Post: ", error);
        return res.status(500).json({ message: error.message || "Internal Server Error", success: false });
    }
}

const CreatePost = async (req, res) => {
    try {
        const { error } = validateCreatePost(req.body || {});
        if (error) {
            logger.error("Error while Creating Post: ", error.details[0].message);
            return res.status(400).json({ message: error.details[0].message, success: false });
        }
        const { title } = req.body;
        if (req.files.length === 0) {
            logger.error("Error while Creating Post: ", "No Files Uploaded");
            return res.status(400).json({ message: "No Files Uploaded", success: false });
        }
        const files = req.files;
        const newCreatedPost = await Post.create({ user: req.user.userId, title });

        if (!newCreatedPost) {
            logger.error("Error while Creating Post: ", "Post Not Created");
            return res.status(500).json({ message: "Post Not Created", success: false });
        }
        await PublishEvent('post.created', {
            postId: newCreatedPost._id.toString(),
            files: files.map(f => ({
                originalFileName: f.originalname,
                type: f.mimetype,
                size: f.size,
                buffer: f.buffer.toString('base64')
            }))
        })
        await invalidateCachedPosts(req, newCreatedPost._id.toString());
        return res.status(201).json({ message: "Post Created Successfully", success: true });
    } catch (error) {
        logger.error("Error while Creating Post: ", error);
        return res.status(500).json({
            message: error?.message || "Internal Server Error",
            success: false
        });
    }
}

const deletePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
            logger.error("Error while Deleting Post: ", "Post Id Not Found");
            return res.status(400).json({ message: "Invalid Post ID", success: false });
        }
        const post = await Post.findOneAndDelete({
            _id: postId,
            user: req.user.userId
        })
        if (!post) {
            logger.error("Error while Deleting Post: ", "Post Not Found");
            return res.status(404).json({ message: "Post Not Found", success: false });
        }
        try {
            await axios.delete(`${process.env.API_GATEWAY_URL}/v1/media/deletePostMedia/${postId}`, {
                headers: {
                    Authorization: `Bearer ${req.cookies.accessToken}`,
                    "Content-Type": "application/json"
                }
            });
        } catch (mediaError) {
            await Post.create([post.toObject()]);
            return res.status(500).json({ success: false, message: mediaError?.response?.data?.message || mediaError?.message || mediaError.statusText || "Failed to delete media, post restored" });
        }
        await invalidateCachedPosts(req, postId);
        return res.status(200).json({ message: "Post Deleted Successfully", success: true, postId });
    } catch (error) {
        return res.status(500).json({
            message: error?.message || "Internal Server Error",
            success: false
        });
    }
}

module.exports = {
    getAllPosts,
    CreatePost,
    getPost,
    deletePost
}