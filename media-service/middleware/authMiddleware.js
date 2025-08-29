const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");

const authenticateRequest = (req, res, next) => {
    try {
        let user;
        if (req.headers["x-user"]) {
            try {
                user = JSON.parse(req.headers["x-user"]);
                req.user = user;
                return next();
            } catch (err) {
                logger.error("Invalid x-user header format", err);
                return res.status(400).json({ message: "Invalid user header", success: false });
            }
        }

        if (req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            if (!token) {
                return res.status(401).json({ message: "Unauthorized", success: false });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            return next();
        }

        // No authentication found
        return res.status(401).json({ message: "Unauthorized", success: false });

    } catch (error) {
        logger.error("Error while Authenticating Request: ", error);
        return res.status(500).json({ message: error?.message || "Internal Server Error", success: false });
    }
};

module.exports = authenticateRequest;
