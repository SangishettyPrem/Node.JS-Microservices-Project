require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const connectDB = require('./database/db');
const { ConnectRabbitMQ, ConsumeEvent } = require('./utils/rabbitmq');
const { handleUploadMedia } = require('./services/media.service');
const mediaRoutes = require('./routers/media.router');
const { limiter } = require('./middleware/limiter');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use(limiter);

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
})
app.get('/', (req, res) => {
    res.status(201).send("Media Service is running");
});

app.use('/api/media', mediaRoutes);

app.use(errorHandler);

async function startServer() {
    await connectDB();
    await ConnectRabbitMQ();

    // Consume Event 
    await ConsumeEvent('post.created', handleUploadMedia);
    app.listen(PORT, () => {
        console.log(`Media Service is running on Port: ${PORT}`);
    })
}

startServer();