import apiClient from './apiClient';

export default {
    register(userData) {
        return apiClient.post('/auth/register', userData);
    },

    login(credentials) {
        return apiClient.post('/auth/login', credentials)
            .then(response => ({
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
                user: response.data.user
            }));
    },

    getProfile() {
        return apiClient.get('/auth/profile');
    },

    updateProfile(profileData) {
        return apiClient.patch('/auth/profile', profileData);
    },

    changePassword(passwordData) {
        return apiClient.post('/auth/change-password', passwordData);
    },

    refreshToken(refreshToken) {
        return apiClient.post('/auth/refresh', { refreshToken });
    },

    logout(refreshToken) {
        return apiClient.post('/auth/logout', { refreshToken });
    }
};