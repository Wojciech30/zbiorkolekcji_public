/**
 * @fileoverview Utility do obsługi błędów API
 * @description Normalizuje błędy Axios do czytelnych komunikatów.
 * Mapuje kody błędów backendu na polskie komunikaty.
 * 
 * @module utils/errorHandler
 * 
 * @exports
 * - normalizeApiError(error, fallback) - zwraca znormalizowany obiekt błędu
 * - getUserFriendlyErrorMessage(error, fallback) - zwraca string komunikatu
 */

const codeMessageMap = {
    LOGIN_MISSING_FIELDS: "Podaj login oraz hasło.",
    INVALID_CREDENTIALS: "Nieprawidłowy login lub hasło.",
    EMAIL_NOT_VERIFIED:
        "Twój adres e-mail nie został jeszcze potwierdzony. " +
        "Sprawdź swoją skrzynkę (także folder spam). " +
        "Jeśli nie masz wiadomości, spróbuj ponownie zarejestrować konto lub skontaktuj się z administratorem.",
    REGISTER_MISSING_FIELDS: "Uzupełnij nazwę użytkownika, e-mail i hasło.",
    REGISTER_INVALID_EMAIL: "Podaj poprawny adres e-mail.",
    REGISTER_USER_EXISTS:
        "Użytkownik z takim loginem lub adresem e-mail już istnieje.",
    REGISTER_PASSWORD_TOO_WEAK:
        "Hasło musi mieć co najmniej 6 znaków.",
    CHANGE_PASSWORD_MISSING_FIELDS:
        "Podaj obecne hasło oraz nowe hasło.",
    CHANGE_PASSWORD_INVALID_CURRENT:
        "Obecne hasło jest nieprawidłowe.",
    CHANGE_PASSWORD_TOO_WEAK:
        "Nowe hasło musi mieć co najmniej 6 znaków.",
    FORGOT_PASSWORD_MISSING_EMAIL: "Podaj adres e-mail.",
    PASSWORD_RESET_MISSING_TOKEN:
        "Brakuje tokena resetu hasła. Użyj ponownie linku z e-maila.",
    PASSWORD_RESET_MISSING_PASSWORD:
        "Podaj nowe hasło.",
    PASSWORD_RESET_TOO_WEAK:
        "Nowe hasło musi mieć co najmniej 6 znaków.",
    PASSWORD_RESET_INVALID:
        "Link do resetu hasła jest nieprawidłowy lub wygasł. " +
        "Poproś o nowy link resetu hasła.",
    EMAIL_VERIFICATION_MISSING_TOKEN:
        "Brakuje tokena weryfikacyjnego. Skorzystaj ponownie z linku w e-mailu.",
    EMAIL_VERIFICATION_INVALID:
        "Link do potwierdzenia e-maila jest nieprawidłowy lub wygasł. " +
        "Poproś o nowy link.",
    EMAIL_VERIFICATION_EXPIRED:
        "Link do potwierdzenia e-maila wygasł. Poproś o nowy link.",
    REFRESH_TOKEN_MISSING: "Brak tokena odświeżającego.",
    REFRESH_TOKEN_INVALID: "Token odświeżający jest nieprawidłowy.",
    REFRESH_TOKEN_EXPIRED: "Token odświeżający wygasł. Zaloguj się ponownie.",
    LOGOUT_MISSING_TOKEN: "Brak tokena odświeżającego podczas wylogowania.",
    TOKEN_GENERATION_ERROR: "Błąd po stronie serwera przy generowaniu tokenów.",
    SERVER_ERROR: "Błąd serwera. Spróbuj ponownie później."
};

export function normalizeApiError(
    error,
    fallbackMessage = "Wystąpił nieoczekiwany błąd."
) {
    if (!error) {
        return {
            type: "unknown",
            status: null,
            code: null,
            message: fallbackMessage,
            raw: error
        };
    }

    const response = error.response;
    const request = error.request;

    if (!response) {
        if (error.message === "Network Error") {
            return {
                type: "network",
                status: null,
                code: "NETWORK_ERROR",
                message:
                    "Brak połączenia z serwerem. Sprawdź swoje połączenie z internetem.",
                raw: error
            };
        }

        if (error.code === "ECONNABORTED") {
            return {
                type: "timeout",
                status: null,
                code: "TIMEOUT",
                message:
                    "Przekroczono czas oczekiwania na odpowiedź serwera. Spróbuj ponownie.",
                raw: error
            };
        }

        if (request && !response) {
            return {
                type: "network",
                status: null,
                code: "NO_RESPONSE",
                message:
                    "Nie udało się uzyskać odpowiedzi z serwera. Spróbuj ponownie później.",
                raw: error
            };
        }

        return {
            type: "unknown",
            status: null,
            code: error.code || null,
            message: fallbackMessage,
            raw: error
        };
    }

    const status = response.status;
    const data = response.data || {};

    let backendCode = data.code || data.errorCode || null;
    let backendMessage = data.message || data.error || null;

    if (Array.isArray(backendMessage)) {
        backendMessage = backendMessage.join(" ");
    }
    if (backendCode && codeMessageMap[backendCode]) {
        backendMessage = codeMessageMap[backendCode];
    }

    const defaultStatusMessages = {
        400: "Nieprawidłowe dane. Sprawdź formularz.",
        401: "Brak uprawnień lub sesja wygasła. Zaloguj się ponownie.",
        403: "Nie masz uprawnień do wykonania tej akcji.",
        404: "Nie znaleziono żądanego zasobu.",
        500: "Błąd serwera. Spróbuj ponownie później."
    };

    let message =
        backendMessage ||
        defaultStatusMessages[status] ||
        fallbackMessage;

    let type = "backend";
    if (status >= 500) type = "server";
    else if (status === 401 || status === 403) type = "auth";
    else if (status === 404) type = "not_found";
    else if (status >= 400 && status < 500) type = "validation";

    return {
        type,
        status,
        code: backendCode,
        message,
        raw: error,
        data
    };
}

export function getUserFriendlyErrorMessage(
    error,
    fallbackMessage = "Wystąpił nieoczekiwany błąd."
) {
    const normalized = normalizeApiError(error, fallbackMessage);
    return normalized.message || fallbackMessage;
}
