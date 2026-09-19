const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
    {
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true
        },

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

        message: {
            type: String,
            trim: true,
            default: '',
            maxlength: [
                1000,
                'Message cannot exceed 1000 characters'
            ]
        },

        status: {
            type: String,
            enum: [
                'pending',
                'accepted',
                'rejected',
                'completed'
            ],
            default: 'pending',
            index: true
        }
    },
    {
        timestamps: true
    }
);

const Request = mongoose.model(
    'Request',
    requestSchema
);

module.exports = Request;