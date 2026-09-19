const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        category: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },

        quantity: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isFinite,
                message:
                    'Quantity must be a valid number'
            }
        },

        unit: {
            type: String,
            required: true,
            trim: true,
            maxlength: 30
        },

        price: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isFinite,
                message:
                    'Price must be a valid number'
            }
        },

        location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        image: {
            type: String,
            default: '',
            trim: true
        },

        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        status: {
            type: String,
            enum: [
                'available',
                'sold',
                'inactive'
            ],
            default: 'available',
            index: true
        }
    },
    {
        timestamps: true
    }
);

const Product = mongoose.model(
    'Product',
    productSchema
);

module.exports = Product;