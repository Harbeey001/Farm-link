const express = require('express');

const {
    createSupportTicket,
    getMySupportTickets,
    getSupportTicketById,
    getAllSupportTickets,
    respondToSupportTicket,
    updateSupportTicketStatus
} = require('../controllers/supportController');

const {
    protect,
    adminOnly
} = require('../middleware/authMiddleware');

const router = express.Router();

// ============================================
// USER SUPPORT ROUTES
// ============================================

// Create a support ticket
router.post(
    '/',
    protect,
    createSupportTicket
);

// Get logged-in user's support tickets
router.get(
    '/my-tickets',
    protect,
    getMySupportTickets
);

// Get one support ticket
router.get(
    '/:id',
    protect,
    getSupportTicketById
);


// ============================================
// ADMIN SUPPORT ROUTES
// ============================================

// Get all support tickets
router.get(
    '/admin/all',
    protect,
    adminOnly,
    getAllSupportTickets
);

// Admin responds to a ticket
router.put(
    '/admin/:id/respond',
    protect,
    adminOnly,
    respondToSupportTicket
);

// Admin updates ticket status
router.put(
    '/admin/:id/status',
    protect,
    adminOnly,
    updateSupportTicketStatus
);

module.exports = router;