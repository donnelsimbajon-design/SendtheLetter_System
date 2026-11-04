import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { X, ArrowLeft, Send, MessageSquareText } from 'lucide-react';
import CharacterBadge from './CharacterBadge';
import Mascot from './Mascot';
import socketService from '../services/socketService';
import { API_ENDPOINTS } from '../config/api';
import { getImageUrl } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useInboxStore, type InboxContact } from '../store/inboxStore';

type ChatMessage = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead?: boolean;
  sender?: InboxContact;
};

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
const unreadLabel = (count: number) => count > 99 ? '99+' : String(count);

/**
 * A compact, real-data inbox and conversation window. Full history and
 * advanced navigation remain on the existing Messages page.
 */
export default function MessageDock() {
  const user = useAuthStore(state => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const conversations = useInboxStore(state => state.conversations);
  const loading = useInboxStore(state => state.loading);
  const error = useInboxStore(state => state.error);
  const refresh = useInboxStore(state => state.refresh);
  const markRead = useInboxStore(state => state.markRead);
  const reset = useInboxStore(state => state.reset);
  const unread = conversations.reduce((sum, item) => sum + Math.max(0, item.unreadCount || 0), 0);

  const [isOpen, setOpen] = useState(false);
  const [selected, setSelected] = useState<InboxContact | null>(null);
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [threadError, setThreadError] = useState('');
  const [incomingPreview, setIncomingPreview] = useState<{ sender: InboxContact; content: string } | null>(null);
  const selectedRef = useRef<InboxContact | null>(null);
  const openRef = useRef(false);
  const conversationsRef = useRef(conversations);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { openRef.current = isOpen; }, [isOpen]);
  useEffect(() => {
    if (location.pathname === '/dashboard/messages') {
      setIncomingPreview(null);
      setOpen(false);
    }
  }, [location.pathname]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => {
    if (!user?.id) { reset(); return; }
    void refresh();
    const poll = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 30000);
    const onIncoming = (message: ChatMessage) => {
      if (message.receiverId !== user.id && message.senderId !== user.id) return;
      void refresh();
      const peerId = message.senderId === user.id ? message.receiverId : message.senderId;
      if (selectedRef.current?.id === peerId) {
        setThread(previous => previous.some(item => item.id === message.id) ? previous : [...previous, message]);
      }
      if (message.receiverId === user.id) {
        if (openRef.current && selectedRef.current?.id === peerId) {
          void fetch(`${API_ENDPOINTS.messages}/read`, {
            method: 'POST',
            headers: { ...headers(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: peerId }),
          }).then(result => {
            if (result.ok) { markRead(peerId); void refresh(); }
          }).catch(() => { /* Polling will recover if marking read fails. */ });
        } else if (location.pathname !== '/dashboard/messages') {
          const contact = conversationsRef.current.find(item => item.user.id === peerId)?.user
            || message.sender
            || { id: peerId, username: 'A writer' };
          setIncomingPreview({ sender: contact, content: message.content });
        }
      }
    };
    socketService.onNewMessage(onIncoming);
    return () => {
      window.clearInterval(poll);
      socketService.offNewMessage(onIncoming);
    };
  }, [user?.id, refresh, reset, markRead, location.pathname]);

  const openContact = useCallback((contact: InboxContact) => {
    setSelected(contact);
    setDraft('');
    setThreadError('');
    setIncomingPreview(null);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!selected?.id || !isOpen) return;
    let alive = true;
    setThreadLoading(true);
    setThreadError('');
    (async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.messages}/history/${selected.id}`, { headers: headers() });
        if (!response.ok) throw new Error('Unable to open this chat.');
        const data = await response.json();
        if (!alive) return;
        setThread(Array.isArray(data.messages) ? data.messages : []);
        const readResponse = await fetch(`${API_ENDPOINTS.messages}/read`, {
          method: 'POST',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderId: selected.id }),
        });
        if (alive && readResponse.ok) {
          markRead(selected.id);
          void refresh();
        }
      } catch (cause) {
        if (alive) setThreadError(cause instanceof Error ? cause.message : 'Chat is unavailable.');
      } finally {
        if (alive) setThreadLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [selected?.id, isOpen, markRead, refresh]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [thread.length, isOpen, selected?.id]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!selected || !text || sending) return;
    setSending(true);
    setThreadError('');
    try {
      const response = await fetch(`${API_ENDPOINTS.messages}/send`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: selected.id, content: text }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not send this message.');
      setThread(previous => previous.some(item => item.id === data.id) ? previous : [...previous, data]);
      setDraft('');
      void refresh();
    } catch (cause) {
      setThreadError(cause instanceof Error ? cause.message : 'Message was not sent.');
    } finally {
      setSending(false);
    }
  };

  const inFullInbox = location.pathname === '/dashboard/messages';

  return (
    <>
      {incomingPreview && !inFullInbox && (
        <div role="status" aria-live="polite" className="fixed right-4 top-20 z-[65] w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-3 shadow-xl lg:bottom-24 lg:right-6 lg:top-auto">
          <div className="flex items-start gap-3">
            <CharacterBadge name="chika" tone="paper" size="sm" />
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => {
              if (window.innerWidth < 1024) {
                setIncomingPreview(null);
                navigate(`/dashboard/messages?userId=${incomingPreview.sender.id}`);
              } else openContact(incomingPreview.sender);
            }}>
              <span className="block truncate text-sm font-bold">New message from {incomingPreview.sender.username}</span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">{incomingPreview.content}</span>
              <span className="mt-1 block text-[11px] font-semibold underline underline-offset-2">Open chat</span>
            </button>
            <button type="button" onClick={() => setIncomingPreview(null)} className="rounded-full p-1.5 hover:bg-muted" aria-label="Dismiss message preview"><X size={16} /></button>
          </div>
        </div>
      )}

      {!inFullInbox && (
        <div className="fixed bottom-6 right-6 z-[55] hidden lg:block">
          {isOpen && (
            <section aria-label={selected ? `Chat with ${selected.username}` : 'Recent messages'} className="mb-3 flex h-[min(550px,calc(100dvh-8rem))] w-[360px] flex-col overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-2xl workspace-page-enter">
              <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
                {selected && <button type="button" onClick={() => { setSelected(null); setThreadError(''); }} aria-label="Back to inbox" className="rounded-full p-2 hover:bg-muted"><ArrowLeft size={18} /></button>}
                <CharacterBadge name="chika" tone="paper" size="sm" />
                <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold">{selected?.username || 'Messages'}</h2><p className="text-[11px] text-muted-foreground">{selected ? 'Private conversation' : `${unread} unread ${unread === 1 ? 'message' : 'messages'}`}</p></div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close chat window" className="rounded-full p-2 hover:bg-muted"><X size={18} /></button>
              </header>

              {!selected ? (
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                  {loading && conversations.length === 0 && <p className="p-4 text-sm text-muted-foreground">Loading inbox…</p>}
                  {error && <p role="alert" className="p-3 text-sm text-destructive">{error} <button type="button" onClick={() => void refresh()} className="underline">Retry</button></p>}
                  {!loading && !error && conversations.length === 0 && <div className="flex flex-col items-center px-5 py-10 text-center"><Mascot name="chika" className="h-20 w-20" /><p className="mt-3 font-editorial text-xl">No conversations yet</p><p className="mt-2 text-xs text-muted-foreground">Say hello to a writer in the community.</p></div>}
                  {conversations.map(conversation => <button key={conversation.user.id} type="button" onClick={() => openContact(conversation.user)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
                    {conversation.user.avatar ? <img src={getImageUrl(conversation.user.avatar)} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <CharacterBadge name="chika" tone="paper" size="sm" />}
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{conversation.user.username}</span><span className="block truncate text-xs text-muted-foreground">{conversation.lastMessage || 'Open conversation'}</span></span>
                    {conversation.unreadCount > 0 && <span className="min-w-5 rounded-full bg-primary px-1.5 py-1 text-center text-[10px] font-bold text-primary-foreground">{unreadLabel(conversation.unreadCount)}</span>}
                  </button>)}
                </div>
              ) : (
                <>
                  <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-background/40 p-4" aria-live="polite">
                    {threadLoading && <p className="text-center text-xs text-muted-foreground">Opening chat…</p>}
                    {!threadLoading && !thread.length && <p className="py-8 text-center text-xs text-muted-foreground">Start with a hello.</p>}
                    {thread.map(message => (
                      <div key={message.id} className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.senderId === user?.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground'}`}>
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <p className="mt-1 text-[10px] opacity-70">{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {threadError && <p role="alert" className="border-t border-border px-4 py-2 text-xs text-destructive">{threadError}</p>}
                  <form onSubmit={event => void send(event)} className="flex shrink-0 items-center gap-2 border-t border-border p-3">
                    <input type="text" value={draft} onChange={event => setDraft(event.target.value)} maxLength={5000} aria-label="Write a message" placeholder="Write a message…" className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30" />
                    <button type="submit" disabled={sending || !draft.trim()} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"><Send size={17} /></button>
                  </form>
                </>
              )}

              <div className="flex shrink-0 items-center justify-center border-t border-border px-4 py-2">
                <Link to={selected ? `/dashboard/messages?userId=${selected.id}` : '/dashboard/messages'} onClick={() => setOpen(false)} className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"><MessageSquareText size={15} /> Open full inbox</Link>
              </div>
            </section>
          )}
          <button type="button" onClick={() => { setOpen(current => !current); setIncomingPreview(null); }} aria-expanded={isOpen} aria-label={unread > 0 ? `Messages, ${unread} unread` : 'Open messages'} className="relative ml-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card shadow-lg transition-transform hover:-translate-y-1 active:scale-95 motion-reduce:transform-none">
            <Mascot name="chika" className="h-11 w-11" />
            {unread > 0 && <span className="absolute -right-1 -top-1 min-w-6 rounded-full bg-primary px-1.5 py-1 text-[10px] font-bold text-primary-foreground">{unreadLabel(unread)}</span>}
          </button>
        </div>
      )}
    </>
  );
}
