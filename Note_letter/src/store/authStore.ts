import { create } from 'zustand';
import socketService from '../services/socketService';

interface User {
    id: number;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    coverImage?: string;
    location?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (credentials: any) => Promise<void>;
    register: (credentials: any) => Promise<void>;
    updateProfile: (data: any) => Promise<void>;
    logout: () => void;
}

const API_URL = 'http://localhost:5000/api/auth';

export const useAuthStore = create<AuthState>((set) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),

    login: async (credentials) => {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            set({ user: data.user, token: data.token, isAuthenticated: true });

            // Connect to socket
            socketService.connect(data.user.id);
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            set({ user: data.user, token: data.token, isAuthenticated: true });

            // Connect to socket
            socketService.connect(data.user.id);
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

            const resData = await response.json();

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
        set({ user: null, token: null, isAuthenticated: false });

        // Disconnect socket
        socketService.disconnect();
    },
}));
