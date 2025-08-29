const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Session = require('../models/Session');
const logger = require('./logger');

const generateHashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
}

const GenerateAccessToken = (user, req) => {
    try {
        return jwt.sign({
            userId: user._id,
            name: user.name,
            email: user.email
        }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_TTL });
    } catch (error) {
        logger.error("Error while Generating Access Token: ", error);
        throw error;
    }
}

const GenerateRefreshToken = async (user, req) => {
    try {
        const Refreshtoken = crypto.randomBytes(32).toString("hex");
        const HashedRefreshToken = generateHashToken(Refreshtoken);

        await Session.deleteMany({ userId: user._id });
        await Session.create({
            token: HashedRefreshToken,
            userId: user._id,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            expiresAt: new Date(Date.now() + Number(process.env.REFRESH_TOKEN_TTL || 604800000))
        })
        return Refreshtoken;
    } catch (e) {
        logger.error("Error while Generating Refresh Token: ", e);
        throw e;
    }
}

module.exports = { GenerateRefreshToken, GenerateAccessToken };