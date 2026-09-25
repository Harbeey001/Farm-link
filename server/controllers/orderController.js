const mongoose = require('mongoose');

const Order = require('../models/Order');

const {
    createNotification
} = require('../utils/notificationHelper');


// ==========================
// POPULATE ORDER
// ==========================

const populateOrder = (query) => {
    return query
        .populate(
            'buyer',
            'name email phone location'
        )
        .populate(
            'farmer',
            'name email phone location'
        )
        .populate(
            'product',
            'name category price quantity unit image location'
        );
};


// ==========================
// GET MY ORDERS - BUYER
// ==========================

const getMyOrders = async (req, res) => {
    try {
        if (req.user.role !== 'buyer') {
            return res.status(403).json({
                success: false,
                message: 'Buyer access required'
            });
        }

        const orders = await populateOrder(
            Order.find({
                buyer: req.user.id
            }).sort({
                createdAt: -1
            })
        );

        return res.status(200).json({
            success: true,
            message:
                'Buyer orders fetched successfully',
            data: orders
        });

    } catch (error) {
        console.error(
            'Get buyer orders error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while fetching buyer orders'
        });
    }
};


// ==========================
// GET FARMER ORDERS
// ==========================

const getFarmerOrders = async (req, res) => {
    try {
        if (req.user.role !== 'farmer') {
            return res.status(403).json({
                success: false,
                message: 'Farmer access required'
            });
        }

        const orders = await populateOrder(
            Order.find({
                farmer: req.user.id
            }).sort({
                createdAt: -1
            })
        );

        return res.status(200).json({
            success: true,
            message:
                'Farmer orders fetched successfully',
            data: orders
        });

    } catch (error) {
        console.error(
            'Get farmer orders error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while fetching farmer orders'
        });
    }
};


// ==========================
// GET ONE ORDER
// ==========================

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        const order = await populateOrder(
            Order.findById(id)
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const userId =
            req.user.id.toString();

        const userRole =
            req.user.role;

        const buyerId =
            order.buyer?._id?.toString();

        const farmerId =
            order.farmer?._id?.toString();

        const isBuyer =
            userRole === 'buyer' &&
            buyerId === userId;

        const isFarmer =
            userRole === 'farmer' &&
            farmerId === userId;

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
                    'You are not authorized to view this order'
            });
        }

        return res.status(200).json({
            success: true,
            message:
                'Order fetched successfully',
            data: order
        });

    } catch (error) {
        console.error(
            'Get order error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while fetching order'
        });
    }
};


// ==========================
// UPDATE ORDER STATUS
// ==========================

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // ==========================
        // ROLE CHECK
        // ==========================

        if (req.user.role !== 'farmer') {
            return res.status(403).json({
                success: false,
                message:
                    'Only the farmer can update order status'
            });
        }

        // ==========================
        // VALIDATE ORDER ID
        // ==========================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        // ==========================
        // VALIDATE STATUS
        // ==========================

        const allowedStatuses = [
            'pending',
            'confirmed',
            'processing',
            'completed',
            'cancelled'
        ];

        if (
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid order status'
            });
        }

        // ==========================
        // FIND ORDER
        // ==========================

        const order =
            await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // ==========================
        // FARMER OWNERSHIP
        // ==========================

        if (
            order.farmer.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You are not authorized to update this order'
            });
        }

        // ==========================
        // FINAL STATES
        // ==========================

        if (
            order.status === 'completed' ||
            order.status === 'cancelled'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `This order has already been ${order.status}`
            });
        }

        // ==========================
        // PENDING → CONFIRMED
        // ==========================

        if (order.status === 'pending') {

            if (status === 'confirmed') {

                if (
                    order.paymentStatus !== 'paid'
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'Order cannot be confirmed until payment is completed'
                    });
                }

                order.status = 'confirmed';

            } else if (status === 'cancelled') {

                if (
                    order.paymentStatus === 'paid'
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'A paid order cannot be cancelled from this endpoint'
                    });
                }

                order.status = 'cancelled';

            } else {

                return res.status(400).json({
                    success: false,
                    message:
                        'Pending order can only be confirmed or cancelled'
                });
            }
        }

        // ==========================
        // CONFIRMED → PROCESSING
        // ==========================

        else if (
            order.status === 'confirmed'
        ) {

            if (status !== 'processing') {
                return res.status(400).json({
                    success: false,
                    message:
                        'Confirmed order can only move to processing'
                });
            }

            if (
                order.paymentStatus !== 'paid'
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'A confirmed order must have successful payment'
                });
            }

            order.status = 'processing';

            order.deliveryStatus =
                'ready';
        }

        // ==========================
        // PROCESSING
        // ==========================

        else if (
            order.status === 'processing'
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'The buyer must confirm delivery before the order can be completed'
            });
        }

        // ==========================
        // SAVE
        // ==========================

        const updatedOrder =
            await order.save();

        // ==========================
        // NOTIFY BUYER
        // ==========================

        await createNotification({
            recipient: order.buyer,
            type: 'order',
            title:
                'Order Status Updated',
            message:
                `Your order has been ${order.status}.`,
            relatedId: order._id
        });

        // ==========================
        // POPULATE
        // ==========================

        await updatedOrder.populate([
            {
                path: 'buyer',
                select:
                    'name email phone location'
            },
            {
                path: 'farmer',
                select:
                    'name email phone location'
            },
            {
                path: 'product',
                select:
                    'name category price quantity unit image location'
            }
        ]);

        return res.status(200).json({
            success: true,
            message:
                'Order status updated successfully',
            data: updatedOrder
        });

    } catch (error) {
        console.error(
            'Update order status error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while updating order status'
        });
    }
};


// ==========================
// CONFIRM DELIVERY
// ==========================

const confirmDelivery = async (req, res) => {
    try {
        const { id } = req.params;

        // ==========================
        // ROLE CHECK
        // ==========================

        if (req.user.role !== 'buyer') {
            return res.status(403).json({
                success: false,
                message:
                    'Only the buyer can confirm delivery'
            });
        }

        // ==========================
        // VALIDATE ORDER ID
        // ==========================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid order ID'
            });
        }

        // ==========================
        // FIND ORDER
        // ==========================

        const order =
            await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    'Order not found'
            });
        }

        // ==========================
        // BUYER OWNERSHIP
        // ==========================

        if (
            order.buyer.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You are not authorized to confirm this order'
            });
        }

        // ==========================
        // ORDER STATUS
        // ==========================

        if (
            order.status !== 'processing'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Delivery can only be confirmed for an order being processed'
            });
        }

        // ==========================
        // PAYMENT CHECK
        // ==========================

        if (
            order.paymentStatus !== 'paid'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Delivery cannot be confirmed before payment is completed'
            });
        }

        // ==========================
        // DELIVERY CHECK
        // ==========================

        if (
            order.deliveryStatus ===
            'confirmed'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Delivery has already been confirmed'
            });
        }

        // ==========================
        // CONFIRM DELIVERY
        // ==========================

        order.status = 'completed';

        order.deliveryStatus =
            'confirmed';

        order.deliveredAt =
            order.deliveredAt ||
            new Date();

        order.deliveryConfirmedAt =
            new Date();

        const updatedOrder =
            await order.save();

        // ==========================
        // NOTIFY FARMER
        // ==========================

        await createNotification({
            recipient: order.farmer,
            type: 'delivery',
            title:
                'Delivery Confirmed',
            message:
                'The buyer has confirmed delivery. Your order has been completed successfully.',
            relatedId: order._id
        });

        // ==========================
        // POPULATE
        // ==========================

        await updatedOrder.populate([
            {
                path: 'buyer',
                select:
                    'name email phone location'
            },
            {
                path: 'farmer',
                select:
                    'name email phone location'
            },
            {
                path: 'product',
                select:
                    'name category price quantity unit image location'
            }
        ]);

        return res.status(200).json({
            success: true,
            message:
                'Delivery confirmed successfully',
            data: updatedOrder
        });

    } catch (error) {
        console.error(
            'Confirm delivery error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while confirming delivery'
        });
    }
};


// ==========================
// GET ALL ORDERS - ADMIN
// ==========================

const getAllOrdersForAdmin = async (req, res) => {
    try {
        const orders = await populateOrder(
            Order.find().sort({
                createdAt: -1
            })
        );

        return res.status(200).json({
            success: true,
            message:
                'All orders fetched successfully',
            data: orders
        });

    } catch (error) {
        console.error(
            'Get all admin orders error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while fetching orders'
        });
    }
};


// ==========================
// EXPORT
// ==========================

module.exports = {
    getMyOrders,
    getFarmerOrders,
    getOrderById,
    updateOrderStatus,
    confirmDelivery,
    getAllOrdersForAdmin
};
