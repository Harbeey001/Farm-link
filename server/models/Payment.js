const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        // ==========================
        // ORDER
        // ==========================
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            unique: true,
            index: true
        },

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
        // AMOUNT PAID BY BUYER
        // ==========================
        amount: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isFinite,
                message:
                    'Amount must be a valid number'
            }
        },

        // ==========================
        // FARM LINK COMMISSION
        // ==========================
        platformFee: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
            validate: {
                validator: Number.isFinite,
                message:
                    'Platform fee must be a valid number'
            }
        },

        // ==========================
        // AMOUNT FOR FARMER
        // ==========================
        farmerAmount: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isFinite,
                message:
                    'Farmer amount must be a valid number'
            }
        },

        // ==========================
        // PAYMENT PROVIDER
        // ==========================
        provider: {
            type: String,
            default: 'paystack',
            trim: true,
            lowercase: true
        },

        // ==========================
        // PAYMENT REFERENCE
        // ==========================
        reference: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
            maxlength: 200
        },

        // ==========================
        // PAYMENT STATUS
        // ==========================
        status: {
            type: String,
            enum: [
                'pending',
                'paid',
                'failed',
                'refunded'
            ],
            default: 'pending',
            index: true
        },

        // ==========================
        // PAYMENT DATE
        // ==========================
        paidAt: {
            type: Date,
            default: null
        },

        // ==========================
        // PAYOUT STATUS
        // ==========================
        payoutStatus: {
            type: String,
            enum: [
                'pending',
                'processing',
                'paid',
                'failed'
            ],
            default: 'pending',
            index: true
        },

        // ==========================
        // PAYOUT REFERENCE
        // ==========================
        payoutReference: {
            type: String,
            default: '',
            trim: true,
            maxlength: 200
        },

        // ==========================
        // PAYOUT DATE
        // ==========================
        payoutAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Payment = mongoose.model(
    'Payment',
    paymentSchema
);

module.exports = Payment;