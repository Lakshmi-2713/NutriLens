const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }

            // Add user ID to request
            req.userId = decoded.userId;
            next();
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Optional: Middleware to check if user is admin (for future use)
const isAdmin = async (req, res, next) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({
            success: false,
            message: 'Authorization error'
        });
    }
};

module.exports = {
    authenticateToken,
    isAdmin
};