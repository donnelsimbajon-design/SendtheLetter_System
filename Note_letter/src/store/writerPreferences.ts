import { create } from 'zustand';

export type ThemeChoice = 'warm' | 'cool' | 'dark';
export type ReadingSize = 'normal' | 'large';

export type WriterPreferences = {
    theme: ThemeChoice;
    readingSize: ReadingSize;
    reduceMotion: boolean;
    defaultPublic: boolean;
    defaultAnonymous: boolean;
    confirmBeforePublishing: boolean;
};

const defaults: WriterPreferences = {
    theme: 'warm',
    readingSize: 'normal',
    reduceMotion: false,
    defaultPublic: false,
    defaultAnonymous: false,
    confirmBeforePublishing: true,
};

const storageKey = (userId?: number | null) => userId ? `sendtheletter-preferences-${userId}` : 'sendtheletter-preferences-guest';

function fromStorage(userId?: number | null): WriterPreferences {
    try {
        const stored = localStorage.getItem(storageKey(userId));
        const obj = stored ? JSON.parse(stored) : {};
        const oldTheme = localStorage.getItem('sendtheletter-theme');
        return {
            theme: ['warm', 'cool', 'dark'].includes(obj.theme) ? obj.theme : ['warm', 'cool', 'dark'].includes(oldTheme || '') ? oldTheme as ThemeChoice : defaults.theme,
            readingSize: obj.readingSize === 'large' ? 'large' : 'normal',
            reduceMotion: obj.reduceMotion === true,
            defaultPublic: obj.defaultPublic === true,
            defaultAnonymous: obj.defaultAnonymous === true,
            confirmBeforePublishing: obj.confirmBeforePublishing !== false,
        };
    } catch {
        return { ...defaults };
    }
}

type PreferencesState = {
    userId: number | null;
    preferences: WriterPreferences;
    loadForUser: (userId?: number | null) => void;
    change: <K extends keyof WriterPreferences>(key: K, value: WriterPreferences[K]) => void;
    restoreDefaults: () => void;
};

export const useWriterPreferences = create<PreferencesState>((set, get) => ({
    userId: null,
    preferences: fromStorage(null),
    loadForUser: (userId) => {
        const nextId = userId ?? null;
        if (get().userId === nextId) return;
        set({ userId: nextId, preferences: fromStorage(nextId) });
    },
    change: (key, value) => {
        const { userId, preferences } = get();
        const next = { ...preferences, [key]: value };
        localStorage.setItem(storageKey(userId), JSON.stringify(next));
        if (key === 'theme') localStorage.setItem('sendtheletter-theme', String(value));
        set({ preferences: next });
    },
    restoreDefaults: () => {
        const userId = get().userId;
        const next = { ...defaults };
        localStorage.setItem(storageKey(userId), JSON.stringify(next));
        localStorage.setItem('sendtheletter-theme', next.theme);
        set({ preferences: next });
    },
}));
