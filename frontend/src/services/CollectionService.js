import apiClient from "./apiClient";

export default {
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
    
    getPublicCollections(params = {}) {
        return this.getCollections(params);
    },

    getUserCollections(params = {}) {
        const {
            page = 1,
            limit = 10
        } = params;

        return apiClient.get("/collections/me", {
            params: { page, limit }
        });
    },

    getCollection(id) {
        return apiClient.get(`/collections/${id}`);
    },

    getCollectionStats(id) {
        return apiClient.get(`/collections/${id}/stats`);
    },

    getCollectionAttributes(id) {
        return apiClient.get(`/collections/${id}/attributes`);
    },

    addCollection(collectionData) {
        return apiClient.post("/collections", collectionData);
    },

    updateCollection(id, updates) {
        return apiClient.patch(`/collections/${id}`, updates);
    },

    deleteCollection(id) {
        return apiClient.delete(`/collections/${id}`);
    },

    addAllowedUserByUsername(collectionId, username) {
        return apiClient.post(`/collections/${collectionId}/allowed-users`, {
            username
        });
    },

    getAllowedUsers(collectionId) {
        return apiClient.get(`/collections/${collectionId}/allowed-users`);
    },

    removeAllowedUser(collectionId, userId) {
        return apiClient.delete(`/collections/${collectionId}/allowed-users/${userId}`);
    },

    getPopularCollections() {
        return apiClient.get("/collections/special/popular");
    },

    searchCollections(query, extraParams = {}) {
        return this.getCollections({
            ...extraParams,
            search: query
        });
    },

    incrementViews(id) {
        return apiClient.post(`/collections/${id}/view`);
    },

    likeCollection(id) {
        return apiClient.post(`/collections/${id}/like`);
    },

    getComments(id) {
        return apiClient.get(`/collections/${id}/comments`);
    },

    addComment(id, text) {
        return apiClient.post(`/collections/${id}/comments`, { text });
    },

    deleteComment(collectionId, commentId) {
        return apiClient.delete(
            `/collections/${collectionId}/comments/${commentId}`
        );
    }
};
