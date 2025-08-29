const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(err.stack || err.message);
    return res.status(500).json({
        status: false,
        message: err.message || "Internal server error",
    });
}

module.exports = errorHandler;