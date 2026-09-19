const mongoose = require('mongoose');
const Request = require('../models/Request');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const {
    createNotification
} = require('../utils/notificationHelper');


// ==========================
// CREATE REQUEST
// ==========================

const createRequest = async (req, res) => {
    try {
        const {
            product,
            quantity,
            message
        } = req.body;

        // Buyer comes from JWT
        const buyer = req.user.id;

        // ==========================
        // REQUIRED FIELDS
        // ==========================

        if (!product || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message:
                    'Product and quantity are required'
            });
        }

        // ==========================
        // VALIDATE PRODUCT ID
        // ==========================

        if (
            !mongoose.Types.ObjectId.isValid(
                product
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        // ==========================
        // VALIDATE QUANTITY
        // ==========================

        const requestedQuantity =
            Number(quantity);

        if (
            !Number.isFinite(
                requestedQuantity
            ) ||
            requestedQuantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Quantity must be greater than 0'
            });
        }

        // ==========================
        // VALIDATE MESSAGE
        // ==========================

        if (
            message !== undefined &&
            typeof message !== 'string'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Request message must be valid text'
            });
        }

        const cleanedMessage =
            typeof message === 'string'
                ? message.trim()
                : '';

        if (cleanedMessage.length > 1000) {
            return res.status(400).json({
                success: false,
                message:
                    'Request message cannot exceed 1000 characters'
            });
        }

        // ==========================
        // CHECK BUYER
        // ==========================

        const buyerExists =
            await User.findById(buyer);

        if (!buyerExists) {
            return res.status(404).json({
                success: false,
                message: 'Buyer not found'
            });
        }

        if (buyerExists.role !== 'buyer') {
            return res.status(403).json({
                success: false,
                message:
                    'Only buyers can make requests'
            });
        }

        if (
            buyerExists.accountStatus !==
            'active'
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'Your account is not active'
            });
        }

        // ==========================
        // CHECK PRODUCT
        // ==========================

        const productExists =
            await Product.findById(product);

        if (!productExists) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // ==========================
        // PREVENT SELF REQUEST
        // ==========================

        if (
            productExists.farmer.toString() ===
            buyer
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'You cannot request your own product'
            });
        }

        // ==========================
        // PRODUCT AVAILABILITY
        // ==========================

        if (
            productExists.status !==
            'available'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'This product is no longer available'
            });
        }

        // ==========================
        // CHECK STOCK
        // ==========================

        if (
            requestedQuantity >
            Number(productExists.quantity)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Only ${productExists.quantity} ${productExists.unit} available`
            });
        }

        // ==========================
        // CHECK FARMER
        // ==========================

        const farmerExists =
            await User.findById(
                productExists.farmer
            );

        if (!farmerExists) {
            return res.status(404).json({
                success: false,
                message:
                    'Product farmer not found'
            });
        }

        if (farmerExists.role !== 'farmer') {
            return res.status(400).json({
                success: false,
                message:
                    'Product owner is not a valid farmer'
            });
        }

        if (
            farmerExists.accountStatus !==
            'active'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'This farmer account is not currently active'
            });
        }

        // ==========================
        // PREVENT DUPLICATE REQUEST
        // ==========================

        const existingRequest =
            await Request.findOne({
                buyer,
                product,
                status: 'pending'
            });

        if (existingRequest) {
            return res.status(409).json({
                success: false,
                message:
                    'You already have a pending request for this product'
            });
        }

        // ==========================
        // CREATE REQUEST
        // ==========================

        const newRequest =
            await Request.create({
                buyer,
                farmer: productExists.farmer,
                product,
                quantity: requestedQuantity,
                message: cleanedMessage
            });

        // ==========================
        // NOTIFY FARMER
        // ==========================

        await createNotification({
            recipient:
                productExists.farmer,
            type: 'request',
            title:
                'New Produce Request',
            message:
                'A buyer has sent you a new request for your produce.',
            relatedId:
                newRequest._id
        });

        // ==========================
        // POPULATE RESPONSE
        // ==========================

        await newRequest.populate([
            {
                path: 'buyer',
                select:
                    'name location'
            },
            {
                path: 'farmer',
                select:
                    'name location'
            },
            {
                path: 'product',
                select:
                    'name category price quantity unit image'
            }
        ]);

        return res.status(201).json({
            success: true,
            message:
                'Request sent successfully',
            data: newRequest
        });

    } catch (error) {
        console.error(
            'Create request error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while creating request'
        });
    }
};


// ==========================
// GET REQUESTS
// ==========================

const getRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let filter = {};

        // Buyer sees ONLY their requests
        if (userRole === 'buyer') {
            filter = {
                buyer: userId
            };
        }

        // Farmer sees ONLY requests sent to them
        else if (userRole === 'farmer') {
            filter = {
                farmer: userId
            };
        }

        // Admin can see everything
        else if (userRole === 'admin') {
            filter = {};
        }

        else {
            return res.status(403).json({
                success: false,
                message:
                    'Unauthorized user role'
            });
        }

        const requests =
            await Request.find(filter)
                .populate(
                    'buyer',
                    'name location'
                )
                .populate(
                    'farmer',
                    'name location'
                )
                .populate(
                    'product',
                    'name category price quantity unit image'
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            message:
                'Requests fetched successfully',
            data: requests
        });

    } catch (error) {
        console.error(
            'Get requests error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while fetching requests'
        });
    }
};


// ==========================
// GET ONE REQUEST
// ==========================

const getRequestById = async (req, res) => {
    try {
        // ==========================
        // VALIDATE REQUEST ID
        // ==========================

        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid request ID'
            });
        }

        const request =
            await Request.findById(
                req.params.id
            )
                .populate(
                    'buyer',
                    'name location'
                )
                .populate(
                    'farmer',
                    'name location'
                )
                .populate(
                    'product',
                    'name category price quantity unit image'
                );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    'Request not found'
            });
        }

        // ==========================
        // AUTHORIZATION
        // ==========================

        const userId = req.user.id;
        const userRole = req.user.role;

        const isBuyer =
            request.buyer._id.toString() ===
            userId;

        const isFarmer =
            request.farmer._id.toString() ===
            userId;

        const isAdmin =
            userRole === 'admin';

        if (
            !isBuyer &&
            !isFarmer &&
            !isAdmin
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You are not authorized to view this request'
            });
        }

        return res.status(200).json({
            success: true,
            message:
                'Request fetched successfully',
            data: request
        });

    } catch (error) {
        console.error(
            'Get request error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while fetching request'
        });
    }
};


// ==========================
// UPDATE REQUEST STATUS
// ==========================

const updateRequestStatus = async (
    req,
    res
) => {
    try {
        const { status } = req.body;

        // ==========================
        // VALIDATE REQUEST ID
        // ==========================

        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid request ID'
            });
        }

        // ==========================
        // VALIDATE STATUS
        // ==========================

        const allowedStatuses = [
            'accepted',
            'rejected',
            'completed'
        ];

        if (
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid request status'
            });
        }

        // ==========================
        // FIND REQUEST
        // ==========================

        const request =
            await Request.findById(
                req.params.id
            );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    'Request not found'
            });
        }

        // ==========================
        // FARMER OWNERSHIP
        // ==========================

        if (
            request.farmer.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You are not authorized to update this request'
            });
        }

        // ==========================
        // VERIFY CURRENT FARMER
        // ==========================

        const farmer =
            await User.findById(
                req.user.id
            );

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message:
                    'Farmer account not found'
            });
        }

        if (farmer.role !== 'farmer') {
            return res.status(403).json({
                success: false,
                message:
                    'Only farmers can update requests'
            });
        }

        if (
            farmer.accountStatus !==
            'active'
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'Your account is not active'
            });
        }

        // ==========================
        // ACCEPT REQUEST
        // ==========================

        if (status === 'accepted') {

            if (
                request.status !== 'pending'
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'This request has already been processed'
                });
            }

            const product =
                await Product.findById(
                    request.product
                );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message:
                        'Product not found'
                });
            }

            // Verify request belongs
            // to the same farmer
            if (
                product.farmer.toString() !==
                req.user.id
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        'You are not authorized to accept this request'
                });
            }

            // Product must still be available
            if (
                product.status !== 'available'
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'This product is no longer available'
                });
            }

            // Check available quantity
            if (
                Number(request.quantity) >
                Number(product.quantity)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Only ${product.quantity} ${product.unit} available`
                });
            }

            // ==========================
            // SERVER-CALCULATED PRICE
            // ==========================

            const unitPrice =
                Number(product.price);

            const totalAmount =
                Number(request.quantity) *
                unitPrice;

            // ==========================
            // CREATE ORDER
            // ==========================

            const order =
                await Order.create({
                    buyer:
                        request.buyer,
                    farmer:
                        request.farmer,
                    product:
                        request.product,
                    quantity:
                        Number(request.quantity),
                    unitPrice,
                    totalAmount,
                    status: 'pending',
                    paymentStatus: 'unpaid'
                });

            /*
             * Product quantity is NOT reduced here.
             *
             * The buyer has not paid yet.
             * Quantity is reduced only after
             * successful payment verification.
             */

            // ==========================
            // UPDATE REQUEST
            // ==========================

            request.status =
                'accepted';

            const updatedRequest =
                await request.save();

            // ==========================
            // NOTIFY BUYER
            // ==========================

            await createNotification({
                recipient:
                    request.buyer,
                type: 'request',
                title:
                    'Request Accepted',
                message:
                    'Your produce request has been accepted by the farmer.',
                relatedId:
                    request._id
            });

            // ==========================
            // POPULATE REQUEST
            // ==========================

            await updatedRequest.populate([
                {
                    path: 'buyer',
                    select:
                        'name location'
                },
                {
                    path: 'farmer',
                    select:
                        'name location'
                },
                {
                    path: 'product',
                    select:
                        'name category price quantity unit image'
                }
            ]);

            // ==========================
            // POPULATE ORDER
            // ==========================

            await order.populate([
                {
                    path: 'buyer',
                    select:
                        'name location'
                },
                {
                    path: 'farmer',
                    select:
                        'name location'
                },
                {
                    path: 'product',
                    select:
                        'name category price quantity unit image'
                }
            ]);

            return res.status(200).json({
                success: true,
                message:
                    'Request accepted and order created successfully',
                data: {
                    request:
                        updatedRequest,
                    order
                }
            });
        }


        // ==========================
        // REJECT REQUEST
        // ==========================

        if (status === 'rejected') {

            if (
                request.status !== 'pending'
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'This request has already been processed'
                });
            }

            request.status =
                'rejected';

            const updatedRequest =
                await request.save();

            // ==========================
            // NOTIFY BUYER
            // ==========================

            await createNotification({
                recipient:
                    request.buyer,
                type: 'request',
                title:
                    'Request Rejected',
                message:
                    'Your produce request has been rejected by the farmer.',
                relatedId:
                    request._id
            });

            await updatedRequest.populate([
                {
                    path: 'buyer',
                    select:
                        'name location'
                },
                {
                    path: 'farmer',
                    select:
                        'name location'
                },
                {
                    path: 'product',
                    select:
                        'name category price quantity unit image'
                }
            ]);

            return res.status(200).json({
                success: true,
                message:
                    'Request rejected successfully',
                data: updatedRequest
            });
        }


        // ==========================
        // COMPLETE REQUEST
        // ==========================

        if (status === 'completed') {

            /*
             * Request completion must not be
             * used as a replacement for the
             * real order/delivery completion flow.
             */

            return res.status(400).json({
                success: false,
                message:
                    'Request completion is handled through the order delivery process'
            });
        }

    } catch (error) {
        console.error(
            'Update request status error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while updating request'
        });
    }
};


// ==========================
// EXPORT
// ==========================

module.exports = {
    createRequest,
    getRequests,
    getRequestById,
    updateRequestStatus
};