const crypto = require('crypto');

const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const {
    createNotification
} = require('./notificationController');


// ==========================
// PAYSTACK WEBHOOK
// ==========================

const paystackWebhook = async (req, res) => {
    try {
        const secret = process.env.PAYSTACK_SECRET_KEY;

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

        const signaturesMatch =
            crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            );

        if (!signaturesMatch) {
            console.warn(
                'Invalid Paystack webhook signature'
            );

            return res.sendStatus(401);
        }

        const event = req.body;

        // ==========================
        // ACKNOWLEDGE UNSUPPORTED EVENTS
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

        // Always acknowledge after the
        // request has been received and
        // validated enough to avoid endless
        // retries caused by application errors.

        return res.sendStatus(200);
    }
};


module.exports = {
    paystackWebhook
};