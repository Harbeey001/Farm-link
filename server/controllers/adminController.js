const User = require('../models/User');
const Product = require('../models/Product');
const Request = require('../models/Request');
const Payment = require('../models/Payment');


// ==========================
// ADMIN STATISTICS
// ==========================

const getAdminStats = async (req, res) => {
    try {
        // --------------------------------
        // BASIC PLATFORM STATISTICS
        // --------------------------------

        const [
            totalUsers,
            totalFarmers,
            totalBuyers,
            totalAdmins,
            totalProducts,
            totalRequests,
            pendingRequests,
            acceptedRequests,
            rejectedRequests,
            completedRequests
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'farmer' }),
            User.countDocuments({ role: 'buyer' }),
            User.countDocuments({ role: 'admin' }),

            Product.countDocuments(),

            Request.countDocuments(),
            Request.countDocuments({ status: 'pending' }),
            Request.countDocuments({ status: 'accepted' }),
            Request.countDocuments({ status: 'rejected' }),
            Request.countDocuments({ status: 'completed' })
        ]);


        // --------------------------------
        // SALES PERIOD
        // --------------------------------

        const requestedPeriod = req.query.period || 'weekly';

        const allowedPeriods = [
            'weekly',
            'monthly',
            'annually'
        ];

        const period = allowedPeriods.includes(requestedPeriod)
            ? requestedPeriod
            : 'weekly';


        // --------------------------------
        // DATE HELPERS
        // --------------------------------

        const now = new Date();

        let startDate;
        let endDate;
        let trendFormat;
        let trendLabels = [];


        // --------------------------------
        // WEEKLY
        // --------------------------------

        if (period === 'weekly') {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);

            // Start from Sunday
            startDate.setDate(
                startDate.getDate() - startDate.getDay()
            );

            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);

            trendFormat = '%Y-%m-%d';

            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);

                date.setDate(
                    date.getDate() + i
                );

                trendLabels.push(
                    date.toISOString().split('T')[0]
                );
            }
        }


        // --------------------------------
        // MONTHLY
        // --------------------------------

        if (period === 'monthly') {
            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );

            endDate = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                1
            );

            trendFormat = '%Y-%m-%d';

            const daysInMonth = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0
            ).getDate();

            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    i
                );

                trendLabels.push(
                    date.toISOString().split('T')[0]
                );
            }
        }


        // --------------------------------
        // ANNUALLY
        // --------------------------------

        if (period === 'annually') {
            startDate = new Date(
                now.getFullYear(),
                0,
                1
            );

            endDate = new Date(
                now.getFullYear() + 1,
                0,
                1
            );

            trendFormat = '%Y-%m';

            for (let i = 0; i < 12; i++) {
                const date = new Date(
                    now.getFullYear(),
                    i,
                    1
                );

                const year = date.getFullYear();

                const month = String(
                    date.getMonth() + 1
                ).padStart(2, '0');

                trendLabels.push(
                    `${year}-${month}`
                );
            }
        }


        // --------------------------------
        // SALES SUMMARY
        // --------------------------------

        const salesResult = await Payment.aggregate([
            {
                $match: {
                    status: 'paid',
                    paidAt: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $group: {
                    _id: null,

                    totalSales: {
                        $sum: '$amount'
                    },

                    platformFee: {
                        $sum: '$platformFee'
                    },

                    farmerAmount: {
                        $sum: '$farmerAmount'
                    },

                    paidOrders: {
                        $sum: 1
                    }
                }
            }
        ]);


        const salesSummary = salesResult[0] || {
            totalSales: 0,
            platformFee: 0,
            farmerAmount: 0,
            paidOrders: 0
        };


        // --------------------------------
        // SALES TREND
        // --------------------------------

        const salesTrendResult = await Payment.aggregate([
            {
                $match: {
                    status: 'paid',
                    paidAt: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: trendFormat,
                            date: '$paidAt'
                        }
                    },

                    sales: {
                        $sum: '$amount'
                    },

                    platformFee: {
                        $sum: '$platformFee'
                    },

                    farmerAmount: {
                        $sum: '$farmerAmount'
                    },

                    orders: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]);


        // --------------------------------
        // CREATE COMPLETE TREND
        // --------------------------------

        const salesMap = {};

        salesTrendResult.forEach((item) => {
            salesMap[item._id] = {
                sales: item.sales || 0,
                platformFee: item.platformFee || 0,
                farmerAmount: item.farmerAmount || 0,
                orders: item.orders || 0
            };
        });


        const salesTrend = trendLabels.map((label) => ({
            period: label,

            sales:
                salesMap[label]?.sales || 0,

            platformFee:
                salesMap[label]?.platformFee || 0,

            farmerAmount:
                salesMap[label]?.farmerAmount || 0,

            orders:
                salesMap[label]?.orders || 0
        }));


        // --------------------------------
        // ALL-TIME SALES
        // --------------------------------

        const allTimeSalesResult = await Payment.aggregate([
            {
                $match: {
                    status: 'paid'
                }
            },
            {
                $group: {
                    _id: null,

                    totalSales: {
                        $sum: '$amount'
                    },

                    platformFee: {
                        $sum: '$platformFee'
                    },

                    farmerAmount: {
                        $sum: '$farmerAmount'
                    },

                    paidOrders: {
                        $sum: 1
                    }
                }
            }
        ]);


        const allTimeSales =
            allTimeSalesResult[0] || {
                totalSales: 0,
                platformFee: 0,
                farmerAmount: 0,
                paidOrders: 0
            };


        // --------------------------------
        // RESPONSE
        // --------------------------------

        res.status(200).json({
            success: true,
            message: 'Admin statistics fetched successfully',

            data: {
                users: totalUsers,
                farmers: totalFarmers,
                buyers: totalBuyers,
                admins: totalAdmins,

                products: totalProducts,

                requests: totalRequests,
                pendingRequests,
                acceptedRequests,
                rejectedRequests,
                completedRequests,

                salesReport: {
                    period,

                    totalSales:
                        salesSummary.totalSales || 0,

                    platformFee:
                        salesSummary.platformFee || 0,

                    farmerAmount:
                        salesSummary.farmerAmount || 0,

                    paidOrders:
                        salesSummary.paidOrders || 0,

                    startDate,
                    endDate,

                    trend: salesTrend
                },

                allTimeSales: {
                    totalSales:
                        allTimeSales.totalSales || 0,

                    platformFee:
                        allTimeSales.platformFee || 0,

                    farmerAmount:
                        allTimeSales.farmerAmount || 0,

                    paidOrders:
                        allTimeSales.paidOrders || 0
                }
            }
        });

    } catch (error) {
        console.error(
            'Get admin stats error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Server error while fetching admin statistics'
        });
    }
};


// ==========================
// GET ALL USERS
// ==========================

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Users fetched successfully',
            data: users
        });

    } catch (error) {
        console.error(
            'Get all users error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Server error while fetching users'
        });
    }
};


// ==========================
// ADMIN ACCESS
// GET USER BY ID
// ==========================

const getAdminUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const user = await User.findById(id)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User fetched successfully',
            data: user
        });

    } catch (error) {
        console.error(
            'Get admin user error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Server error while fetching user'
        });
    }
};


// ==========================
// ADMIN ACCESS
// UPDATE USER ACCOUNT STATUS
// ==========================

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { accountStatus } = req.body;

        // --------------------------------
        // VALIDATE STATUS
        // --------------------------------

        const allowedStatuses = [
            'active',
            'suspended',
            'blocked'
        ];

        if (!allowedStatuses.includes(accountStatus)) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid account status'
            });
        }


        // --------------------------------
        // VALIDATE USER ID
        // --------------------------------

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    'User ID is required'
            });
        }


        // --------------------------------
        // FIND USER
        // --------------------------------

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    'User not found'
            });
        }


        // --------------------------------
        // PREVENT SELF-SUSPENSION/BLOCKING
        // --------------------------------

        if (
            req.user &&
            req.user.id === user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You cannot change your own account status'
            });
        }


        // --------------------------------
        // PROTECT ADMIN ACCOUNTS
        // --------------------------------

        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message:
                    'Admin account status cannot be changed here'
            });
        }


        // --------------------------------
        // UPDATE STATUS
        // --------------------------------

        user.accountStatus = accountStatus;

        await user.save();


        // --------------------------------
        // RETURN SAFE USER DATA
        // --------------------------------

        const safeUser = await User.findById(user._id)
            .select('-password');

        res.status(200).json({
            success: true,
            message:
                `User account ${accountStatus} successfully`,
            data: safeUser
        });

    } catch (error) {
        console.error(
            'Update user status error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Server error while updating user status'
        });
    }
};
const updateUserVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationStatus } = req.body;

        const allowedStatuses = [
            'unverified',
            'verified'
        ];

        if (!allowedStatuses.includes(verificationStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification status'
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (req.user && req.user.id === user._id.toString()) {
            return res.status(403).json({
                success: false,
                message:
                    'You cannot change your own verification status'
            });
        }

        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message:
                    'Admin verification status cannot be changed here'
            });
        }

        user.verificationStatus = verificationStatus;

        await user.save();

        const safeUser = await User.findById(user._id)
            .select('-password');

        res.status(200).json({
            success: true,
            message:
                `User verification ${verificationStatus} successfully`,
            data: safeUser
        });

    } catch (error) {
        console.error(
            'Update user verification error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Server error while updating user verification'
        });
    }
};


// ==========================
// GET ALL PRODUCTS
// ==========================

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate(
                'farmer',
                'name email phone location verificationStatus'
            )
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message:
                'Products fetched successfully',
            data: products
        });

    } catch (error) {
        console.error(
            'Get all products error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Server error while fetching products'
        });
    }
};


// ==========================
// GET ALL REQUESTS
// ==========================

const getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find()
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
                'name category price quantity unit'
            )
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message:
                'Requests fetched successfully',
            data: requests
        });

    } catch (error) {
        console.error(
            'Get all requests error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'Server error while fetching requests'
        });
    }
};


// ==========================
// EXPORTS
// ==========================

module.exports = {
    getAdminStats,
    getAllUsers,
    getAdminUserById,
    updateUserStatus,
    getAllProducts,
    getAllRequests,
    updateUserVerification
};
