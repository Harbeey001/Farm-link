const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');


// ==========================
// PROTECT ROUTES
// ==========================

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // ==========================
        // CHECK AUTHORIZATION HEADER
        // ==========================

        if (
            !authHeader ||
            !authHeader.startsWith('Bearer ')
        ) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const token = authHeader
            .slice(7)
            .trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token missing'
            });
        }

        // ==========================
        // CHECK JWT SECRET
        // ==========================

        if (!process.env.JWT_SECRET) {
            console.error(
                'JWT_SECRET is not configured'
            );

            return res.status(500).json({
                success: false,
                message:
                    'Server authentication configuration error'
            });
        }

        // ==========================
        // VERIFY JWT
        // ==========================

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // ==========================
        // VALIDATE TOKEN PAYLOAD
        // ==========================

        if (
            !decoded ||
            !decoded.id ||
            !decoded.role
        ) {
            return res.status(401).json({
                success: false,
                message:
                    'Invalid authentication token'
            });
        }

        // ==========================
        // VALIDATE USER ID
        // ==========================

        if (
            !mongoose.Types.ObjectId.isValid(
                decoded.id
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    'Invalid authentication token'
            });
        }

        // ==========================
        // VALIDATE TOKEN ROLE
        // ==========================

        const allowedRoles = [
            'buyer',
            'farmer',
            'admin'
        ];

        if (
            !allowedRoles.includes(
                decoded.role
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    'Invalid authentication token'
            });
        }

        // ==========================
        // GET CURRENT USER
        // ==========================

        const user = await User.findById(
            decoded.id
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    'User account no longer exists'
            });
        }

        // ==========================
        // CHECK ACCOUNT STATUS
        // ==========================

        if (
            user.accountStatus === 'suspended' ||
            user.accountStatus === 'blocked'
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'Your account is not permitted to access FarmLink. Please contact FarmLink support.'
            });
        }

        // ==========================
        // CHECK CURRENT ROLE
        // ==========================

        if (
            user.role !== decoded.role
        ) {
            return res.status(401).json({
                success: false,
                message:
                    'Authentication information is no longer valid'
            });
        }

        // ==========================
        // ATTACH USER TO REQUEST
        // ==========================

        req.user = {
            id: user._id.toString(),
            role: user.role
        };

        next();

    } catch (error) {
        console.error(
            'Authentication error:',
            error.message
        );

        return res.status(401).json({
            success: false,
            message:
                'Invalid or expired token'
        });
    }
};


// ==========================
// ADMIN ONLY
// ==========================

const adminOnly = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message:
                'Authentication required'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message:
                'Admin access required'
        });
    }

    next();
};


// ==========================
// BUYER ONLY
// ==========================

const buyerOnly = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message:
                'Authentication required'
        });
    }

    if (req.user.role !== 'buyer') {
        return res.status(403).json({
            success: false,
            message:
                'Buyer access required'
        });
    }

    next();
};


// ==========================
// FARMER ONLY
// ==========================

const farmerOnly = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message:
                'Authentication required'
        });
    }

    if (req.user.role !== 'farmer') {
        return res.status(403).json({
            success: false,
            message:
                'Farmer access required'
        });
    }

    next();
};


module.exports = {
    protect,
    adminOnly,
    buyerOnly,
    farmerOnly
};