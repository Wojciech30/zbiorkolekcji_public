/**
 * @fileoverview Vuex moduł autentykacji
 * @description Zarządzanie stanem logowania użytkownika, tokenami JWT,
 * i trwałością sesji (localStorage/sessionStorage).
 * 
 * @module store/modules/auth
 * 
 * @state
 * - user: Zalogowany użytkownik lub null
 * - accessToken, refreshToken: Tokeny JWT
 * 
 * @mutations
 * - SET_USER, SET_TOKENS, UPDATE_USER, LOGOUT
 * 
 * @actions
 * - login, logout, refreshToken
 * 
 * @getters
 * - isAuthenticated, isAdmin, isBlocked
 */

import AuthService from "@/services/AuthService";
import router from "@/router";

export default {
    namespaced: true,

    state: () => ({
        user: (() => {
            try {
                // Sprawdź oba storage przy inicjalizacji
                const localUser = localStorage.getItem("user");
                const sessionUser = sessionStorage.getItem("user");
                return JSON.parse(localUser || sessionUser);
            } catch {
                return null;
            }
        })(),
        accessToken: localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"),
        refreshToken: localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken")
    }),

    mutations: {
        SET_USER(state, { user, rememberMe }) {
            state.user = user;
            const storage = rememberMe ? localStorage : sessionStorage;

            if (user) {
                storage.setItem("user", JSON.stringify(user));
                if (rememberMe) {
                    localStorage.setItem("rememberMe", "true");
                }
            } else {
                localStorage.removeItem("user");
                sessionStorage.removeItem("user");
            }
        },

        // Use this to update user fields without affecting storage location
        UPDATE_USER(state, updates) {
            if (!state.user) return;
            
            state.user = { ...state.user, ...updates };
            
            // Determine which storage to use based on rememberMe
            const storage = localStorage.getItem("rememberMe") === "true" 
                ? localStorage 
                : sessionStorage;
            
            storage.setItem("user", JSON.stringify(state.user));
        },

        SET_TOKENS(state, { accessToken, refreshToken, rememberMe }) {
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            const storage = rememberMe ? localStorage : sessionStorage;

            if (accessToken) storage.setItem("accessToken", accessToken);
            else {
                localStorage.removeItem("accessToken");
                sessionStorage.removeItem("accessToken");
            }

            if (refreshToken) storage.setItem("refreshToken", refreshToken);
            else {
                localStorage.removeItem("refreshToken");
                sessionStorage.removeItem("refreshToken");
            }
        },

        LOGOUT(state) {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;

            // Wyczyść oba storage
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            localStorage.removeItem("rememberMe");
            sessionStorage.removeItem("accessToken");
            sessionStorage.removeItem("refreshToken");
            sessionStorage.removeItem("user");
        }
    },

    actions: {
        async login({ commit }, credentials) {
            const { rememberMe, ...loginData } = credentials;
            const response = await AuthService.login(loginData);

            if (!response?.accessToken || !response?.refreshToken) {
                throw new Error("Nieprawidłowa odpowiedź serwera");
            }

            commit("SET_TOKENS", {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                rememberMe
            });

            commit("SET_USER", { user: response.user, rememberMe });

            return response;
        },

        async logout({ commit, state }) {
            try {
                if (state.refreshToken) {
                    await AuthService.logout(state.refreshToken).catch(() => { });
                }
            } catch {
                // ignorujemy błędy backendu
            }

            commit("LOGOUT");

            await router.push({ name: "Login" }).catch(() => { });
        },

        async refreshToken({ commit, state }) {
            if (!state.refreshToken) {
                throw new Error("Brak tokena odświeżającego");
            }

            try {
                const response = await AuthService.refreshToken(state.refreshToken);
                const rememberMe = localStorage.getItem("rememberMe") === "true";

                commit("SET_TOKENS", {
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                    rememberMe
                });

                return response.accessToken;

            } catch (error) {
                commit("LOGOUT");
                throw error;
            }
        }
    },

    getters: {
        isAuthenticated: state => !!state.user,
        isAdmin: state => state.user?.role === "admin",
        isBlocked: state => state.user?.isActive === false
    }
};
