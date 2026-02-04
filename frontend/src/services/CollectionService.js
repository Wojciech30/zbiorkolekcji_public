/**
 * @fileoverview Serwis kolekcji
 * @description Metody API dla CRUD kolekcji, komentarzy, polubień,
 * zarządzania użytkownikami z dostępem i statystyk.
 */

import apiClient from "./apiClient";

export default {
    // ========================
    // CRUD Kolekcji
    // ========================

    /**
     * Pobierz listę publicznych kolekcji z paginacją
     * @param {Object} params - Parametry zapytania
     * @param {number} [params.page=1] - Numer strony
     * @param {number} [params.limit=10] - Liczba wyników na stronę
     * @param {string} [params.category] - Filtr kategorii (ID)
     * @param {string} [params.search] - Fraza wyszukiwania
     * @returns {Promise<{data: {collections: Array, total: number, page: number}}>}
     */
    getCollections(params = {}) {
        const {
            page = 1,
            limit = 10,
            category,
            search
        } = params;

        return apiClient.get("/collections", {
            params: {
                page,
                limit,
                ...(category ? { category } : {}),
                ...(search ? { search } : {})
            }
        });
    },
    
    /**
     * Alias dla getCollections - pobiera publiczne kolekcje
     */
    getPublicCollections(params = {}) {
        return this.getCollections(params);
    },

    /**
     * Pobierz kolekcje zalogowanego użytkownika
     * @param {Object} params
     * @param {number} [params.page=1]
     * @param {number} [params.limit=10]
     * @returns {Promise}
     */
    getUserCollections(params = {}) {
        const {
            page = 1,
            limit = 10
        } = params;

        return apiClient.get("/collections/me", {
            params: { page, limit }
        });
    },

    /**
     * Pobierz pojedynczą kolekcję po ID
     * @param {string} id - ID kolekcji
     * @returns {Promise<{data: Object}>}
     */
    getCollection(id) {
        return apiClient.get(`/collections/${id}`);
    },

    /**
     * Pobierz statystyki kolekcji (views, likes, items count)
     * @param {string} id
     * @returns {Promise}
     */
    getCollectionStats(id) {
        return apiClient.get(`/collections/${id}/stats`);
    },

    /**
     * Pobierz definicje atrybutów kategorii kolekcji
     * @param {string} id
     * @returns {Promise}
     */
    getCollectionAttributes(id) {
        return apiClient.get(`/collections/${id}/attributes`);
    },

    /**
     * Utwórz nową kolekcję
     * @param {Object} collectionData
     * @param {string} collectionData.name - Nazwa kolekcji
     * @param {string} collectionData.category - ID kategorii
     * @param {string} [collectionData.description] - Opis
     * @param {string} [collectionData.privacy] - "public" lub "private"
     * @param {string} [collectionData.coverImage] - URL okładki
     * @returns {Promise}
     */
    addCollection(collectionData) {
        return apiClient.post("/collections", collectionData);
    },

    /**
     * Aktualizuj kolekcję
     * @param {string} id
     * @param {Object} updates - Pola do aktualizacji
     * @returns {Promise}
     */
    updateCollection(id, updates) {
        return apiClient.patch(`/collections/${id}`, updates);
    },

    /**
     * Usuń kolekcję (wraz ze wszystkimi przedmiotami)
     * @param {string} id
     * @returns {Promise}
     */
    deleteCollection(id) {
        return apiClient.delete(`/collections/${id}`);
    },

    // ========================
    // Allowed Users (prywatne kolekcje)
    // ========================

    /**
     * Dodaj użytkownika do listy dozwolonych (po nazwie użytkownika)
     * @param {string} collectionId
     * @param {string} username
     * @returns {Promise}
     */
    addAllowedUserByUsername(collectionId, username) {
        return apiClient.post(`/collections/${collectionId}/allowed-users`, {
            username
        });
    },

    /**
     * Pobierz listę dozwolonych użytkowników
     * @param {string} collectionId
     * @returns {Promise}
     */
    getAllowedUsers(collectionId) {
        return apiClient.get(`/collections/${collectionId}/allowed-users`);
    },

    /**
     * Usuń użytkownika z listy dozwolonych
     * @param {string} collectionId
     * @param {string} userId
     * @returns {Promise}
     */
    removeAllowedUser(collectionId, userId) {
        return apiClient.delete(`/collections/${collectionId}/allowed-users/${userId}`);
    },

    // ========================
    // Statystyki globalne
    // ========================

    /**
     * Pobierz globalne statystyki (łączna liczba kolekcji, przedmiotów, użytkowników)
     * @returns {Promise}
     */
    getGlobalStats() {
        return apiClient.get("/collections/special/stats");
    },

    /**
     * Pobierz popularne kolekcje (top 10 po wyświetleniach)
     * @returns {Promise}
     */
    getPopularCollections() {
        return apiClient.get("/collections/special/popular");
    },

    /**
     * Wyszukaj kolekcje po frazie
     * @param {string} query - Fraza wyszukiwania
     * @param {Object} extraParams - Dodatkowe parametry (page, limit, category)
     * @returns {Promise}
     */
    searchCollections(query, extraParams = {}) {
        return this.getCollections({
            ...extraParams,
            search: query
        });
    },

    // ========================
    // Interakcje
    // ========================

    /**
     * Zwiększ licznik wyświetleń kolekcji
     * @param {string} id
     * @returns {Promise}
     */
    incrementViews(id) {
        return apiClient.post(`/collections/${id}/view`);
    },

    /**
     * Polub/odlub kolekcję (toggle)
     * @param {string} id
     * @returns {Promise<{data: {liked: boolean, likesCount: number}}>}
     */
    likeCollection(id) {
        return apiClient.post(`/collections/${id}/like`);
    },

    // ========================
    // Komentarze
    // ========================

    /**
     * Pobierz komentarze kolekcji
     * @param {string} id
     * @returns {Promise<{data: {comments: Array}}>}
     */
    getComments(id) {
        return apiClient.get(`/collections/${id}/comments`);
    },

    /**
     * Dodaj komentarz do kolekcji
     * @param {string} id
     * @param {string} text - Treść komentarza
     * @returns {Promise}
     */
    addComment(id, text) {
        return apiClient.post(`/collections/${id}/comments`, { text });
    },

    /**
     * Usuń komentarz z kolekcji
     * @param {string} collectionId
     * @param {string} commentId
     * @returns {Promise}
     */
    deleteComment(collectionId, commentId) {
        return apiClient.delete(
            `/collections/${collectionId}/comments/${commentId}`
        );
    },

    /**
     * Pobierz polubione kolekcje zalogowanego użytkownika
     * @param {Object} params
     * @param {number} [params.page=1]
     * @param {number} [params.limit=6]
     * @returns {Promise}
     */
    getLikedCollections({ page = 1, limit = 6 } = {}) {
        return apiClient.get("/collections/me/liked", { params: { page, limit } });
    }
};
