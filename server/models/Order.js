const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        // ==========================
        // BUYER
        // ==========================
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        // ==========================
        // FARMER
        // ==========================
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        // ==========================
        // PRODUCT
        // ==========================
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true
        },

        // ==========================
        // QUANTITY
        // ==========================
        quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isFinite,
                message:
                    'Quantity must be a valid number'
            }
        },

        // ==========================
        // PRICE AT TIME OF ORDER
        // ==========================
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isFinite,
                message:
                    'Unit price must be a valid number'
            }
        },

        // ==========================
        // TOTAL ORDER AMOUNT
        // ==========================
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isFinite,
                message:
                    'Total amount must be a valid number'
            }
        },

        // ==========================
        // ORDER STATUS
        // ==========================
        status: {
            type: String,
            enum: [
                'pending',
                'confirmed',
                'processing',
                'completed',
                'cancelled'
            ],
            default: 'pending',
            index: true
        },

        // ==========================
        // PAYMENT STATUS
        // ==========================
        paymentStatus: {
            type: String,
            enum: [
                'unpaid',
                'pending',
                'paid',
                'failed',
                'refunded'
            ],
            default: 'unpaid',
            index: true
        },

        // ==========================
        // PAYMENT REFERENCE
        // ==========================
        paymentReference: {
            type: String,
            default: '',
            trim: true,
            maxlength: 200
        },

        // ==========================
        // DELIVERY
        // ==========================
        deliveryStatus: {
            type: String,
            enum: [
                'not_started',
                'ready',
                'delivered',
                'confirmed'
            ],
            default: 'not_started',
            index: true
        },

        // ==========================
        // DELIVERY CONFIRMATION
        // ==========================
        deliveredAt: {
            type: Date,
            default: null
        },

        deliveryConfirmedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Order = mongoose.model(
    'Order',
    orderSchema
);

module.exports = Order;