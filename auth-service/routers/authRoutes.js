const { login, register, RefreshHandler, LogoutHandler } = require('../controllers/Auth.controller');
const { loginRateLimiterMiddleware } = require('../middleware/limiter');

const router = require('express').Router();

router.post('/login', loginRateLimiterMiddleware, login);
router.post('/register', register);
router.post('/refresh', RefreshHandler);
router.post('/logout', LogoutHandler);


module.exports = router;