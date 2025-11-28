import { create } from 'zustand';
import { Note } from '../types/note';

export type { Note };

interface NoteState {
    notes: Note[];
    addNote: (note: Note) => void;
    deleteNote: (id: string) => void;
    updateNote: (id: string, updates: Partial<Note>) => void;
    toggleReaction: (noteId: string, reaction: string) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
    notes: [],
    addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
    deleteNote: (id) => set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
    updateNote: (id, updates) =>
        set((state) => ({
            notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        })),
    toggleReaction: (noteId, reaction) =>
        set((state) => ({
            notes: state.notes.map((n) => {
                if (n.id !== noteId) return n;
                const currentCount = n.reactions[reaction] || 0;
                return {
                    ...n,
                    reactions: { ...n.reactions, [reaction]: currentCount + 1 },
                };
            }),
        })),
}));
