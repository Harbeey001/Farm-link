const express = require('express');

const {
    initializePayment,
    verifyPayment,
    getMyPayments,
    createFarmerRecipient,
    requestFarmerPayout
} = require('../controllers/paymentController');

const {
    protect,
    buyerOnly,
    farmerOnly,
    adminOnly
} = require('../middleware/authMiddleware');

const router = express.Router();


// ==========================
// INITIALIZE PAYMENT
// ==========================
// Only authenticated buyers can
// initialize payment for their orders.

router.post(
    '/initialize',
    protect,
    buyerOnly,
    initializePayment
);


// ==========================
// CREATE PAYOUT RECIPIENT
// ==========================
// Only authenticated farmers can
// save their bank payout details.

router.post(
    '/recipient',
    protect,
    farmerOnly,
    createFarmerRecipient
);


// ==========================
// REQUEST FARMER PAYOUT
// ==========================
// Only authenticated admins can
// process farmer payouts.

router.post(
    '/payout/:orderId',
    protect,
    adminOnly,
    requestFarmerPayout
);


// ==========================
// VERIFY PAYMENT
// ==========================
// Only authenticated buyers can
// verify their payment.

router.get(
    '/verify/:reference',
    protect,
    buyerOnly,
    verifyPayment
);


// ==========================
// GET MY PAYMENTS
// ==========================
// Only authenticated buyers can
// view their own payment history.

router.get(
    '/my-payments',
    protect,
    buyerOnly,
    getMyPayments
);


module.exports = router;
