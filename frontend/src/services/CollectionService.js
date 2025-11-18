import apiClient from './apiClient';

export default {
    getCollections(params = {}) {
        return apiClient.get('/collections', {
            params: {
                page: 1,
                limit: 10,
                ...params
            }
        });
    },

    addCollection(collectionData) {
        return apiClient.post('/collections', collectionData);
    },

    getCollection(id) {
        return apiClient.get(`/collections/${id}`);
    },

    updateCollection(id, updates) {
        return apiClient.patch(`/collections/${id}`, updates);
    },

    deleteCollection(id) {
        return apiClient.delete(`/collections/${id}`);
    },

    getUserCollections(params) {
        return apiClient.get('/collections/me', {params: {page: params.page, limit: params.limit}});
    },

    addAllowedUserByUsername(collectionId, username) {
        return apiClient.post(`/collections/${collectionId}/allowed-users`, { username });
    },

    getPopularCollections() {
        return apiClient.get('/collections/special/popular');
    },

    getPublicCollections() {
        return apiClient.get('/collections');
    },

    searchCollections(query) {
        return apiClient.get('/collections/search', { params: { q: query } });
    },

    getCollectionStats(id) {
        return apiClient.get(`/collections/${id}/stats`);
    }
};