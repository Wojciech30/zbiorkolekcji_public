export function normalizeApiError(error, fallbackMessage = "Wystąpił nieoczekiwany błąd.") {
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
                message: "Brak połączenia z serwerem. Sprawdź swoje połączenie z internetem.",
                raw: error
            };
        }

        if (error.code === "ECONNABORTED") {
            return {
                type: "timeout",
                status: null,
                code: "TIMEOUT",
                message: "Przekroczono czas oczekiwania na odpowiedź serwera. Spróbuj ponownie.",
                raw: error
            };
        }

        if (request && !response) {
            return {
                type: "network",
                status: null,
                code: "NO_RESPONSE",
                message: "Nie udało się uzyskać odpowiedzi z serwera. Spróbuj ponownie później.",
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
export function getUserFriendlyErrorMessage(error, fallbackMessage = "Wystąpił nieoczekiwany błąd.") {
    const normalized = normalizeApiError(error, fallbackMessage);
    return normalized.message || fallbackMessage;
}