const express = require('express');

const router = express.Router();

const {
    registerUser,
    loginUser
} = require('../controllers/authController');

const {
    authLimiter
} = require('../middleware/rateLimitMiddleware');


// ==========================
// AUTHENTICATION ROUTES
// ==========================

// Registration
router.post(
    '/register',
    authLimiter,
    registerUser
);

// Login
router.post(
    '/login',
    authLimiter,
    loginUser
);


module.exports = router;