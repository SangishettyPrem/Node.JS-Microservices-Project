const logger = require("../utils/logger")
const jwt = require("jsonwebtoken");

const validateToken = (req, res, next) => {
    try {
        let token;
        logger.info("Authenticating Request");
        if (req.cookies.accessToken) {
            token = req.cookies.accessToken;
        } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            return res.status(401).json({ message: "Unauthorized", success: false });
        }
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                logger.error("Error while Verifying Token: ", err);
                return res.status(429).json({
                    message: "Invalid token!",
                    success: false,
                });
            } else {
                req.user = decoded;
                next();
            }
        });
        logger.info("Request Authenticated");
    } catch (error) {
        logger.error("Error while Authenticating Request: ", error);
        return res.status(500).json({ message: error?.message || "Internal Server Error", success: false });
    }
}

module.exports = validateToken;