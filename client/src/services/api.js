import axios from 'axios';

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        'http://localhost:3000/api'
});

// ==========================
// REQUEST INTERCEPTOR
// ==========================

api.interceptors.request.use(
    (config) => {

        // Get JWT token
        const token = localStorage.getItem('farmlink_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Do not manually set Content-Type
        // when sending FormData.
        //
        // Axios/browser will automatically set:
        // multipart/form-data; boundary=...

        if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },

    (error) => Promise.reject(error)
);

export default api;
