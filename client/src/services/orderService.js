import api from './api';

// ==========================
// BUYER ORDERS
// ==========================

export const getMyOrders = async () => {
    const response = await api.get('/orders/my-orders');

    return response.data;
};


// ==========================
// FARMER ORDERS
// ==========================

export const getFarmerOrders = async () => {
    const response = await api.get('/orders/farmer-orders');

    return response.data;
};


// ==========================
// GET ONE ORDER
// ==========================

export const getOrderById = async (id) => {
    const response = await api.get(`/orders/${id}`);

    return response.data;
};


// ==========================
// UPDATE ORDER STATUS
// ==========================

export const updateOrderStatus = async (id, status) => {
    const response = await api.put(
        `/orders/${id}/status`,
        { status }
    );

    return response.data;
};
export const confirmDelivery = async (id) => {
    const response = await api.put(
        `/orders/${id}/confirm-delivery`
    );

    return response.data;
};