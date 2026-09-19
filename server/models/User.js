const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\S+@\S+\.\S+$/,
                'Please enter a valid email address'
            ]
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        role: {
            type: String,
            enum: ['farmer', 'buyer', 'admin'],
            default: 'buyer'
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        profileImage: {
            type: String,
            default: ''
        },

        accountStatus: {
            type: String,
            enum: ['active', 'suspended', 'blocked'],
            default: 'active'
        },

        verificationStatus: {
            type: String,
            enum: ['unverified', 'verified'],
            default: 'unverified'
        },

        termsAccepted: {
            type: Boolean,
            default: false
        },

        termsAcceptedAt: {
            type: Date,
            default: null
        },

        bankName: {
            type: String,
            default: '',
            trim: true
        },

        bankCode: {
            type: String,
            default: '',
            trim: true,
            select: false
        },

        accountNumber: {
            type: String,
            default: '',
            trim: true,
            select: false
        },

        accountName: {
            type: String,
            default: '',
            trim: true,
            select: false
        },

        paystackRecipientCode: {
            type: String,
            default: '',
            trim: true,
            select: false
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;