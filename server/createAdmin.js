require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const createAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error(
                'ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment variables.'
            );
            process.exit(1);
        }

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