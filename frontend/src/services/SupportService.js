import apiClient from './apiClient';

export default {
    reportProblem({ subject, message, screenshotUrl }) {
        return apiClient.post('/support/report', { subject, message, screenshotUrl });
    }
};
