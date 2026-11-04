import { create } from 'zustand';
import { API_ENDPOINTS } from '../config/api';

export type InboxContact = { id: number; username: string; avatar?: string };
export type InboxConversation = {
  user: InboxContact;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
};

type InboxState = {
  conversations: InboxConversation[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markRead: (userId: number) => void;
  reset: () => void;
};

/** One unread-message source for desktop rail, mobile navigation and chat dock. */
export const useInboxStore = create<InboxState>((set) => ({
  conversations: [],
  loading: false,
  error: null,
  refresh: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ conversations: [], loading: false, error: null });
      return;
    }
    set({ loading: true });
    try {
      const response = await fetch(`${API_ENDPOINTS.messages}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Messages are temporarily unavailable.');
      const data: unknown = await response.json();
      set({
        conversations: Array.isArray(data) ? data as InboxConversation[] : [],
        loading: false,
        error: null,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load messages.',
      });
    }
  },
  markRead: (userId) => set((state) => ({
    conversations: state.conversations.map((conversation) =>
      conversation.user.id === userId ? { ...conversation, unreadCount: 0 } : conversation
    ),
  })),
  reset: () => set({ conversations: [], loading: false, error: null }),
}));
