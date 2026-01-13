// Helper do generowania URL-i obrazków z backendu
const API_BASE = process.env.VUE_APP_API_BASE_URL || "http://172.23.52.141:3000/api/v1";
const BACKEND_URL = API_BASE.replace('/api/v1', '');

/**
 * Konwertuje relatywny URL obrazka na pełny URL backendu
 * @param {string} url - relatywny lub pełny URL obrazka
 * @returns {string} pełny URL obrazka
 */
export function getImageUrl(url) {
    if (!url) return '';

    // Jeśli już pełny URL (http/https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Jeśli relatywny URL zaczynający się od /uploads
    if (url.startsWith('/uploads')) {
        return `${BACKEND_URL}${url}`;
    }

    // Inne relatywne URLe
    if (url.startsWith('/')) {
        return `${BACKEND_URL}${url}`;
    }

    return url;
}

export default {
    getImageUrl
};
