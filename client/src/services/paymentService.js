import api from './api';

// ==========================
// INITIALIZE PAYMENT
// ==========================

export const initializePayment = async (orderId) => {
    const response = await api.post(
        '/payments/initialize',
        { orderId }
    );

    return response.data;
};


// ==========================
// VERIFY PAYMENT
// ==========================

export const verifyPayment = async (reference) => {
    const response = await api.get(
        `/payments/verify/${reference}`
    );

    return response.data;
};
export const getMyPayments = async () => {
    const response = await api.get(
        '/payments/my-payments'
    );

    return response.data;
};
// ==========================
// ADMIN FARMER PAYOUT
// ==========================

export const requestFarmerPayout = async (
    orderId
) => {
    const response = await api.post(
        `/payments/payout/${orderId}`
    );

    return response.data;
};