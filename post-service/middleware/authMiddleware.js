const logger = require("../utils/logger")

const authenticateRequest = (req, res, next) => {
    try {
        const user = req.headers['x-user'];
        if (user) {
            req.user = JSON.parse(user);
        } else {
            logger.error("Unauthorized Request");
            return res.status(401).json({ message: "Unauthorized", success: false });
        }
        next();
    } catch (error) {
        logger.error("Error while Authenticating Request: ", error);
        return res.status(500).json({ message: error?.message || "Internal Server Error", success: false });
    }
}

module.exports = authenticateRequest;