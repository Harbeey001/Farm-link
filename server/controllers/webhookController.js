const crypto = require('crypto');

const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');

const {
    createNotification
} = require('../utils/notificationHelper');

const paystackWebhook = async (req, res) => {
    try {
        const secretKey = process.env.PAYSTACK_SECRET_KEY;

        if (!secretKey) {
            console.error('PAYSTACK_SECRET_KEY is not configured.');
            return res.sendStatus(500);
        }

        const signature = req.headers['x-paystack-signature'];

        if (!signature || !req.rawBody) {
            console.error('Missing Paystack signature or raw body.');
            return res.sendStatus(401);
        }

        const expectedSignature = crypto
            .createHmac('sha512', secretKey)
            .update(req.rawBody)
            .digest('hex');

        const receivedBuffer = Buffer.from(signature, 'utf8');
        const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

        if (
            receivedBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
        ) {
            console.error('Invalid Paystack webhook signature.');
            return res.sendStatus(401);
        }

        const { event, data } = req.body;

        console.log(`Paystack webhook received: ${event}`);

        // =========================================================
        // PAYMENT SUCCESS
        // =========================================================
        if (event === 'charge.success') {
            const reference = data?.reference;

            if (!reference) {
                console.error('Payment webhook has no reference.');
                return res.sendStatus(200);
            }

            const payment = await Payment.findOne({
                paymentReference: reference
            });

            if (!payment) {
                console.error(
                    `Payment not found for reference: ${reference}`
                );
                return res.sendStatus(200);
            }

            // Prevent duplicate processing
            if (payment.paymentStatus === 'paid') {
                return res.sendStatus(200);
            }

            const order = await Order.findById(payment.order);

            if (!order) {
                console.error(
                    `Order not found for payment: ${payment._id}`
                );
                return res.sendStatus(200);
            }

            // Confirm Paystack transaction details
            const transactionStatus = data?.status;
            const currency = data?.currency;
            const amount = Number(data?.amount);

            if (transactionStatus !== 'success') {
                console.error(
                    `Paystack transaction is not successful: ${reference}`
                );
                return res.sendStatus(200);
            }

            if (currency !== 'NGN') {
                console.error(
                    `Unexpected payment currency for ${reference}: ${currency}`
                );
                return res.sendStatus(200);
            }

            if (amount !== Number(payment.amount)) {
                console.error(
                    `Payment amount mismatch for ${reference}.`
                );
                return res.sendStatus(200);
            }

            const product = await Product.findById(order.product);

            if (!product) {
                console.error(
                    `Product not found for order: ${order._id}`
                );
                return res.sendStatus(200);
            }

            // Decrease product quantity safely
            const updatedProduct = await Product.findOneAndUpdate(
                {
                    _id: product._id,
                    quantity: { $gte: order.quantity }
                },
                {
                    $inc: {
                        quantity: -order.quantity
                    }
                },
                {
                    new: true
                }
            );

            if (!updatedProduct) {
                console.error(
                    `Insufficient stock for product: ${product._id}`
                );
                return res.sendStatus(200);
            }

            if (updatedProduct.quantity === 0) {
                updatedProduct.status = 'sold';
                await updatedProduct.save();
            }

            // Update payment
            payment.paymentStatus = 'paid';
            payment.paidAt = new Date();

            // Update order
            order.paymentStatus = 'paid';
            order.paymentReference = reference;
            order.status = 'confirmed';

            await payment.save();
            await order.save();

            // Notify farmer
            if (order.farmer) {
                try {
                    await createNotification({
                        recipient: order.farmer,
                        type: 'payment',
                        title: 'Payment Received',
                        message: `Payment for your ${order.productName || 'product'} order has been confirmed.`
                    });
                } catch (notificationError) {
                    console.error(
                        'Payment notification failed:',
                        notificationError.message
                    );
                }
            }

            console.log(
                `Payment successfully confirmed: ${reference}`
            );

            return res.sendStatus(200);
        }

        // =========================================================
        // PAYOUT SUCCESS
        // =========================================================
        if (event === 'transfer.success') {
            const reference = data?.reference;

            if (!reference) {
                console.error('Transfer success has no reference.');
                return res.sendStatus(200);
            }

            const payment = await Payment.findOne({
                payoutReference: reference
            });

            if (!payment) {
                console.error(
                    `Payment not found for payout reference: ${reference}`
                );
                return res.sendStatus(200);
            }

            payment.payoutStatus = 'paid';
            payment.payoutAt = new Date();

            await payment.save();

            const order = await Order.findById(payment.order);

            if (order?.farmer) {
                try {
                    await createNotification({
                        recipient: order.farmer,
                        type: 'payment',
                        title: 'Payment Successful',
                        message: 'Your FarmLink payment has been successfully completed.'
                    });
                } catch (notificationError) {
                    console.error(
                        'Payment notification failed:',
                        notificationError.message
                    );
                }
            }

            console.log(
                `Farmer payout completed: ${reference}`
            );

            return res.sendStatus(200);
        }

        // =========================================================
        // PAYOUT FAILED
        // =========================================================
        if (event === 'transfer.failed') {
            const reference = data?.reference;

            if (!reference) {
                console.error('Transfer failed has no reference.');
                return res.sendStatus(200);
            }

            const payment = await Payment.findOne({
                payoutReference: reference
            });

            if (!payment) {
                console.error(
                    `Payment not found for failed payout: ${reference}`
                );
                return res.sendStatus(200);
            }

            payment.payoutStatus = 'failed';

            await payment.save();

            const order = await Order.findById(payment.order);

            if (order?.farmer) {
                try {
                    await createNotification({
                        recipient: order.farmer,
                        type: 'payment',
                        title: 'Payment Failed',
                        message: 'Your FarmLink payment could not be completed. Please contact the administrator.'
                    });
                } catch (notificationError) {
                    console.error(
                        'Payout notification failed:',
                        notificationError.message
                    );
                }
            }

            console.log(
                `Farmer payout failed: ${reference}`
            );

            return res.sendStatus(200);
        }

        // =========================================================
        // PAYOUT REVERSED
        // =========================================================
        if (event === 'transfer.reversed') {
            const reference = data?.reference;

            if (!reference) {
                console.error('Transfer reversed has no reference.');
                return res.sendStatus(200);
            }

            const payment = await Payment.findOne({
                payoutReference: reference
            });

            if (!payment) {
                console.error(
                    `Payment not found for reversed payout: ${reference}`
                );
                return res.sendStatus(200);
            }

            payment.payoutStatus = 'failed';

            await payment.save();

            const order = await Order.findById(payment.order);

            if (order?.farmer) {
                try {
                    await createNotification({
                        recipient: order.farmer,
                        type: 'payment',
                        title: 'Payment Reversed',
                        message: 'Your FarmLink payment was reversed. Please contact the administrator.'
                    });
                } catch (notificationError) {
                    console.error(
                        'Payout notification failed:',
                        notificationError.message
                    );
                }
            }

            console.log(
                `Farmer payout reversed: ${reference}`
            );

            return res.sendStatus(200);
        }

        // Other Paystack events
        console.log(`Unhandled Paystack event: ${event}`);

        return res.sendStatus(200);

    } catch (error) {
        console.error(
            'Paystack webhook error:',
            error.message
        );

        // Return 200 so Paystack does not continuously retry
        // an event because of an internal application error.
        return res.sendStatus(200);
    }
};

module.exports = {
    paystackWebhook
};