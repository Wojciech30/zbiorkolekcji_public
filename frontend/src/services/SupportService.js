/**
 * @fileoverview Serwis API wsparcia/feedbacku
 * @description Obsługa zgłoszeń problemów od użytkowników.
 * 
 * @module services/SupportService
 * 
 * @methods
 * - reportProblem({subject, message, screenshotUrl}) - zgłoszenie problemu
 */

import apiClient from './apiClient';

export default {
    reportProblem({ subject, message, screenshotUrl }) {
        return apiClient.post('/support/report', { subject, message, screenshotUrl });
    }
};
