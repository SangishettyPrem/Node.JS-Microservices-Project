require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const proxy = require('express-http-proxy');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const limiter = require('./middleware/limiter');
const validateToken = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(limiter);
app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
});

const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, '/api')
    },
    proxyErrorHandler: (err, res, next) => {
        if (err) {
            logger.error(`Proxy error: ${err.message}`);
            res.status(500).json({
                message: err.message || `Internal server error`,
                error: err.message,
            });
        } else {
            next();
        }
    }
}

app.get('/', (req, res) => {
    res.status(200).send("Hello World");
})

app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-type"] = 'application/json'
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(
            `Response received from Identity service: ${proxyRes.statusCode}`
        );
        return proxyResData;
    }

}));

app.use('/v1/posts',
    validateToken,
    proxy(process.env.POST_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if (!srcReq.headers['content-type']?.startsWith('multipart/form-data')) {
                proxyReqOpts.headers["Content-type"] = 'application/json'
            }
            proxyReqOpts.headers["x-user"] = JSON.stringify(srcReq.user);
            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(
                `Response received from Post service: ${proxyRes.statusCode}`
            );
            return proxyResData;
        }

    }));

app.use('/v1/media',
    validateToken,
    proxy(process.env.MEDIA_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if (!srcReq.headers['content-type']?.startsWith('multipart/form-data')) {
                proxyReqOpts.headers["Content-type"] = 'application/json'
            }
            proxyReqOpts.headers["x-user"] = JSON.stringify(srcReq.user);
            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(
                `Response received from Media service: ${proxyRes.statusCode}`
            );
            return proxyResData;
        }

    }));

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`API Gateway is running on port ${PORT}`);
    logger.info(`Identity Service URL: ${process.env.IDENTITY_SERVICE_URL}`)
    logger.info(`Post Service URL: ${process.env.POST_SERVICE_URL}`)
    logger.info(`Media Service URL: ${process.env.MEDIA_SERVICE_URL}`)
});
