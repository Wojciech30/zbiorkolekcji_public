import apiClient from './apiClient';

export default {

    getItem(id) {
        return apiClient.get(`/items/${id}`);
    },

    createItem(itemData) {
        return apiClient.post('/items', itemData);
    },

    updateItem(id, updates) {
        return apiClient.patch(`/items/${id}`, updates);
    },

    deleteItem(id) {
        return apiClient.delete(`/items/${id}`);
    },

    getItemsByCollection(collectionId) {
        return apiClient.get(`/collections/${collectionId}/items`);
    },

    // Polubienia
    toggleLike(id) {
        return apiClient.post(`/items/${id}/like`);
    },

    // Komentarze
    getComments(id) {
        return apiClient.get(`/items/${id}/comments`);
    },

    addComment(id, text) {
        return apiClient.post(`/items/${id}/comments`, { text });
    },

    deleteComment(itemId, commentId) {
        return apiClient.delete(`/items/${itemId}/comments/${commentId}`);
    }
};