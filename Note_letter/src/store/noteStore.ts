import { create } from 'zustand';
import { Note } from '../types/note';

export type { Note };

export interface Notification {
    id: number;
    userId: number;
    actorId: number;
    type: 'comment' | 'like';
    entityId: number;
    isRead: boolean;
    createdAt: string;
    actor?: {
        id: number;
        username: string;
    };
    letter?: {
        id: number;
        title: string;
    };
}

interface NoteState {
    notes: Note[];
    drafts: Note[];
    publicLetters: Note[];
    userPublicLetters: Note[];
    notifications: Notification[];
    isLoading: boolean;
    error: string | null;
    fetchMyLetters: () => Promise<void>;
    fetchDrafts: () => Promise<void>;
    fetchPublicLetters: () => Promise<void>;
    fetchUserPublicLetters: (username: string | number) => Promise<void>;
    addNote: (note: Omit<Note, 'id' | 'createdAt' | 'authorId'>) => Promise<void>;
    deleteNote: (id: string) => void;
    updateNote: (id: string, updates: Partial<Note>) => void;
    toggleReaction: (noteId: string, reaction: string) => void;
    addComment: (letterId: string, content: string) => Promise<void>;
    deleteComment: (letterId: string, commentId: string) => Promise<void>;
    fetchComments: (letterId: string) => Promise<void>;
    toggleLike: (letterId: string) => Promise<void>;
    fetchNotifications: () => Promise<void>;
    markNotificationsRead: () => Promise<void>;
}

const API_URL = 'http://localhost:5000/api/letters';

export const useNoteStore = create<NoteState>((set, get) => ({
    notes: [],
    drafts: [],
    publicLetters: [],
    userPublicLetters: [],
    notifications: [],
    isLoading: false,
    error: null,

    fetchMyLetters: async () => {
        set({ isLoading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/mine`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch letters');
            const data = await response.json();
            set({ notes: data });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchDrafts: async () => {
        set({ isLoading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/drafts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch drafts');
            const data = await response.json();
            set({ drafts: data });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchPublicLetters: async () => {
        set({ isLoading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/public`, { headers });
            if (!response.ok) throw new Error('Failed to fetch public letters');
            const data = await response.json();
            set({ publicLetters: data });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchUserPublicLetters: async (username: string | number) => {
        set({ isLoading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/user/${username}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch user public letters');
            const data = await response.json();
            set({ userPublicLetters: data });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    addNote: async (noteData) => {
        set({ isLoading: true, error: null });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(noteData),
            });
            if (!response.ok) throw new Error('Failed to create letter');
            const newLetter = await response.json();

            // Update stores based on visibility
            set((state) => {
                const updates: Partial<NoteState> = {};
                updates.notes = [newLetter.letter, ...state.notes];
                if (noteData.isPublic) {
                    updates.publicLetters = [newLetter.letter, ...state.publicLetters];
                }
                return updates;
            });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        publicLetters: state.publicLetters.filter((n) => n.id !== id)
    })),

    updateNote: (id, updates) =>
        set((state) => ({
            notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
            publicLetters: state.publicLetters.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        })),

    toggleReaction: (noteId, reaction) =>
        set((state) => {
            const updateList = (list: Note[]) => list.map((n) => {
                if (n.id !== noteId) return n;
                const currentCount = n.reactions[reaction] || 0;
                return {
                    ...n,
                    reactions: { ...n.reactions, [reaction]: currentCount + 1 },
                };
            });

            return {
                notes: updateList(state.notes),
                publicLetters: updateList(state.publicLetters),
            };
        }),

    addComment: async (letterId, content) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/${letterId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content }),
            });
            if (!response.ok) throw new Error('Failed to add comment');
            await get().fetchComments(letterId);
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    deleteComment: async (letterId, commentId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/${letterId}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to delete comment');
            await get().fetchComments(letterId);
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    fetchComments: async (letterId) => {
        try {
            const response = await fetch(`${API_URL}/${letterId}/comments`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            const comments = await response.json();
            set((state) => ({
                publicLetters: state.publicLetters.map((letter) =>
                    String(letter.id) === String(letterId) ? { ...letter, comments } : letter
                ),
                userPublicLetters: state.userPublicLetters.map((letter) =>
                    String(letter.id) === String(letterId) ? { ...letter, comments } : letter
                ),
            }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    toggleLike: async (letterId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/${letterId}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to toggle like');
            const { liked, likeCount } = await response.json();
            set((state) => ({
                publicLetters: state.publicLetters.map((letter) =>
                    letter.id === letterId
                        ? { ...letter, isLikedByUser: liked, likeCount }
                        : letter
                ),
                userPublicLetters: state.userPublicLetters.map((letter) =>
                    letter.id === letterId
                        ? { ...letter, isLikedByUser: liked, likeCount }
                        : letter
                ),
                notes: state.notes.map((letter) =>
                    letter.id === letterId
                        ? { ...letter, isLikedByUser: liked, likeCount }
                        : letter
                ),
            }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    fetchNotifications: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch notifications');
            const data = await response.json();
            set({ notifications: data });
        } catch (error: any) {
            console.error('Error fetching notifications:', error);
        }
    },

    markNotificationsRead: async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5000/api/notifications/read', {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true }))
            }));
        } catch (error: any) {
            console.error('Error marking notifications read:', error);
        }
    },
}));
