const { getAllPosts, CreatePost, getPost, deletePost } = require('../controllers/post.controller');
const authenticateRequest = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = require('express').Router();

router.use(authenticateRequest);

router.get('/all-posts', getAllPosts);
router.get('/get-post/:postId', getPost);
router.post('/create-post', upload, CreatePost);
router.delete('/delete-post/:postId', deletePost);

module.exports = router;