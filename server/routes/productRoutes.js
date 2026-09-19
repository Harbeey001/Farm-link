const express = require('express');

const {
    createProduct,
    getProducts,
    getMyProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

const {
    protect,
    farmerOnly
} = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

const router = express.Router();


// ==========================
// CREATE PRODUCT
// ==========================

// Only farmers can create products.
router.post(
    '/',
    protect,
    farmerOnly,
    upload.single('image'),
    createProduct
);


// ==========================
// GET ALL PRODUCTS
// ==========================

// Public marketplace.
router.get(
    '/',
    getProducts
);


// ==========================
// GET FARMER'S PRODUCTS
// ==========================

// Only the logged-in farmer can
// access their own products.
router.get(
    '/my-products',
    protect,
    farmerOnly,
    getMyProducts
);


// ==========================
// GET SINGLE PRODUCT
// ==========================

// Public product details.
router.get(
    '/:id',
    getProductById
);


// ==========================
// UPDATE PRODUCT
// ==========================

// Only farmers can update products.
// Controller also verifies ownership.
router.put(
    '/:id',
    protect,
    farmerOnly,
    updateProduct
);


// ==========================
// DELETE PRODUCT
// ==========================

// Only farmers can delete products.
// Controller also verifies ownership.
router.delete(
    '/:id',
    protect,
    farmerOnly,
    deleteProduct
);


module.exports = router;
