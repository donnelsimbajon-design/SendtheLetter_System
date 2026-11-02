import { create } from 'zustand';
import socketService from '../services/socketService';
import { API_ENDPOINTS } from '../config/api';

interface User {
    id: number;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    coverImage?: string;
    location?: string;
    role: 'user' | 'admin';
    isActive: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isVerifying: boolean;
    sessionNotice: string | null;
    verifySession: () => Promise<void>;
    login: (credentials: any) => Promise<void>;
    register: (credentials: any) => Promise<void>;
    updateProfile: (data: any) => Promise<void>;
    logout: () => void;
}

const API_URL = API_ENDPOINTS.auth;

const readStoredUser = (): User | null => {
    try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) as User : null;
    } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return null;
    }
};

const readResponse = async (response: Response) => {
    const text = await response.text();
    try { return text ? JSON.parse(text) : {}; }
    catch { throw new Error('The server returned an unreadable response. Please try again.'); }
};

export const useAuthStore = create<AuthState>((set, get) => ({
    user: readStoredUser(),
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    isVerifying: !!localStorage.getItem('token'),
    sessionNotice: null,

    verifySession: async () => {
        const token = get().token;
        if (!token) { set({ isVerifying: false, isAuthenticated: false }); return; }
        set({ isVerifying: true });
        const abort = new AbortController();
        const timeout = window.setTimeout(() => abort.abort(), 10000);
        try {
            const response = await fetch(`${API_URL}/session`, { headers: { Authorization: `Bearer ${token}` }, signal: abort.signal });
            if (get().token !== token) return;
            if (response.ok) {
                const data = await readResponse(response);
                localStorage.setItem('user', JSON.stringify(data.user));
                set({ user: data.user, isAuthenticated: true, isVerifying: false, sessionNotice: null });
                return;
            }
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                socketService.disconnect();
                set({ token: null, user: null, isAuthenticated: false, isVerifying: false, sessionNotice: 'Your sign-in expired. Please sign in again to continue.' });
                return;
            }
            // Temporary server errors should not unexpectedly sign someone out.
            set({ isVerifying: false, sessionNotice: 'Connection unavailable. Your local session was kept; try again when online.' });
        } catch {
            if (get().token === token) set({ isVerifying: false, sessionNotice: 'Could not verify your session while offline. You have not been signed out.' });
        } finally {
            window.clearTimeout(timeout);
        }
    },

    login: async (credentials) => {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            set({ user: data.user, token: data.token, isAuthenticated: true, isVerifying: false, sessionNotice: null });

            // Connect to socket
            socketService.connect(data.user.id, data.token);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    register: async (credentials) => {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            set({ user: data.user, token: data.token, isAuthenticated: true });

            // Connect to socket
            socketService.connect(data.user.id, data.token);
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    updateProfile: async (data) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const resData = await readResponse(response);

            if (!response.ok) {
                throw new Error(resData.message || 'Profile update failed');
            }

            localStorage.setItem('user', JSON.stringify(resData.user));
            set({ user: resData.user });
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false, isVerifying: false, sessionNotice: null });

        // Disconnect socket
        socketService.disconnect();
    },
}));
