require('dotenv').config();
const express = require('express');
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const Redis = require("ioredis");

const limiter = require('./middleware/limiter');
const logger = require('./utils/logger');
const PostRoutes = require('./routes/post.routes');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./database/db');
const { ConnectRabbitMQ } = require('./utils/rabbitmq');

const app = express();
const PORT = process.env.PORT || 3002;

const redisClient = new Redis();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

app.use(limiter);

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
});

app.get('/api/posts/api-working', (req, res) => {
    res.status(200).send("Hello World Post Service !");
})

app.use('/api/posts', ((req, res, next) => {
    req.redisClient = redisClient;
    next();
}), PostRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Post Service is ruuning on port: ${PORT}`);
});

async function startServer() {
    try {
        await connectDB();
        await ConnectRabbitMQ();
        app.listen(PORT, async () => {
            console.log(`Post Service Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error("Failed to connect to server", error);
        process.exit(1);
    }
}

startServer();

//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
