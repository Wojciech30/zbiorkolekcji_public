import AuthService from "@/services/AuthService";
import router from "@/router";

export default {
    namespaced: true,
    state: () => ({
        user: JSON.parse(localStorage.getItem("user")),
        accessToken: localStorage.getItem("accessToken"),
        refreshToken: localStorage.getItem("refreshToken")
    }),
    mutations: {
        SET_USER(state, user) {
            state.user = user;
            localStorage.setItem("user", JSON.stringify(user));
        },
        SET_TOKENS(state, { accessToken, refreshToken }) {
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
        },
        LOGOUT(state) {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            localStorage.clear();
        }
    },
    actions: {
        async login({ commit }, credentials) {
            try {
                const response = await AuthService.login(credentials);

                if (!response?.accessToken || !response.refreshToken) {
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

        async logout({ commit }) {
            commit('LOGOUT');
            router.push('/login').catch(() => {});
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