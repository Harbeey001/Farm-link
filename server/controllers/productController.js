const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');


// ==========================
// CREATE PRODUCT
// ==========================

const createProduct = async (req, res) => {
    try {
        const {
            name,
            category,
            description,
            quantity,
            unit,
            price,
            location
        } = req.body;

        const farmer = req.user.id;

        // ==========================
        // REQUIRED FIELDS
        // ==========================

        if (
            name === undefined ||
            category === undefined ||
            description === undefined ||
            quantity === undefined ||
            unit === undefined ||
            price === undefined ||
            location === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Please provide all required product fields'
            });
        }

        // ==========================
        // VALIDATE TEXT FIELDS
        // ==========================

        const textFields = [
            {
                value: name,
                label: 'Product name'
            },
            {
                value: category,
                label: 'Product category'
            },
            {
                value: description,
                label: 'Product description'
            },
            {
                value: unit,
                label: 'Product unit'
            },
            {
                value: location,
                label: 'Product location'
            }
        ];

        for (const field of textFields) {
            if (
                typeof field.value !== 'string' ||
                !field.value.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${field.label} cannot be empty`
                });
            }
        }

        // ==========================
        // VALIDATE NUMBERS
        // ==========================

        const numericQuantity = Number(quantity);
        const numericPrice = Number(price);

        if (
            !Number.isFinite(numericQuantity) ||
            numericQuantity < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Quantity must be a valid number greater than or equal to 0'
            });
        }

        if (
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Price must be a valid number greater than or equal to 0'
            });
        }

        // ==========================
        // VERIFY FARMER
        // ==========================

        const farmerExists =
            await User.findById(farmer);

        if (!farmerExists) {
            return res.status(404).json({
                success: false,
                message: 'Farmer not found'
            });
        }

        if (farmerExists.role !== 'farmer') {
            return res.status(403).json({
                success: false,
                message:
                    'Only farmers can create produce listings'
            });
        }

        if (
            farmerExists.accountStatus !==
            'active'
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'Your account is not active'
            });
        }

        if (
            farmerExists.verificationStatus !==
            'verified'
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'Your farmer account must be verified before you can list produce'
            });
        }

        // ==========================
        // UPLOAD IMAGE
        // ==========================

        let imageUrl = '';

        if (req.file) {
            const result = await new Promise(
                (resolve, reject) => {
                    const uploadStream =
                        cloudinary.uploader.upload_stream(
                            {
                                folder:
                                    'farmlink/products'
                            },
                            (
                                error,
                                result
                            ) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result);
                                }
                            }
                        );

                    uploadStream.end(
                        req.file.buffer
                    );
                }
            );

            imageUrl = result.secure_url;
        }

        // ==========================
        // CREATE PRODUCT
        // ==========================

        const product =
            await Product.create({
                name: name.trim(),
                category: category.trim(),
                description:
                    description.trim(),
                quantity: numericQuantity,
                unit: unit.trim(),
                price: numericPrice,
                location: location.trim(),
                image: imageUrl,
                farmer
            });

        return res.status(201).json({
            success: true,
            message:
                'Produce listed successfully',
            data: product
        });

    } catch (error) {
        console.error(
            'CREATE PRODUCT ERROR:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while creating product'
        });
    }
};


// ==========================
// GET ALL PRODUCTS
// ==========================

const getProducts = async (req, res) => {
    try {
        const products =
            await Product.find()
               .populate(
    'farmer',
    'name location verificationStatus'
)
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            message:
                'Products fetched successfully',
            data: products
        });

    } catch (error) {
        console.error(
            'Get products error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while fetching products'
        });
    }
};


// ==========================
// GET MY PRODUCTS
// ==========================

const getMyProducts = async (req, res) => {
    try {
        const products =
            await Product.find({
                farmer: req.user.id
            })
                .populate(
                    'farmer',
                    'name email phone location verificationStatus'
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            message:
                'Your products fetched successfully',
            data: products
        });

    } catch (error) {
        console.error(
            'Get my products error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while fetching your products'
        });
    }
};


// ==========================
// GET ONE PRODUCT
// ==========================

const getProductById = async (req, res) => {
    try {
        // ==========================
        // VALIDATE PRODUCT ID
        // ==========================

        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid product ID'
            });
        }

        const product =
            await Product.findById(
                req.params.id
            )
                .populate(
                    'farmer',
                    'name location'
                );

        if (!product) {
            return res.status(404).json({
                success: false,
                message:
                    'Product not found'
            });
        }

        return res.status(200).json({
            success: true,
            message:
                'Product fetched successfully',
            data: product
        });

    } catch (error) {
        console.error(
            'Get product error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while fetching product'
        });
    }
};


// ==========================
// UPDATE PRODUCT
// ==========================

const updateProduct = async (req, res) => {
    try {
        // ==========================
        // VALIDATE PRODUCT ID
        // ==========================

        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid product ID'
            });
        }

        const product =
            await Product.findById(
                req.params.id
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message:
                    'Product not found'
            });
        }

        // ==========================
        // OWNERSHIP CHECK
        // ==========================

        if (
            product.farmer.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You are not authorized to update this product'
            });
        }

        const {
            name,
            category,
            description,
            quantity,
            unit,
            price,
            location,
            status
        } = req.body;


        // ==========================
        // VALIDATE NAME
        // ==========================

        if (name !== undefined) {
            if (
                typeof name !== 'string' ||
                !name.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Product name cannot be empty'
                });
            }

            product.name =
                name.trim();
        }


        // ==========================
        // VALIDATE CATEGORY
        // ==========================

        if (category !== undefined) {
            if (
                typeof category !== 'string' ||
                !category.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Product category cannot be empty'
                });
            }

            product.category =
                category.trim();
        }


        // ==========================
        // VALIDATE DESCRIPTION
        // ==========================

        if (description !== undefined) {
            if (
                typeof description !== 'string' ||
                !description.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Product description cannot be empty'
                });
            }

            product.description =
                description.trim();
        }


        // ==========================
        // VALIDATE QUANTITY
        // ==========================

        if (quantity !== undefined) {
            const numericQuantity =
                Number(quantity);

            if (
                !Number.isFinite(
                    numericQuantity
                ) ||
                numericQuantity < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Quantity must be a valid number greater than or equal to 0'
                });
            }

            product.quantity =
                numericQuantity;
        }


        // ==========================
        // VALIDATE UNIT
        // ==========================

        if (unit !== undefined) {
            if (
                typeof unit !== 'string' ||
                !unit.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Product unit cannot be empty'
                });
            }

            product.unit =
                unit.trim();
        }


        // ==========================
        // VALIDATE PRICE
        // ==========================

        if (price !== undefined) {
            const numericPrice =
                Number(price);

            if (
                !Number.isFinite(
                    numericPrice
                ) ||
                numericPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Price must be a valid number greater than or equal to 0'
                });
            }

            product.price =
                numericPrice;
        }


        // ==========================
        // VALIDATE LOCATION
        // ==========================

        if (location !== undefined) {
            if (
                typeof location !== 'string' ||
                !location.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Product location cannot be empty'
                });
            }

            product.location =
                location.trim();
        }


        // ==========================
        // VALIDATE STATUS
        // ==========================

        if (status !== undefined) {
            const allowedStatuses = [
                'available',
                'sold',
                'inactive'
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Invalid product status'
                });
            }

            // A product with no stock
            // cannot be made available
            if (
                status === 'available' &&
                Number(product.quantity) <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'A product with zero quantity cannot be marked as available'
                });
            }

            product.status =
                status;
        }


        // ==========================
        // AUTOMATIC STOCK STATUS
        // ==========================

        if (
            Number(product.quantity) === 0
        ) {
            product.status = 'sold';
        }

        if (
            Number(product.quantity) > 0 &&
            product.status === 'sold' &&
            status === undefined
        ) {
            product.status =
                'available';
        }


        await product.save();

        return res.status(200).json({
            success: true,
            message:
                'Product updated successfully',
            data: product
        });

    } catch (error) {
        console.error(
            'Update product error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while updating product'
        });
    }
};


// ==========================
// DELETE PRODUCT
// ==========================

const deleteProduct = async (req, res) => {
    try {
        // ==========================
        // VALIDATE PRODUCT ID
        // ==========================

        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid product ID'
            });
        }

        const product =
            await Product.findById(
                req.params.id
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message:
                    'Product not found'
            });
        }

        // ==========================
        // OWNERSHIP CHECK
        // ==========================

        if (
            product.farmer.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You are not authorized to delete this product'
            });
        }

        await Product.findByIdAndDelete(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message:
                'Product deleted successfully',
            data: product
        });

    } catch (error) {
        console.error(
            'Delete product error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while deleting product'
        });
    }
};


// ==========================
// EXPORT
// ==========================

module.exports = {
    createProduct,
    getProducts,
    getMyProducts,
    getProductById,
    updateProduct,
    deleteProduct
};