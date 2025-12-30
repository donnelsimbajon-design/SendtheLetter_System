// API Configuration
// Uses VITE_API_URL environment variable for production
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    auth: `${API_BASE_URL}/api/auth`,
    letters: `${API_BASE_URL}/api/letters`,
    users: `${API_BASE_URL}/api/users`,
    messages: `${API_BASE_URL}/api/messages`,
    notifications: `${API_BASE_URL}/api/notifications`,
};

export default API_BASE_URL;
