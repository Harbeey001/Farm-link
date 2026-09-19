import api from './api';

export const createRequest = async (requestData) => {
    const response = await api.post('/requests', requestData);
    return response.data;
};

export const getRequests = async () => {
    const response = await api.get('/requests');
    return response.data;
};

export const getRequestById = async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
};

export const updateRequestStatus = async (id, status) => {
    const response = await api.put(
        `/requests/${id}/status`,
        { status }
    );

    return response.data;
};