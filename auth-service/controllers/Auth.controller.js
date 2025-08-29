const crypto = require('crypto')
const User = require("../models/User");
const { GenerateAccessToken, GenerateRefreshToken } = require("../utils/generateToken");
const logger = require("../utils/logger");
const { RegisterUserValidation, UserLoginValidation } = require("../utils/Validation");
const Session = require('../models/Session');

const login = async (req, res) => {
    try {
        const errors = UserLoginValidation.validate(req.body);
        if (errors.error) {
            return res.status(400).json({
                success: false,
                message: errors.error.details[0].message
            });
        }
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User Not Found"
            });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: "Invalid Password"
            });
        }
        const accessToken = GenerateAccessToken(user);
        const refreshToken = await GenerateRefreshToken(user, req);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,       // cannot be accessed by JS (prevents XSS attacks)
            secure: true,         // true = cookie sent only over HTTPS
            sameSite: "strict",   // prevents CSRF
            maxAge: 15 * 60 * 1000, // 15 min (match accessToken expiry)
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user
        });
    } catch (e) {
        logger.error("Login error occured", e);
        return res.status(500).json({
            success: false,
            message: e?.message || "Internal server error",
        });
    }
}

const register = async (req, res) => {
    try {
        const errors = RegisterUserValidation.validate(req.body);
        if (errors.error) {
            return res.status(400).json({
                success: false,
                message: errors.error.details[0].message
            });
        }
        const { name, email, password } = req.body;

        const isUserExists = await User.findOne({ $or: [{ name }, { email }] });

        if (isUserExists) {
            return res.status(400).json({ message: "User already exists with this email or name" });
        }
        await User.create({ name, email, password });
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
        });
    } catch (error) {
        logger.error("Registration error occured", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Internal server error",
        });
    }
}

const RefreshHandler = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "No refresh token found"
            });
        }
        const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
        const session = await Session.findOne({ token: tokenHash });
        if (!session || session.expiresAt < new Date()) {
            return res.status(403).json({ success: false, message: "Invalid/expired refresh token" });
        }

        const user = await User.findById(session.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const accessToken = GenerateAccessToken(user);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,       // cannot be accessed by JS (prevents XSS attacks)
            secure: true,         // true = cookie sent only over HTTPS
            sameSite: "strict",   // prevents CSRF
            maxAge: 15 * 60 * 1000, // 15 min (match accessToken expiry)
        });

        return res.json({ success: true });
    } catch (error) {
        logger.error("Refresh Handler error occured", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Internal server error",
        });
    }
}

const LogoutHandler = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(500).json({
                success: false,
                message: "Invalid Request"
            })
        }
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await Session.deleteOne({ token: tokenHash });
        res.clearCookie("refreshToken");
        return res.json({ status: true });
    } catch (error) {
        logger.error("Logout Handler error occured", e);
        return res.status(500).json({
            success: false,
            message: error?.message || "Internal server error",
        });
    }
}

module.exports = {
    login,
    register,
    RefreshHandler,
    LogoutHandler
};