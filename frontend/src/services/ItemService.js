/**
 * @fileoverview Serwis przedmiotów
 * @description Metody API dla CRUD przedmiotów, komentarzy i polubień.
 */

import apiClient from './apiClient';

export default {
    // ========================
    // CRUD Przedmiotów
    // ========================

    /**
     * Pobierz przedmiot po ID
     * @param {string} id - ID przedmiotu
     * @returns {Promise<{data: Object}>}
     */
    getItem(id) {
        return apiClient.get(`/items/${id}`);
    },

    /**
     * Utwórz nowy przedmiot
     * @param {Object} itemData
     * @param {string} itemData.name - Nazwa przedmiotu
     * @param {string} itemData.parentCollection - ID kolekcji
     * @param {string} [itemData.description] - Opis
     * @param {string[]} [itemData.images] - Lista URL-i obrazów
     * @param {Object} [itemData.attributes] - Dynamiczne atrybuty
     * @returns {Promise}
     */
    createItem(itemData) {
        return apiClient.post('/items', itemData);
    },

    /**
     * Aktualizuj przedmiot
     * @param {string} id
     * @param {Object} updates - Pola do aktualizacji
     * @returns {Promise}
     */
    updateItem(id, updates) {
        return apiClient.patch(`/items/${id}`, updates);
    },

    /**
     * Usuń przedmiot
     * @param {string} id
     * @returns {Promise}
     */
    deleteItem(id) {
        return apiClient.delete(`/items/${id}`);
    },

    /**
     * Pobierz wszystkie przedmioty z kolekcji
     * @param {string} collectionId
     * @returns {Promise<{data: Array}>}
     */
    getItemsByCollection(collectionId) {
        return apiClient.get(`/collections/${collectionId}/items`);
    },

    // ========================
    // Polubienia
    // ========================

    /**
     * Polub/odlub przedmiot (toggle)
     * @param {string} id
     * @returns {Promise<{data: {liked: boolean, likesCount: number}}>}
     */
    toggleLike(id) {
        return apiClient.post(`/items/${id}/like`);
    },

    // ========================
    // Komentarze
    // ========================

    /**
     * Pobierz komentarze przedmiotu
     * @param {string} id
     * @returns {Promise<{data: {comments: Array}}>}
     */
    getComments(id) {
        return apiClient.get(`/items/${id}/comments`);
    },

    /**
     * Dodaj komentarz do przedmiotu
     * @param {string} id
     * @param {string} text - Treść komentarza (max 500 znaków)
     * @returns {Promise}
     */
    addComment(id, text) {
        return apiClient.post(`/items/${id}/comments`, { text });
    },

    /**
     * Usuń komentarz z przedmiotu
     * @param {string} itemId
     * @param {string} commentId
     * @returns {Promise}
     */
    deleteComment(itemId, commentId) {
        return apiClient.delete(`/items/${itemId}/comments/${commentId}`);
    }
};