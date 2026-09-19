const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');


// ==========================
// REGISTER USER
// ==========================

const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            role,
            location,
            termsAccepted
        } = req.body;

        // ==========================
        // REQUIRED FIELDS
        // ==========================

        if (
            !name ||
            !email ||
            !password ||
            !phone ||
            !location
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        if (termsAccepted !== true) {
            return res.status(400).json({
                success: false,
                message: 'You must agree to the FarmLink Terms & Conditions to create an account'
            });
        }

        // ==========================
        // CLEAN INPUT
        // ==========================

        const normalizedName = String(name).trim();
        const normalizedEmail = String(email)
            .trim()
            .toLowerCase();
        const normalizedPhone = String(phone).trim();
        const normalizedLocation = String(location).trim();

        if (
            !normalizedName ||
            !normalizedEmail ||
            !normalizedPhone ||
            !normalizedLocation
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid registration details'
            });
        }

        // ==========================
        // BASIC EMAIL VALIDATION
        // ==========================

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // ==========================
        // PASSWORD VALIDATION
        // ==========================

        if (typeof password !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Password must be valid'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // ==========================
        // PUBLIC ROLES
        // ==========================

        // Admin accounts must NEVER be
        // created through public registration.

        const allowedRoles = [
            'buyer',
            'farmer'
        ];

        const selectedRole = role || 'buyer';

        if (!allowedRoles.includes(selectedRole)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid registration role'
            });
        }

        // ==========================
        // CHECK EXISTING EMAIL
        // ==========================

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'A user with this email already exists'
            });
        }

        // ==========================
        // HASH PASSWORD
        // ==========================

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(
            password,
            salt
        );

        // ==========================
        // CREATE USER
        // ==========================

        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            password: hashedPassword,
            phone: normalizedPhone,
            role: selectedRole,
            location: normalizedLocation,
            accountStatus: 'active',
            termsAccepted: true,
        });

        // ==========================
        // RESPONSE
        // ==========================

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                location: user.location,
                accountStatus: user.accountStatus
            }
        });

    } catch (error) {
        console.error(
            'Registration error:',
            error
        );

        // Handle MongoDB duplicate-key errors
        // safely without exposing database details.

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'A user with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};


// ==========================
// GENERATE JWT
// ==========================

const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error(
            'JWT_SECRET is not configured'
        );
    }

    return jwt.sign(
        {
            id: user._id.toString(),
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '7d'
        }
    );
};


// ==========================
// LOGIN USER
// ==========================

const loginUser = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        // ==========================
        // REQUIRED FIELDS
        // ==========================

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // ==========================
        // NORMALIZE EMAIL
        // ==========================

        const normalizedEmail = String(email)
            .trim()
            .toLowerCase();

        // ==========================
        // FIND USER
        // ==========================

        const user = await User.findOne({
            email: normalizedEmail
        }).select('+password');

        // ==========================
        // INVALID LOGIN
        // ==========================

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // ==========================
        // ACCOUNT STATUS
        // ==========================

        if (user.accountStatus === 'suspended') {
            return res.status(403).json({
                success: false,
                message:
                    'Your account has been suspended. Please contact FarmLink support.'
            });
        }

        if (user.accountStatus === 'blocked') {
            return res.status(403).json({
                success: false,
                message:
                    'Your account has been blocked. Please contact FarmLink support.'
            });
        }

        // ==========================
        // COMPARE PASSWORD
        // ==========================

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // ==========================
        // GENERATE TOKEN
        // ==========================

        const token = generateToken(user);

        // ==========================
        // RESPONSE
        // ==========================

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                location: user.location,
                accountStatus: user.accountStatus
            }
        });

    } catch (error) {
        console.error(
            'Login error:',
            error
        );

        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};


module.exports = {
    registerUser,
    loginUser
};