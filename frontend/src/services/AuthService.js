import apiClient from './apiClient';

export default {
    register(userData) {
        return apiClient.post('/auth/register', userData)
            .then(r => r.data);
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
        return apiClient.get('/auth/profile')
            .then(r => r.data);
    },
    changePassword(passwordData) {
        return apiClient.post('/auth/change-password', passwordData)
            .then(r => r.data);
    },
    refreshToken(refreshToken) {
        return apiClient.post('/auth/refresh', { refreshToken })
            .then(r => ({
                accessToken: r.data.accessToken,
                refreshToken: r.data.refreshToken
            }));
    },
    logout(refreshToken) {
        return apiClient.post('/auth/logout', { refreshToken })
            .then(r => r.data);
    },
    verifyEmail(token) {
        return apiClient.post('/auth/verify-email', { token })
            .then(r => r.data);
    },
    forgotPassword(email) {
        return apiClient.post('/auth/forgot-password', { email })
            .then(r => r.data);
    },
    resetPassword({ token, newPassword }) {
        return apiClient.post('/auth/reset-password', { token, newPassword })
            .then(r => r.data);
    },
    updateAvatar(avatarData) {
        return apiClient.put('/auth/update-avatar', avatarData)
            .then(r => r.data);
    }
};
