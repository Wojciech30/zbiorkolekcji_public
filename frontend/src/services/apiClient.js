import axios from 'axios';
import store from '@/store';
import router from '@/router';

const apiClient = axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL || 'http://172.23.52.141:3000/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': process.env.VUE_APP_VERSION || '1.0.0'
    }
});

// Interceptor żądań
apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor odpowiedzi
apiClient.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { accessToken } = await store.dispatch('auth/refreshToken');

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                return apiClient(originalRequest);
            } catch (refreshError) {
                store.commit('auth/logout');
                await router.push({name: 'Login'});
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;