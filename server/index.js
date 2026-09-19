require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const supportRoutes = require('./routes/supportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const {
    paystackWebhook
} = require('./controllers/webhookController');

const {
    notFound,
    errorHandler
} = require('./middleware/errorMiddleware');

const app = express();

const PORT = process.env.PORT || 3000;


// ==========================
// DATABASE
// ==========================

connectDB();


// ==========================
// SECURITY
// ==========================

app.disable('x-powered-by');

app.use(
    helmet()
);


// ==========================
// CORS
// ==========================

const frontendUrl =
    process.env.FRONTEND_URL ||
    'http://localhost:5173';

const allowedOrigins = [
    frontendUrl
];

app.use(
    cors({
        origin: (origin, callback) => {

            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error('Not allowed by CORS')
            );
        },

        methods: [
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'PATCH',
            'OPTIONS'
        ],

        allowedHeaders: [
            'Content-Type',
            'Authorization'
        ]
    })
);


// ==========================
// BODY PARSING
// ==========================

app.use(
    express.json({
        limit: '1mb',

        verify: (req, res, buf) => {
            req.rawBody = buf;
        }
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: '1mb'
    })
);


// ==========================
// PAYSTACK WEBHOOK
// ==========================
//
// This must be registered before the
// general /api rate limiter.
//
// Paystack uses the raw request body
// to verify the webhook signature.
//

app.post(
    '/api/payments/webhook',
    paystackWebhook
);


// ==========================
// GENERAL RATE LIMIT
// ==========================

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 200,

    standardHeaders: 'draft-8',

    legacyHeaders: false,

    message: {
        success: false,
        message:
            'Too many requests. Please try again later.'
    }
});

app.use(
    '/api',
    apiLimiter
);


// ==========================
// AUTH RATE LIMIT
// ==========================

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 20,

    standardHeaders: 'draft-8',

    legacyHeaders: false,

    message: {
        success: false,
        message:
            'Too many authentication attempts. Please try again later.'
    }
});


// ==========================
// ROUTES
// ==========================

app.use(
    '/api/auth',
    authLimiter,
    authRoutes
);

app.use(
    '/api/products',
    productRoutes
);

app.use(
    '/api/requests',
    requestRoutes
);

app.use(
    '/api/admin',
    adminRoutes
);

app.use(
    '/api/orders',
    orderRoutes
);

app.use(
    '/api/payments',
    paymentRoutes
);

app.use(
    '/api/support',
    supportRoutes
);

app.use(
    '/api/notifications',
    notificationRoutes
);


// ==========================
// ROOT
// ==========================

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to FarmLink API'
    });
});


// ==========================
// HEALTH CHECK
// ==========================

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'FarmLink API is running'
    });
});


// ==========================
// 404 HANDLER
// ==========================

app.use(notFound);


// ==========================
// ERROR HANDLER
// ==========================

app.use(errorHandler);


// ==========================
// START SERVER
// ==========================

app.listen(PORT, '0.0.0.0', () => {
    console.log(
        `🚀 FarmLink server running on port ${PORT}`
    );
});