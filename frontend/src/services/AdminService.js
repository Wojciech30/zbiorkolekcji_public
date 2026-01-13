import apiClient from "./apiClient";

export default {
    /**
     * Pobierz listę użytkowników (tylko admin)
     * @param {Object} params - parametry zapytania
     * @param {string} [params.search] - wyszukiwanie po username
     * @param {number} [params.page] - numer strony
     * @param {number} [params.limit] - limit na stronę
     */
    getUsers(params = {}) {
        return apiClient.get("/admin/users", { params });
    },

    /**
     * Zablokuj użytkownika (tylko admin)
     * @param {string} userId - ID użytkownika do zablokowania
     */
    blockUser(userId) {
        return apiClient.post(`/admin/users/${userId}/block`);
    },

    /**
     * Odblokuj użytkownika (tylko admin)
     * @param {string} userId - ID użytkownika do odblokowania
     */
    unblockUser(userId) {
        return apiClient.post(`/admin/users/${userId}/unblock`);
    },

    /**
     * Pobierz wszystkie kolekcje (publiczne i prywatne, tylko admin)
     * @param {Object} params - parametry zapytania
     * @param {string} [params.search] - wyszukiwanie po nazwie
     * @param {number} [params.page] - numer strony
     * @param {number} [params.limit] - limit na stronę
     */
    getAllCollections(params = {}) {
        return apiClient.get("/admin/collections", { params });
    }
};
