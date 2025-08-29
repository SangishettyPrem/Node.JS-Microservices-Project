const { getPostsByPostsId, deleteMedia } = require('../controllers/media.controller');
const authenticateRequest = require('../middleware/authMiddleware');

const router = require('express').Router();

router.use(authenticateRequest);

router.post('/getPostsByPostsIds', getPostsByPostsId);
router.delete('/deletePostMedia/:postId', deleteMedia);

module.exports = router;