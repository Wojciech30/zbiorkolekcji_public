import axios from "axios";
import store from "@/store";
import { useToast } from "vue-toastification";
import { normalizeApiError } from "@/utils/errorHandler";

const toast = useToast();

const apiClient = axios.create({
    baseURL:
        process.env.VUE_APP_API_BASE_URL ||
        "http://172.23.52.141:3000/api/v1",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        "X-Client-Version": process.env.VUE_APP_VERSION || "1.0.0"
    }
});


apiClient.interceptors.request.use(
    (config) => {
        const token = store.state.auth?.accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        const url = originalRequest?.url || "";
        const isAuthLogin = url.includes("/auth/login");
        const isAuthRegister = url.includes("/auth/register");
        const isAuthRefresh = url.includes("/auth/refresh");

        if (
            status === 401 &&
            !originalRequest._retry &&
            !isAuthLogin &&
            !isAuthRegister &&
            !isAuthRefresh
        ) {
            originalRequest._retry = true;

            try {
                const accessToken = await store.dispatch("auth/refreshToken");
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                const { message } = normalizeApiError(
                    refreshError,
                    "Twoja sesja wygasła. Zaloguj się ponownie."
                );

                toast.error(message);

                await store.dispatch("auth/logout");

                return Promise.reject(refreshError);
            }
        }

        const normalized = normalizeApiError(
            error,
            "Wystąpił błąd podczas komunikacji z serwerem."
        );

        if (
            ["network", "timeout", "server"].includes(normalized.type)
        ) {
            toast.error(normalized.message);
        }

        if (
            status === 401 &&
            !isAuthLogin &&
            !isAuthRegister &&
            !isAuthRefresh
        ) {
            await store.dispatch("auth/logout");
        }

        return Promise.reject(error);
    }
);

export default apiClient;
