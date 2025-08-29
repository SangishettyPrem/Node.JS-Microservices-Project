const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');

const redisClient = new Redis();

// General rate limiter (all routes)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return res.status(429).json({
            status: false,
            message: `Too many requests from ${req.ip}. Please try again later.`,
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: 'rate-limit:',
    }),
});

// Stricter limiter for login only
const sensitiveLoginLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'login-rate-limit',
    points: 5,               // 5 attempts
    duration: 15 * 60,       // per 15 minutes
    blockDuration: 15 * 60,  // block for 15 min after limit reached
});

const loginRateLimiterMiddleware = async (req, res, next) => {
    try {
        await sensitiveLoginLimiter.consume(req.ip);
        return next();
    } catch (err) {
        return res.status(429).json({
            status: false,
            message: `Too many failed login attempts. Please try again later.`,
        });
    }
};

module.exports = { limiter, loginRateLimiterMiddleware };
