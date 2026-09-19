const express = require('express');

const router = express.Router();

const {
    createRequest,
    getRequests,
    getRequestById,
    updateRequestStatus
} = require('../controllers/requestController');

const {
    protect,
    buyerOnly,
    farmerOnly
} = require('../middleware/authMiddleware');


// ==========================
// CREATE REQUEST
// ==========================

// Only buyers can request produce.
router.post(
    '/',
    protect,
    buyerOnly,
    createRequest
);


// ==========================
// GET REQUESTS
// ==========================

// Buyers see their own requests.
// Farmers see requests for their products.
// Admins can view all requests.
router.get(
    '/',
    protect,
    getRequests
);


// ==========================
// GET ONE REQUEST
// ==========================

// Authorization is handled inside
// the request controller.
router.get(
    '/:id',
    protect,
    getRequestById
);


// ==========================
// UPDATE REQUEST STATUS
// ==========================

// Only the farmer who owns the
// product/request can update it.
router.put(
    '/:id/status',
    protect,
    farmerOnly,
    updateRequestStatus
);


module.exports = router;
