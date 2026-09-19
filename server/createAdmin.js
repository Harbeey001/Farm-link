const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const createAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@farmlink.com';
        const adminPassword = 'Admin@123456';

        const existingAdmin = await User.findOne({
            email: adminEmail
        });

        if (existingAdmin) {
            console.log('Admin account already exists.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(
            adminPassword,
            10
        );

        const admin = await User.create({
            name: 'FarmLink Administrator',
            email: adminEmail,
            password: hashedPassword,
            phone: '08000000000',
            role: 'admin',
            location: 'FarmLink'
        });

        console.log('================================');
        console.log('ADMIN ACCOUNT CREATED');
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('================================');

        process.exit(0);

    } catch (error) {
        console.error('Create admin error:', error);
        process.exit(1);
    }
};

createAdmin();