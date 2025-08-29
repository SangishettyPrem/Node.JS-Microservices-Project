require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser')

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const AuthRoutes = require('./routers/authRoutes');
const { limiter } = require('./middleware/limiter');
const connectDB = require("./database/db");

const app = express();
const port = process.env.PORT || 3001;

app.set('trust proxy', false);
app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

app.use(limiter);

app.use('/api/auth/', AuthRoutes);

app.get('/', (req, res) => {
    logger.info('Received a GET request on /');
    res.send('Auth Service is Working Fine !');
});

app.use(errorHandler);

async function startServer() {
    try {
        await connectDB();
        app.listen(port, async () => {
            console.log(`Auth Service Server is running on port ${port}`);
        });
    } catch (error) {
        logger.error("Failed to connect to server", error);
        process.exit(1);
    }
}

startServer();

process.on('unhandledRejection', (reason, promise) => {
    logger.error("Unhandled Rejection at", promise, "reason:", reason);
    process.exit(1);
});