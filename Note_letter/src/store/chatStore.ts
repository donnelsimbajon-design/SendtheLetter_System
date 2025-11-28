import { create } from 'zustand';
import { Message } from '../types/chat';

interface ChatState {
    messages: Message[];
    sendMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    sendMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));
