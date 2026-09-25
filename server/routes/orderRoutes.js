const express = require('express');

const router = express.Router();

const {
    getMyOrders,
    getFarmerOrders,
    getOrderById,
    updateOrderStatus,
    confirmDelivery,
    getAllOrdersForAdmin
} = require('../controllers/orderController');

const {
    protect,
    buyerOnly,
    farmerOnly,
    adminOnly
} = require('../middleware/authMiddleware');


// ==========================
// BUYER ORDERS
// ==========================

// Get logged-in buyer's orders
router.get(
    '/my-orders',
    protect,
    buyerOnly,
    getMyOrders
);


// ==========================
// FARMER ORDERS
// ==========================

// Get logged-in farmer's orders
router.get(
    '/farmer-orders',
    protect,
    farmerOnly,
    getFarmerOrders
);


// ==========================
// ADMIN ORDERS
// ==========================

// Get all orders for admin
router.get(
    '/admin/all',
    protect,
    adminOnly,
    getAllOrdersForAdmin
);


// ==========================
// SINGLE ORDER
// ==========================

// Get one order
router.get(
    '/:id',
    protect,
    getOrderById
);


// ==========================
// UPDATE ORDER STATUS
// ==========================

// Farmer updates order status
router.put(
    '/:id/status',
    protect,
    farmerOnly,
    updateOrderStatus
);


// ==========================
// CONFIRM DELIVERY
// ==========================

// Buyer confirms delivery
router.put(
    '/:id/confirm-delivery',
    protect,
    buyerOnly,
    confirmDelivery
);


module.exports = router;