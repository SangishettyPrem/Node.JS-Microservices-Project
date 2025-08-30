const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');

const redisClient = new Redis(process.env.REDIS_URL);

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


module.exports = limiter;
