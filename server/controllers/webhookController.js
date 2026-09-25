const crypto = require('crypto');

const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const {
    createNotification
} = require('../utils/notificationHelper');


// ==========================
// PAYSTACK WEBHOOK
// ==========================

const paystackWebhook = async (req, res) => {
    try {
        const secret =
            process.env.PAYSTACK_SECRET_KEY;

        if (!secret) {
            console.error(
                'PAYSTACK_SECRET_KEY is not configured'
            );

            return res.sendStatus(200);
        }

        const signature =
            req.headers['x-paystack-signature'];

        if (!signature || !req.rawBody) {
            console.warn(
                'Invalid Paystack webhook request'
            );

            return res.sendStatus(401);
        }

        // ==========================
        // VERIFY SIGNATURE
        // ==========================

        const expectedSignature =
            crypto
                .createHmac('sha512', secret)
                .update(req.rawBody)
                .digest('hex');

        const receivedBuffer =
            Buffer.from(signature, 'utf8');

        const expectedBuffer =
            Buffer.from(expectedSignature, 'utf8');

        if (
            receivedBuffer.length !==
            expectedBuffer.length
        ) {
            return res.sendStatus(401);
        }

        const signaturesMatch =
            crypto.timingSafeEqual(
                receivedBuffer,
                expectedBuffer
            );

        if (!signaturesMatch) {
            console.warn(
                'Invalid Paystack webhook signature'
            );

            return res.sendStatus(401);
        }

        const event = req.body;

        // ==========================
        // TRANSFER EVENTS
        // ==========================

        if (
            event.event === 'transfer.success' ||
            event.event === 'transfer.failed' ||
            event.event === 'transfer.reversed'
        ) {
            return await handleTransferEvent(
                event,
                res
            );
        }

        // ==========================
        // ONLY PROCESS CHARGE.SUCCESS
        // ==========================

        if (
            event.event !== 'charge.success'
        ) {
            return res.sendStatus(200);
        }

        const transaction =
            event.data;

        if (!transaction) {
            return res.sendStatus(200);
        }

        const reference =
            transaction.reference;

        if (!reference) {
            return res.sendStatus(200);
        }

        // ==========================
        // FIND PAYMENT
        // ==========================

        const payment =
            await Payment.findOne({
                reference
            });

        if (!payment) {
            console.warn(
                `Payment not found for webhook: ${reference}`
            );

            return res.sendStatus(200);
        }

        // ==========================
        // IDEMPOTENCY
        // ==========================

        if (payment.status === 'paid') {
            return res.sendStatus(200);
        }

        const order =
            await Order.findById(
                payment.order
            );

        if (!order) {
            return res.sendStatus(200);
        }

        // ==========================
        // VERIFY TRANSACTION
        // ==========================

        if (
            transaction.status !== 'success' ||
            transaction.currency !== 'NGN'
        ) {
            return res.sendStatus(200);
        }

        const expectedAmount =
            Math.round(
                payment.amount * 100
            );

        if (
            Number(transaction.amount) !==
            expectedAmount
        ) {
            console.warn(
                `Payment amount mismatch: ${reference}`
            );

            return res.sendStatus(200);
        }

        // ==========================
        // STOCK PROTECTION
        // ==========================

        const product =
            await Product.findOneAndUpdate(
                {
                    _id: order.product,
                    quantity: {
                        $gte: order.quantity
                    }
                },
                {
                    $inc: {
                        quantity:
                            -order.quantity
                    }
                },
                {
                    new: true
                }
            );

        if (!product) {
            console.error(
                `Insufficient stock for payment: ${reference}`
            );

            return res.sendStatus(200);
        }

        // ==========================
        // UPDATE PRODUCT STATUS
        // ==========================

        if (product.quantity === 0) {
            product.status = 'sold';

            await product.save();
        }

        // ==========================
        // UPDATE PAYMENT
        // ==========================

        payment.status = 'paid';
        payment.paidAt = new Date();

        // ==========================
        // UPDATE ORDER
        // ==========================

        order.paymentStatus = 'paid';
        order.paymentReference = reference;
        order.status = 'confirmed';

        await payment.save();
        await order.save();

        // ==========================
        // NOTIFY FARMER
        // ==========================

        await createNotification({
            recipient: order.farmer,
            type: 'payment',
            title: 'Payment Received',
            message:
                'A buyer has successfully paid for your product.',
            relatedId: order._id
        });

        return res.sendStatus(200);

    } catch (error) {
        console.error(
            'Paystack webhook error:',
            error
        );

        return res.sendStatus(200);
    }
};


// ==========================
// HANDLE PAYSTACK TRANSFER
// ==========================

const handleTransferEvent = async (
    event,
    res
) => {
    try {
        const transfer =
            event.data;

        if (!transfer) {
            return res.sendStatus(200);
        }

        const reference =
            transfer.reference;

        if (!reference) {
            return res.sendStatus(200);
        }

        // ==========================
        // FIND PAYMENT
        // ==========================

        const payment =
            await Payment.findOne({
                payoutReference: reference
            });

        if (!payment) {
            console.warn(
                `Payment not found for transfer: ${reference}`
            );

            return res.sendStatus(200);
        }

        const order =
            await Order.findById(
                payment.order
            );

        // ==========================
        // TRANSFER SUCCESS
        // ==========================

        if (
            event.event ===
            'transfer.success'
        ) {
            if (
                payment.payoutStatus ===
                'paid'
            ) {
                return res.sendStatus(200);
            }

            payment.payoutStatus = 'paid';
            payment.payoutAt = new Date();

            await payment.save();

            if (order) {
                await createNotification({
                    recipient: order.farmer,
                    type: 'payment',
                    title: 'Payout Successful',
                    message:
                        'Your FarmLink payout has been successfully transferred.',
                    relatedId: order._id
                });
            }

            return res.sendStatus(200);
        }

        // ==========================
        // TRANSFER FAILED
        // ==========================

        if (
            event.event ===
            'transfer.failed'
        ) {
            payment.payoutStatus = 'failed';

            await payment.save();

            if (order) {
                await createNotification({
                    recipient: order.farmer,
                    type: 'payment',
                    title: 'Payout Failed',
                    message:
                        'Your FarmLink payout could not be completed.',
                    relatedId: order._id
                });
            }

            return res.sendStatus(200);
        }

        // ==========================
        // TRANSFER REVERSED
        // ==========================

        if (
            event.event ===
            'transfer.reversed'
        ) {
            payment.payoutStatus = 'failed';

            await payment.save();

            if (order) {
                await createNotification({
                    recipient: order.farmer,
                    type: 'payment',
                    title: 'Payout Reversed',
                    message:
                        'Your FarmLink payout was reversed by Paystack.',
                    relatedId: order._id
                });
            }

            return res.sendStatus(200);
        }

        return res.sendStatus(200);

    } catch (error) {
        console.error(
            'Paystack transfer webhook error:',
            error
        );

        return res.sendStatus(200);
    }
};


module.exports = {
    paystackWebhook
};
