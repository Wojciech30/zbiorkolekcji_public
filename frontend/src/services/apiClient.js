/**
 * @fileoverview Klient API (axios)
 * @description Konfiguracja axios z interceptorami dla autoryzacji JWT,
 * automatycznego odświeżania tokenów i obsługi błędów.
 */

import axios from "axios";
import store from "@/store";
import { useToast } from "vue-toastification";
import { normalizeApiError } from "@/utils/errorHandler";

const toast = useToast();

/**
 * Główny klient API
 * @description Używany przez wszystkie serwisy do komunikacji z backendem
 * - baseURL: z env VUE_APP_API_BASE_URL lub domyślny
 * - timeout: 10 sekund
 * - automatyczne dodawanie tokena JWT
 * - automatyczne odświeżanie wygasłego tokena
 */
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


/**
 * Request interceptor - dodaje token JWT do nagłówka Authorization
 */
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

/**
 * Response interceptor - obsługuje błędy i automatyczne odświeżanie tokena
 * 
 * Logika dla 401 Unauthorized:
 * 1. Pomija retry dla /auth/login, /auth/register, /auth/refresh
 * 2. Próbuje odświeżyć token przez store.dispatch("auth/refreshToken")
 * 3. Jeśli sukces - powtarza oryginalne żądanie z nowym tokenem
 * 4. Jeśli błąd - wylogowuje użytkownika i pokazuje toast
 */
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // Nie próbuje odświeżać tokena dla endpointów autoryzacji
        const url = originalRequest?.url || "";
        const isAuthLogin = url.includes("/auth/login");
        const isAuthRegister = url.includes("/auth/register");
        const isAuthRefresh = url.includes("/auth/refresh");
        
        // Sprawdź czy użytkownik jest zalogowany (ma refreshToken)
        const hasRefreshToken = !!store.state.auth?.refreshToken;

        // Automatyczne odświeżanie tokena przy 401 (tylko dla zalogowanych)
        if (
            status === 401 &&
            hasRefreshToken &&
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

        // Normalizuj błąd i pokaż toast dla błędów sieciowych/serwera
        const normalized = normalizeApiError(
            error,
            "Wystąpił błąd podczas komunikacji z serwerem."
        );

        if (
            ["network", "timeout", "server"].includes(normalized.type)
        ) {
            toast.error(normalized.message);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
