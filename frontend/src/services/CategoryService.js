/**
 * @fileoverview Serwis API kategorii
 * @description Metody CRUD dla kategorii kolekcji.
 * 
 * @module services/CategoryService
 * 
 * @methods
 * - getCategories() - lista kategorii
 * - getCategory(id) - szczegóły kategorii
 * - createCategory(data) - tworzenie (admin)
 * - updateCategory(id, updates) - aktualizacja (admin)
 * - deleteCategory(id) - usuwanie (admin)
 * - getCategoryCollections(id) - kolekcje w kategorii
 */

import apiClient from './apiClient';

export default {
    getCategories(params = {}) {
        return apiClient.get('/categories', { params });
    },

    getCategory(id) {
        return apiClient.get(`/categories/${id}`);
    },

    createCategory(categoryData) {
        return apiClient.post('/categories', categoryData);
    },

    updateCategory(id, updates) {
        return apiClient.patch(`/categories/${id}`, {name: updates.name, description: updates.description, requireItemName: updates.requireItemName, displayAttribute: updates.displayAttribute, attributes: updates.attributes});
    },

    deleteCategory(id) {
        return apiClient.delete(`/categories/${id}`);
    },

    getCategoryCollections(id) {
        return apiClient.get(`/categories/${id}/collections`);
    }
};