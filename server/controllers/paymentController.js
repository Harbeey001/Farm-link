const axios = require('axios');
const mongoose = require('mongoose');

const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Product = require('../models/Product');

const {
    createNotification
} = require('../utils/notificationHelper');

// ==========================
// FARM LINK COMMISSION
// ==========================

const PLATFORM_FEE_PERCENT = 2.5;


// ==========================
// INITIALIZE PAYMENT
// ==========================

const initializePayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        // ==========================
        // VALIDATE ORDER ID
        // ==========================

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(
                orderId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        // ==========================
        // FIND ORDER
        // ==========================

        const order =
            await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // ==========================
        // ONLY BUYER CAN PAY
        // ==========================

        if (
            order.buyer.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You are not authorized to pay for this order'
            });
        }

        // ==========================
        // CHECK ORDER STATUS
        // ==========================

        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message:
                    'Only pending orders can be paid for'
            });
        }

        // ==========================
        // CHECK PAYMENT STATUS
        // ==========================

        if (
            order.paymentStatus === 'paid'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'This order has already been paid for'
            });
        }

        // ==========================
        // FIND BUYER
        // ==========================

        const buyer =
            await User.findById(order.buyer);

        if (!buyer) {
            return res.status(404).json({
                success: false,
                message: 'Buyer not found'
            });
        }

        if (buyer.role !== 'buyer') {
            return res.status(403).json({
                success: false,
                message:
                    'Only buyers can make payments'
            });
        }

        if (
            buyer.accountStatus !== 'active'
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'Your account is not active'
            });
        }

        // ==========================
        // CHECK BUYER EMAIL
        // ==========================

        if (
            typeof buyer.email !== 'string' ||
            !buyer.email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Buyer email address is missing'
            });
        }

        // ==========================
        // GET REAL ORDER AMOUNT
        // ==========================

        const amount =
            Number(order.totalAmount);

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid order amount'
            });
        }

        // ==========================
        // CALCULATE FARM LINK FEE
        // ==========================

        const platformFee =
            (amount *
                PLATFORM_FEE_PERCENT) /
            100;

        const farmerAmount =
            amount - platformFee;

        if (
            !Number.isFinite(platformFee) ||
            !Number.isFinite(farmerAmount) ||
            farmerAmount < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Unable to calculate payment amount'
            });
        }

        // ==========================
        // CHECK PAYSTACK KEY
        // ==========================

        if (
            !process.env.PAYSTACK_SECRET_KEY
        ) {
            console.error(
                'PAYSTACK_SECRET_KEY is not configured'
            );

            return res.status(500).json({
                success: false,
                message:
                    'Payment service is not configured'
            });
        }

        // ==========================
        // FIND EXISTING PAYMENT
        // ==========================

        let payment =
            await Payment.findOne({
                order: order._id
            });

        // ==========================
        // CREATE UNIQUE REFERENCE
        // ==========================

        const reference =
            `FARMLINK-${Date.now()}-${Math.floor(
                Math.random() * 100000
            )}`;

        // ==========================
        // INITIALIZE PAYSTACK
        // ==========================

        const paystackResponse =
            await axios.post(
                'https://api.paystack.co/transaction/initialize',
                {
                    email:
                        buyer.email.trim(),

                    amount:
                        Math.round(
                            amount * 100
                        ),

                    reference,

                    callback_url:
                        process.env
                            .PAYSTACK_CALLBACK_URL ||
                        'http://localhost:5173/payment/callback',

                    metadata: {
                        orderId:
                            order._id.toString(),

                        buyerId:
                            order.buyer.toString(),

                        farmerId:
                            order.farmer.toString()
                    }
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

                        'Content-Type':
                            'application/json'
                    }
                }
            );

        const paystackData =
            paystackResponse.data?.data;

        if (
            !paystackResponse.data?.status ||
            !paystackData?.authorization_url
        ) {
            console.error(
                'Invalid Paystack initialization response:',
                paystackResponse.data
            );

            return res.status(400).json({
                success: false,
                message:
                    'Unable to initialize payment'
            });
        }

        // ==========================
        // CREATE / UPDATE PAYMENT
        // ==========================

        if (payment) {
            payment.buyer =
                order.buyer;

            payment.farmer =
                order.farmer;

            payment.amount =
                amount;

            payment.platformFee =
                platformFee;

            payment.farmerAmount =
                farmerAmount;

            payment.provider =
                'paystack';

            payment.reference =
                reference;

            payment.status =
                'pending';

            payment.paidAt =
                null;

            await payment.save();

        } else {
            payment =
                await Payment.create({
                    order: order._id,
                    buyer: order.buyer,
                    farmer: order.farmer,
                    amount,
                    platformFee,
                    farmerAmount,
                    provider: 'paystack',
                    reference,
                    status: 'pending',
                    paidAt: null
                });
        }

        // ==========================
        // UPDATE ORDER
        // ==========================

        order.paymentStatus =
            'pending';

        order.paymentReference =
            reference;

        await order.save();

        return res.status(200).json({
            success: true,
            message:
                'Payment initialized successfully',

            data: {
                paymentId:
                    payment._id,

                reference,

                amount,

                platformFee,

                farmerAmount,

                authorizationUrl:
                    paystackData.authorization_url
            }
        });

    } catch (error) {
        console.error(
            'Initialize payment error:',
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while initializing payment'
        });
    }
};


// ==========================
// VERIFY PAYMENT
// ==========================

const verifyPayment = async (req, res) => {
    let session = null;

    try {
        const { reference } =
            req.params;

        // ==========================
        // VALIDATE REFERENCE
        // ==========================

        if (
            typeof reference !== 'string' ||
            !reference.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Payment reference is required'
            });
        }

        const cleanReference =
            reference.trim();

        // ==========================
        // CHECK PAYSTACK KEY
        // ==========================

        if (
            !process.env.PAYSTACK_SECRET_KEY
        ) {
            console.error(
                'PAYSTACK_SECRET_KEY is not configured'
            );

            return res.status(500).json({
                success: false,
                message:
                    'Payment service is not configured'
            });
        }

        // ==========================
        // FIND PAYMENT
        // ==========================

        const payment =
            await Payment.findOne({
                reference:
                    cleanReference
            });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message:
                    'Payment record not found'
            });
        }

        // ==========================
        // ONLY BUYER CAN VERIFY
        // ==========================

        if (
            payment.buyer.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You are not authorized to verify this payment'
            });
        }

        // ==========================
        // FIND ORDER
        // ==========================

        const order =
            await Order.findById(
                payment.order
            );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // ==========================
        // VERIFY PAYMENT OWNERSHIP
        // ==========================

        if (
            order.buyer.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You are not authorized to verify this order'
            });
        }

        // ==========================
        // VERIFY REFERENCE
        // ==========================

        if (
            payment.reference !==
            cleanReference
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Payment reference mismatch'
            });
        }

        if (
            order.paymentReference &&
            order.paymentReference !==
            cleanReference
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Payment reference does not match this order'
            });
        }

        // ==========================
        // PREVENT DUPLICATE PROCESSING
        // ==========================

        if (
            payment.status === 'paid' &&
            order.paymentStatus === 'paid'
        ) {
            await order.populate([
                {
                    path: 'buyer',
                    select:
                        'name location'
                },
                {
                    path: 'farmer',
                    select:
                        'name location'
                },
                {
                    path: 'product',
                    select:
                        'name category price quantity unit image location'
                }
            ]);

            return res.status(200).json({
                success: true,
                message:
                    'Payment already verified',

                data: {
                    payment,
                    order
                }
            });
        }

        // ==========================
        // CANCELLED ORDER
        // ==========================

        if (
            order.status === 'cancelled'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Payment cannot be verified because this order has been cancelled'
            });
        }

        // ==========================
        // ONLY PENDING ORDERS
        // ==========================

        if (
            order.status !== 'pending'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Payment cannot be verified for this order in its current state'
            });
        }

        // ==========================
        // VERIFY WITH PAYSTACK
        // ==========================

        const paystackResponse =
            await axios.get(
                `https://api.paystack.co/transaction/verify/${encodeURIComponent(
                    cleanReference
                )}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                    }
                }
            );

        const transaction =
            paystackResponse.data?.data;

        if (!transaction) {
            return res.status(400).json({
                success: false,
                message:
                    'Unable to verify payment'
            });
        }

        // ==========================
        // VERIFY PAYSTACK REFERENCE
        // ==========================

        if (
            transaction.reference &&
            transaction.reference !==
            cleanReference
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Paystack reference does not match payment record'
            });
        }

        // ==========================
        // VERIFY METADATA
        // ==========================

        const metadata =
            transaction.metadata || {};

        if (
            metadata.orderId &&
            metadata.orderId !==
            order._id.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Payment order information does not match'
            });
        }

        if (
            metadata.buyerId &&
            metadata.buyerId !==
            order.buyer.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Payment buyer information does not match'
            });
        }

        // ==========================
        // PAYMENT SUCCESSFUL
        // ==========================

        if (
            transaction.status ===
            'success' &&
            transaction.currency ===
            'NGN'
        ) {
            // ==========================
            // VERIFY AMOUNT
            // ==========================

            const expectedAmount =
                Math.round(
                    Number(payment.amount) *
                    100
                );

            if (
                Number(transaction.amount) !==
                expectedAmount
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Payment amount does not match order amount'
                });
            }

            // ==========================
            // START DATABASE TRANSACTION
            // ==========================

            session =
                await mongoose.startSession();

            session.startTransaction();

            // Re-read payment and order
            // inside transaction.
            const lockedPayment =
                await Payment.findById(
                    payment._id
                ).session(session);

            const lockedOrder =
                await Order.findById(
                    order._id
                ).session(session);

            if (
                !lockedPayment ||
                !lockedOrder
            ) {
                throw new Error(
                    'Payment or order record no longer exists'
                );
            }

            // ==========================
            // IDEMPOTENCY CHECK
            // ==========================

            if (
                lockedPayment.status ===
                'paid' &&
                lockedOrder.paymentStatus ===
                'paid'
            ) {
                await session.commitTransaction();

                await lockedOrder.populate([
                    {
                        path: 'buyer',
                        select:
                            'name location'
                    },
                    {
                        path: 'farmer',
                        select:
                            'name location'
                    },
                    {
                        path: 'product',
                        select:
                            'name category price quantity unit image location'
                    }
                ]);

                return res.status(200).json({
                    success: true,
                    message:
                        'Payment already verified',
                    data: {
                        payment:
                            lockedPayment,
                        order:
                            lockedOrder
                    }
                });
            }

            // ==========================
            // ATOMIC STOCK DEDUCTION
            // ==========================

            const quantity =
                Number(
                    lockedOrder.quantity
                );

            if (
                !Number.isFinite(quantity) ||
                quantity <= 0
            ) {
                throw new Error(
                    'Invalid order quantity'
                );
            }

            const product =
                await Product.findOneAndUpdate(
                    {
                        _id:
                            lockedOrder.product,
                        quantity: {
                            $gte: quantity
                        },
                        status: {
                            $in: [
                                'available',
                                'sold'
                            ]
                        }
                    },
                    {
                        $inc: {
                            quantity:
                                -quantity
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

            if (!product) {
                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message:
                        'Insufficient stock or product is no longer available'
                });
            }

            // ==========================
            // UPDATE PRODUCT STATUS
            // ==========================

            if (
                Number(product.quantity) ===
                0
            ) {
                product.status =
                    'sold';

                await product.save({
                    session
                });
            }

            // ==========================
            // UPDATE PAYMENT
            // ==========================

            lockedPayment.status =
                'paid';

            lockedPayment.paidAt =
                new Date();

            // ==========================
            // UPDATE ORDER
            // ==========================

            lockedOrder.paymentStatus =
                'paid';

            lockedOrder.paymentReference =
                cleanReference;

            lockedOrder.status =
                'confirmed';

            // ==========================
            // SAVE PAYMENT + ORDER
            // ==========================

            await lockedPayment.save({
                session
            });

            await lockedOrder.save({
                session
            });

            // ==========================
            // COMMIT
            // ==========================

            await session.commitTransaction();

            // ==========================
            // NOTIFY FARMER
            // ==========================

            await createNotification({
                recipient:
                    lockedOrder.farmer,
                type: 'payment',
                title:
                    'Payment Received',
                message:
                    'A buyer has successfully paid for an order. You can now proceed with the order.',
                relatedId:
                    lockedOrder._id
            });

            // ==========================
            // POPULATE ORDER
            // ==========================

            await lockedOrder.populate([
                {
                    path: 'buyer',
                    select:
                        'name location'
                },
                {
                    path: 'farmer',
                    select:
                        'name location'
                },
                {
                    path: 'product',
                    select:
                        'name category price quantity unit image location'
                }
            ]);

            return res.status(200).json({
                success: true,
                message:
                    'Payment verified successfully, stock updated, and order confirmed',

                data: {
                    payment:
                        lockedPayment,
                    order:
                        lockedOrder
                }
            });
        }

        // ==========================
        // PAYMENT FAILED
        // ==========================

        payment.status =
            'failed';

        await payment.save();

        return res.status(400).json({
            success: false,
            message:
                'Payment was not successful'
        });

    } catch (error) {
        // ==========================
        // ABORT TRANSACTION
        // ==========================

        if (session) {
            try {
                if (
                    session.inTransaction()
                ) {
                    await session.abortTransaction();
                }
            } catch (transactionError) {
                console.error(
                    'Transaction rollback error:',
                    transactionError.message
                );
            }
        }

        console.error(
            'Verify payment error:',
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while verifying payment'
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
};


// ==========================
// GET MY PAYMENTS
// ==========================

const getMyPayments = async (req, res) => {
    try {
        const payments =
            await Payment.find({
                buyer: req.user.id
            })
                .populate({
                    path: 'order',
                    select:
                        'product quantity unitPrice totalAmount status paymentStatus paymentReference createdAt',

                    populate: {
                        path: 'product',
                        select:
                            'name category image unit location'
                    }
                })
                .populate({
                    path: 'farmer',
                    select:
                        'name location'
                })
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            data: payments
        });

    } catch (error) {
        console.error(
            'Get my payments error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                'Server error while fetching payment history'
        });
    }
};
// ==========================
// PROCESS FARMER PAYOUT
// ==========================

const processFarmerPayout = async (
    orderId
) => {
    try {
        // ==========================
        // VALIDATE ORDER ID
        // ==========================

        if (
            !mongoose.Types.ObjectId.isValid(
                orderId
            )
        ) {
            throw new Error(
                'Invalid order ID'
            );
        }

        const order =
            await Order.findById(
                orderId
            );

        if (!order) {
            throw new Error(
                'Order not found'
            );
        }

        // ==========================
        // CHECK ORDER STATE
        // ==========================

        if (
            order.status !==
            'completed'
        ) {
            throw new Error(
                'Order must be completed before payout'
            );
        }

        if (
            order.deliveryStatus !==
            'confirmed'
        ) {
            throw new Error(
                'Delivery must be confirmed before payout'
            );
        }

        if (
            order.paymentStatus !==
            'paid'
        ) {
            throw new Error(
                'Payment must be completed before payout'
            );
        }

        // ==========================
        // FIND PAYMENT
        // ==========================

        const payment =
            await Payment.findOne({
                order: order._id
            });

        if (!payment) {
            throw new Error(
                'Payment record not found'
            );
        }

        if (
            payment.status !== 'paid'
        ) {
            throw new Error(
                'Payment must be marked as paid before payout'
            );
        }

        // ==========================
        // PREVENT DUPLICATE PAYOUT
        // ==========================

        if (
            payment.payoutStatus ===
            'paid'
        ) {
            return payment;
        }

        if (
            payment.payoutStatus ===
            'processing'
        ) {
            throw new Error(
                'A payout is already being processed for this order'
            );
        }

        // ==========================
        // FIND FARMER
        // ==========================

        const farmer =
            await User.findById(
                order.farmer
            ).select(
                '+paystackRecipientCode'
            );

        if (!farmer) {
            throw new Error(
                'Farmer not found'
            );
        }

        if (
            farmer.role !== 'farmer'
        ) {
            throw new Error(
                'Order farmer is invalid'
            );
        }

        if (
            !farmer.paystackRecipientCode
        ) {
            throw new Error(
                'Farmer payout recipient has not been configured'
            );
        }

        // ==========================
        // CHECK PAYSTACK KEY
        // ==========================

        if (
            !process.env.PAYSTACK_SECRET_KEY
        ) {
            throw new Error(
                'Paystack secret key is not configured'
            );
        }

        // ==========================
        // CREATE TRANSFER REFERENCE
        // ==========================

        const transferReference =
            `farmlink_payout_${Date.now()}_${Math.floor(
                Math.random() * 100000
            )}`;

        // ==========================
        // SAVE PROCESSING STATUS
        // ==========================

        payment.payoutStatus =
            'processing';

        payment.payoutReference =
            transferReference;

        payment.payoutAt =
            null;

        await payment.save();

        // ==========================
        // CREATE PAYSTACK TRANSFER
        // ==========================

        let transferResponse;

        try {
            transferResponse =
                await axios.post(
                    'https://api.paystack.co/transfer',
                    {
                        source: 'balance',

                        amount:
                            Math.round(
                                Number(
                                    payment.farmerAmount
                                ) * 100
                            ),

                        recipient:
                            farmer.paystackRecipientCode,

                        reason:
                            `FarmLink payout for order ${order._id}`,

                        reference:
                            transferReference
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

                            'Content-Type':
                                'application/json'
                        }
                    }
                );

        } catch (transferError) {
            payment.payoutStatus =
                'failed';

            await payment.save();

            throw transferError;
        }

        // ==========================
        // CHECK PAYSTACK RESPONSE
        // ==========================

        if (
            !transferResponse.data?.status ||
            !transferResponse.data?.data
        ) {
            payment.payoutStatus =
                'failed';

            await payment.save();

            throw new Error(
                transferResponse.data
                    ?.message ||
                'Paystack transfer could not be initiated'
            );
        }

        // ==========================
        // IMPORTANT:
        // DO NOT MARK AS PAID HERE.
        //
        // Paystack may still be processing
        // the transfer.
        //
        // The webhook will update:
        //
        // processing → paid
        // processing → failed
        // ==========================

        return payment;

    } catch (error) {
        console.error(
            'Farmer payout error:',
            error.response?.data ||
            error.message
        );

        // ==========================
        // MARK FAILED WHEN APPROPRIATE
        // ==========================

        try {
            if (
                mongoose.Types.ObjectId.isValid(
                    orderId
                )
            ) {
                const payment =
                    await Payment.findOne({
                        order: orderId
                    });

                if (
                    payment &&
                    payment.payoutStatus ===
                    'processing'
                ) {
                    payment.payoutStatus =
                        'failed';

                    await payment.save();
                }
            }
        } catch (updateError) {
            console.error(
                'Unable to update payout failure status:',
                updateError.message
            );
        }

        throw error;
    }
};



// ==========================
// REQUEST FARMER PAYOUT
// ==========================

const requestFarmerPayout = async (
    req,
    res
) => {
    try {
        if (
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'Only an admin can process farmer payouts'
            });
        }

        const { orderId } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                orderId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid order ID'
            });
        }

        const payment =
            await processFarmerPayout(
                orderId
            );

        return res.status(200).json({
            success: true,
            message:
                'Farmer payout processed successfully',
            data: payment
        });

    } catch (error) {
        console.error(
            'Request farmer payout error:',
            error.response?.data ||
            error.message
        );

        return res.status(400).json({
            success: false,
            message:
                error.response?.data?.message ||
                error.message ||
                'Unable to process farmer payout'
        });
    }
};


// ==========================
// CREATE FARMER RECIPIENT
// ==========================

const createFarmerRecipient = async (
    req,
    res
) => {
    try {
        // ==========================
        // ONLY FARMERS
        // ==========================

        if (
            req.user.role !== 'farmer'
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'Only farmers can create payout details'
            });
        }

        const {
            bankName,
            bankCode,
            accountNumber,
            accountName
        } = req.body;

        // ==========================
        // VALIDATE INPUT
        // ==========================

        if (
            typeof bankName !== 'string' ||
            typeof bankCode !== 'string' ||
            typeof accountNumber !==
            'string' ||
            typeof accountName !== 'string'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid payout details'
            });
        }

        const cleanBankName =
            bankName.trim();

        const cleanBankCode =
            bankCode.trim();

        const cleanAccountNumber =
            accountNumber.trim();

        const cleanAccountName =
            accountName.trim();

        if (
            !cleanBankName ||
            !cleanBankCode ||
            !cleanAccountNumber ||
            !cleanAccountName
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Bank name, bank code, account number and account name are required'
            });
        }

        if (
            cleanBankName.length > 100 ||
            cleanBankCode.length > 20 ||
            cleanAccountName.length > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Payout details contain values that are too long'
            });
        }

        if (
            !/^\d{10}$/.test(
                cleanAccountNumber
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Account number must contain exactly 10 digits'
            });
        }

        // ==========================
        // CHECK PAYSTACK KEY
        // ==========================

        if (
            !process.env.PAYSTACK_SECRET_KEY
        ) {
            return res.status(500).json({
                success: false,
                message:
                    'Paystack secret key is not configured'
            });
        }

        // ==========================
        // FIND FARMER
        // ==========================

        const farmer =
            await User.findById(
                req.user.id
            );

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message:
                    'Farmer not found'
            });
        }

        if (
            farmer.accountStatus !==
            'active'
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'Your account is not active'
            });
        }

        // ==========================
        // CREATE PAYSTACK RECIPIENT
        // ==========================

        const response =
            await axios.post(
                'https://api.paystack.co/transferrecipient',
                {
                    type: 'nuban',

                    name:
                        cleanAccountName,

                    account_number:
                        cleanAccountNumber,

                    bank_code:
                        cleanBankCode,

                    currency: 'NGN'
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

                        'Content-Type':
                            'application/json'
                    }
                }
            );

        if (
            !response.data?.status
        ) {
            return res.status(400).json({
                success: false,
                message:
                    response.data
                        ?.message ||
                    'Unable to create Paystack recipient'
            });
        }

        const recipientCode =
            response.data?.data
                ?.recipient_code;

        if (!recipientCode) {
            return res.status(400).json({
                success: false,
                message:
                    'Paystack did not return a recipient code'
            });
        }

        // ==========================
        // SAVE PAYOUT DETAILS
        // ==========================

        farmer.bankName =
            cleanBankName;

        farmer.bankCode =
            cleanBankCode;

        farmer.accountNumber =
            cleanAccountNumber;

        farmer.accountName =
            cleanAccountName;

        farmer.paystackRecipientCode =
            recipientCode;

        await farmer.save();

        // ==========================
        // DO NOT RETURN SENSITIVE
        // PAYSTACK RECIPIENT CODE
        // ==========================

        return res.status(200).json({
            success: true,
            message:
                'Payout details saved successfully',

            data: {
                bankName:
                    farmer.bankName,

                accountName:
                    farmer.accountName
            }
        });

    } catch (error) {
        console.error(
            'Create farmer recipient error:',
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                error.response?.data?.message ||
                'Unable to create payout recipient'
        });
    }
};


// ==========================
// EXPORT CONTROLLERS
// ==========================

module.exports = {
    initializePayment,
    verifyPayment,
    getMyPayments,
    processFarmerPayout,
    createFarmerRecipient,
    requestFarmerPayout
};