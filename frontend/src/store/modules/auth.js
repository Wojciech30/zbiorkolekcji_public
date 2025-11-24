import AuthService from "@/services/AuthService";
import router from "@/router";

export default {
    namespaced: true,
    state: () => ({
        user: (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })(),
        accessToken: localStorage.getItem("accessToken"),
        refreshToken: localStorage.getItem("refreshToken")
    }),
    mutations: {
        SET_USER(state, user) {
            state.user = user;
            if (user) localStorage.setItem("user", JSON.stringify(user));
            else localStorage.removeItem("user");
        },
        SET_TOKENS(state, { accessToken, refreshToken }) {
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            if (accessToken) localStorage.setItem("accessToken", accessToken);
            else localStorage.removeItem("accessToken");
            if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
            else localStorage.removeItem("refreshToken");
        },
        LOGOUT(state) {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            // Usuń tylko klucze auth, nie czyść całego localStorage
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
        }
    },
    actions: {
        async login({ commit }, credentials) {
            try {
                const response = await AuthService.login(credentials);

                if (!response?.accessToken || !response?.refreshToken) {
                    throw new Error('Nieprawidłowa odpowiedź serwera');
                }

                commit("SET_TOKENS", {
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken
                });
                commit("SET_USER", response.user);

                return response;
            } catch (error) {
                throw new Error(
                    error.response?.data?.message
                    || error.message
                    || "Błąd logowania"
                );
            }
        },

        async logout({ commit, state }) {
            // opcjonalnie wywołaj endpoint logout na backendzie
            try {
                if (state.refreshToken) {
                    await AuthService.logout(state.refreshToken).catch(() => {});
                }
            } catch {
                // ignoruj błędy podczas wylogowywania
            }
            commit('LOGOUT');
            await router.push({ name: 'Login' }).catch(() => {});
        },

        async refreshToken({ commit, state }) {
            if (!state.refreshToken) throw new Error("Brak tokena odświeżającego");

            try {
                const response = await AuthService.refreshToken(state.refreshToken);
                commit("SET_TOKENS", {
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken
                });
                return response.accessToken;
            } catch (error) {
                commit('LOGOUT');
                throw error;
            }
        }
    },
    getters: {
        isAuthenticated: state => !!state.user,
        isAdmin: state => state.user?.role === "admin"
    }
};