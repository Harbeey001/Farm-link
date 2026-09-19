const express = require('express');

const router = express.Router();

const {
    getAdminStats,
    getAllUsers,
    getAllProducts,
    getAllRequests,
    getAdminUserById,
    updateUserStatus,
    updateUserVerification
} = require('../controllers/adminController');

const {
    getAllSupportTickets,
    respondToSupportTicket,
    updateSupportTicketStatus
} = require('../controllers/supportController');

const {
    protect,
    adminOnly
} = require('../middleware/authMiddleware');

// ============================================
// ADMIN DASHBOARD
// ============================================

router.get(
    '/stats',
    protect,
    adminOnly,
    getAdminStats
);

// ============================================
// USERS
// ============================================

router.get(
    '/users',
    protect,
    adminOnly,
    getAllUsers
);

router.get(
    '/users/:id',
    protect,
    adminOnly,
    getAdminUserById
);

router.put(
    '/users/:id/status',
    protect,
    adminOnly,
    updateUserStatus
);
router.put(
    '/users/:id/verification',
    protect,
    adminOnly,
    updateUserVerification
);

// ============================================
// PRODUCTS
// ============================================

router.get(
    '/products',
    protect,
    adminOnly,
    getAllProducts
);

// ============================================
// REQUESTS
// ============================================

router.get(
    '/requests',
    protect,
    adminOnly,
    getAllRequests
);

// ============================================
// SUPPORT TICKETS
// ============================================

// Get all support tickets
router.get(
    '/support',
    protect,
    adminOnly,
    getAllSupportTickets
);

// Respond to a support ticket
router.put(
    '/support/:id/respond',
    protect,
    adminOnly,
    respondToSupportTicket
);

// Update support ticket status
router.put(
    '/support/:id/status',
    protect,
    adminOnly,
    updateSupportTicketStatus
);

module.exports = router;