/**
 * @fileoverview Serwis autoryzacji
 * @description Metody API dla rejestracji, logowania, zarządzania profilem,
 * weryfikacji email i resetowania hasła.
 */

import apiClient from './apiClient';

export default {
    /**
     * Rejestracja nowego użytkownika
     * @param {Object} userData - Dane rejestracji
     * @param {string} userData.username - Nazwa użytkownika
     * @param {string} userData.email - Adres email
     * @param {string} userData.password - Hasło
     * @returns {Promise<Object>} Dane utworzonego użytkownika
     */
    register(userData) {
        return apiClient.post('/auth/register', userData)
            .then(r => r.data);
    },

    /**
     * Logowanie użytkownika
     * @param {Object} credentials - Dane logowania
     * @param {string} credentials.email - Email
     * @param {string} credentials.password - Hasło
     * @returns {Promise<{accessToken: string, refreshToken: string, user: Object}>}
     */
    login(credentials) {
        return apiClient.post('/auth/login', credentials)
            .then(response => ({
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
                user: response.data.user
            }));
    },

    /**
     * Pobierz profil zalogowanego użytkownika
     * @returns {Promise<Object>} Dane profilu
     */
    getProfile() {
        return apiClient.get('/auth/profile')
            .then(r => r.data);
    },

    /**
     * Zmiana hasła
     * @param {Object} passwordData
     * @param {string} passwordData.currentPassword - Aktualne hasło
     * @param {string} passwordData.newPassword - Nowe hasło
     * @returns {Promise<Object>}
     */
    changePassword(passwordData) {
        return apiClient.post('/auth/change-password', passwordData)
            .then(r => r.data);
    },

    /**
     * Odświeżenie tokena JWT
     * @param {string} refreshToken - Token odświeżania
     * @returns {Promise<{accessToken: string, refreshToken: string}>}
     */
    refreshToken(refreshToken) {
        return apiClient.post('/auth/refresh', { refreshToken })
            .then(r => ({
                accessToken: r.data.accessToken,
                refreshToken: r.data.refreshToken
            }));
    },

    /**
     * Wylogowanie - unieważnia refresh token na serwerze
     * @param {string} refreshToken
     * @returns {Promise<Object>}
     */
    logout(refreshToken) {
        return apiClient.post('/auth/logout', { refreshToken })
            .then(r => r.data);
    },

    /**
     * Weryfikacja adresu email
     * @param {string} token - Token z linku weryfikacyjnego
     * @returns {Promise<Object>}
     */
    verifyEmail(token) {
        return apiClient.post('/auth/verify-email', { token })
            .then(r => r.data);
    },

    /**
     * Żądanie resetu hasła - wysyła link na email
     * @param {string} email
     * @returns {Promise<Object>}
     */
    forgotPassword(email) {
        return apiClient.post('/auth/forgot-password', { email })
            .then(r => r.data);
    },

    /**
     * Reset hasła z tokenem
     * @param {Object} data
     * @param {string} data.token - Token z linku resetowania
     * @param {string} data.newPassword - Nowe hasło
     * @returns {Promise<Object>}
     */
    resetPassword({ token, newPassword }) {
        return apiClient.post('/auth/reset-password', { token, newPassword })
            .then(r => r.data);
    },

    /**
     * Aktualizacja avatara użytkownika
     * @param {Object} avatarData - Dane avatara (URL lub base64)
     * @returns {Promise<Object>}
     */
    updateAvatar(avatarData) {
        return apiClient.put('/auth/update-avatar', avatarData)
            .then(r => r.data);
    },

    /**
     * Zmiana widoczności profilu (publiczny/prywatny)
     * @param {boolean} isProfilePublic
     * @returns {Promise<Object>}
     */
    updateProfileVisibility(isProfilePublic) {
        return apiClient.put('/auth/update-profile-visibility', { isProfilePublic })
            .then(r => r.data);
    },

    /**
     * Usunięcie konta użytkownika
     * @param {string} password - Hasło dla potwierdzenia
     * @returns {Promise<Object>}
     */
    deleteAccount(password) {
        return apiClient.delete('/auth/delete-account', { data: { password } })
            .then(r => r.data);
    }
};
