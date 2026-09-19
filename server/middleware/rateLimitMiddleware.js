const rateLimit = require('express-rate-limit');


// ==========================
// AUTH RATE LIMITER
// ==========================

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes

    max: 10,

    standardHeaders: 'draft-8',

    legacyHeaders: false,

    message: {
        success: false,
        message:
            'Too many authentication attempts. Please try again later.'
    }
});


module.exports = {
    authLimiter
};