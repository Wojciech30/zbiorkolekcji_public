import CollectionService from "@/services/CollectionService";

export default {
    namespaced: true,

    state: () => ({
        myCollections: [],
        popularCollections: [],
        publicCollections: [],
        currentCollection: null,

        myPagination: {
            page: 1,
            limit: 9,
            total: 0,
            pages: 1
        },

        publicPagination: {
            page: 1,
            limit: 9,
            total: 0,
            pages: 1
        },

        loading: false,
        error: null
    }),

    mutations: {
        SET_LOADING(state, isLoading) {
            state.loading = isLoading;
        },

        SET_ERROR(state, error) {
            state.error = error;
        },

        SET_MY_COLLECTIONS(state, payload) {
            state.myCollections = payload.collections || [];
            state.myPagination = {
                page: payload.page || 1,
                limit: payload.limit || state.myPagination.limit,
                total: payload.total || 0,
                pages: payload.pages || 1
            };
        },

        SET_PUBLIC_COLLECTIONS(state, payload) {
            state.publicCollections = payload.collections || [];
            state.publicPagination = {
                page: payload.page || 1,
                limit: payload.limit || state.publicPagination.limit,
                total: payload.total || 0,
                pages: payload.pages || 1
            };
        },

        SET_POPULAR_COLLECTIONS(state, collections) {
            state.popularCollections = collections || [];
        },

        SET_CURRENT_COLLECTION(state, collection) {
            state.currentCollection = collection || null;
        },

        ADD_MY_COLLECTION(state, collection) {
            state.myCollections = [collection, ...state.myCollections];
            state.myPagination.total += 1;
        },

        UPDATE_COLLECTION_IN_LISTS(state, collection) {
            const id = collection._id || collection.id;

            state.myCollections = state.myCollections.map(c =>
                (c._id || c.id) === id ? collection : c
            );

            state.publicCollections = state.publicCollections.map(c =>
                (c._id || c.id) === id ? collection : c
            );

            if (state.currentCollection && (state.currentCollection._id || state.currentCollection.id) === id) {
                state.currentCollection = collection;
            }
        },

        REMOVE_COLLECTION_FROM_LISTS(state, collectionId) {
            state.myCollections = state.myCollections.filter(
                c => (c._id || c.id) !== collectionId
            );
            state.publicCollections = state.publicCollections.filter(
                c => (c._id || c.id) !== collectionId
            );

            if (state.currentCollection && (state.currentCollection._id || state.currentCollection.id) === collectionId) {
                state.currentCollection = null;
            }

            if (state.myPagination.total > 0) {
                state.myPagination.total -= 1;
            }
        }
    },

    actions: {
        async fetchMyCollections({ commit, state }, { page, limit } = {}) {
            commit("SET_LOADING", true);
            commit("SET_ERROR", null);

            const query = {
                page: page || state.myPagination.page,
                limit: limit || state.myPagination.limit
            };

            try {
                const response = await CollectionService.getUserCollections(query);
                const data = response.data || response;

                commit("SET_MY_COLLECTIONS", {
                    collections: data.collections,
                    page: data.page,
                    limit: query.limit,
                    total: data.total,
                    pages: data.pages
                });
            } catch (error) {
                commit("SET_ERROR", error);
                throw error;
            } finally {
                commit("SET_LOADING", false);
            }
        },

        async fetchPublicCollections({ commit, state }, params = {}) {
            commit("SET_LOADING", true);
            commit("SET_ERROR", null);

            const query = {
                page: params.page || state.publicPagination.page,
                limit: params.limit || state.publicPagination.limit
            };

            if (params.category) {
                query.category = params.category;
            }
            if (params.search) {
                query.search = params.search;
            }

            try {
                const response = await CollectionService.getCollections(query);
                const data = response.data || response;

                commit("SET_PUBLIC_COLLECTIONS", {
                    collections: data.collections,
                    page: data.page,
                    limit: query.limit,
                    total: data.total,
                    pages: data.pages
                });
            } catch (error) {
                commit("SET_ERROR", error);
                throw error;
            } finally {
                commit("SET_LOADING", false);
            }
        },

        async fetchPopularCollections({ commit }) {
            commit("SET_ERROR", null);

            try {
                const response = await CollectionService.getPopularCollections();
                const data = response.data || response;
                commit("SET_POPULAR_COLLECTIONS", data.collections || []);
            } catch (error) {
                commit("SET_ERROR", error);
                throw error;
            }
        },

        async fetchCollectionById({ commit }, id) {
            commit("SET_LOADING", true);
            commit("SET_ERROR", null);

            try {
                const response = await CollectionService.getCollection(id);
                const data = response.data || response;
                commit("SET_CURRENT_COLLECTION", data.collection || data);
            } catch (error) {
                commit("SET_ERROR", error);
                throw error;
            } finally {
                commit("SET_LOADING", false);
            }
        },

        async createCollection({ commit }, payload) {
          const response = await CollectionService.addCollection(payload);
          const data = response.data || response;
          const created = data.collection || data;
          commit("ADD_MY_COLLECTION", created);
          return created;
        },

        async updateCollection({ commit }, { id, updates }) {
          const response = await CollectionService.updateCollection(id, updates);
          const data = response.data || response;
          const updated = data.collection || data;
          commit("UPDATE_COLLECTION_IN_LISTS", updated);
          return updated;
        },

        async deleteCollection({ commit }, id) {
          await CollectionService.deleteCollection(id);
          commit("REMOVE_COLLECTION_FROM_LISTS", id);
        }

    },

    getters: {
        myCollections: state => state.myCollections,
        publicCollections: state => state.publicCollections,
        popularCollections: state => state.popularCollections,
        currentCollection: state => state.currentCollection,
        myPagination: state => state.myPagination,
        publicPagination: state => state.publicPagination,
        isLoading: state => state.loading,
        lastError: state => state.error
    }
};
