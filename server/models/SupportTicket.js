const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },

        category: {
            type: String,
            enum: [
                'account',
                'payment',
                'order',
                'product',
                'technical',
                'other'
            ],
            default: 'other'
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },

        adminResponse: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ''
        },

        status: {
            type: String,
            enum: [
                'open',
                'in-progress',
                'resolved',
                'closed'
            ],
            default: 'open'
        },

        respondedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const SupportTicket = mongoose.model(
    'SupportTicket',
    supportTicketSchema
);

module.exports = SupportTicket;