const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDirectory = path.join(__dirname, '../logs');

if (fs.existsSync(logsDirectory) === false) fs.mkdirSync(logsDirectory, { recursive: true });

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'Post-service' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        new winston.transports.File({ filename: path.join(logsDirectory, "error.log"), level: "error" }),
        new winston.transports.File({ filename: path.join(logsDirectory, "combined.log") }),
    ],

});

module.exports = logger;