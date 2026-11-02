import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import socketService from '../../services/socketService';
import { getImageUrl } from '../../lib/utils';
import { API_ENDPOINTS } from '../../config/api';
import Mascot from '../../components/Mascot';
import CharacterBadge from '../../components/CharacterBadge';

type Contact = { id: number; username: string; avatar?: string; location?: string };
type Conversation = { user: Contact; lastMessage: string; lastMessageTime: string; unreadCount: number };
type Message = { id: number; senderId: number; receiverId: number; content: string; createdAt: string; isRead?: boolean };

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

export default function Messages() {
    const user = useAuthStore(state => state.user);
    const [searchParams] = useSearchParams();
    const initialUserId = searchParams.get('userId');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selected, setSelected] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [nextBeforeId, setNextBeforeId] = useState<number | null>(null);
    const [historyBusy, setHistoryBusy] = useState(false);
    const [query, setQuery] = useState('');
    const [draft, setDraft] = useState('');
    const [listLoading, setListLoading] = useState(true);
    const [threadLoading, setThreadLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [listError, setListError] = useState('');
    const [activeMobile, setActiveMobile] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);
    const skipNextScroll = useRef(false);
    const selectedRef = useRef<Contact | null>(null);

    useEffect(() => { selectedRef.current = selected; }, [selected]);

    const loadConversations = useCallback(async () => {
        try {
            const response = await fetch(`${API_ENDPOINTS.messages}/conversations`, { headers: authHeaders() });
            if (!response.ok) throw new Error('Could not load your conversations.');
            const data = await response.json();
            setConversations(Array.isArray(data) ? data : []);
            setListError('');
        } catch (err: any) {
            setListError(err?.message || 'Conversations unavailable.');
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadConversations();
        const handleIncoming = (incoming: Message) => {
            void loadConversations();
            const current = selectedRef.current;
            if (current && (incoming.senderId === current.id || incoming.receiverId === current.id)) {
                setMessages(previous => previous.some(item => item.id === incoming.id) ? previous : [...previous, incoming]);
            }
        };
        socketService.onNewMessage(handleIncoming);
        const refreshTimer = window.setInterval(() => { if (!document.hidden) void loadConversations(); }, 30000);
        return () => { socketService.offNewMessage(); window.clearInterval(refreshTimer); };
    }, [loadConversations]);

    useEffect(() => {
        if (!initialUserId || !/^\d+$/.test(initialUserId) || listLoading) return;
        const wanted = Number(initialUserId);
        if (wanted === user?.id) return;
        const known = conversations.find(item => item.user.id === wanted);
        if (known) {
            setSelected(known.user);
            setActiveMobile(true);
            return;
        }
        let active = true;
        (async () => {
            try {
                const response = await fetch(`${API_ENDPOINTS.users}/id/${wanted}`, { headers: authHeaders() });
                if (!response.ok) throw new Error('Could not open this conversation.');
                const contact = await response.json();
                if (active && contact.id !== user?.id) { setSelected(contact); setActiveMobile(true); }
            } catch (error: any) {
                if (active) setError(error?.message || 'Recipient not found.');
            }
        })();
        return () => { active = false; };
    }, [initialUserId, listLoading, user?.id, conversations]);

    useEffect(() => {
        if (!selected) { setMessages([]); setNextBeforeId(null); return; }
        let active = true;
        setThreadLoading(true);
        setNextBeforeId(null);
        setError('');
        (async () => {
            try {
                const response = await fetch(`${API_ENDPOINTS.messages}/history/${selected.id}`, { headers: authHeaders() });
                if (!response.ok) throw new Error('Could not open messages.');
                const data = await response.json();
                if (!active) return;
                setMessages(Array.isArray(data.messages) ? data.messages : []);
                setNextBeforeId(typeof data.nextBeforeId === 'number' ? data.nextBeforeId : null);
                const mark = await fetch(`${API_ENDPOINTS.messages}/read`, { method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId: selected.id }) });
                if (mark.ok) setConversations(previous => previous.map(convo => convo.user.id === selected.id ? { ...convo, unreadCount: 0 } : convo));
            } catch (err: any) {
                if (active) setError(err?.message || 'Could not open this conversation.');
            } finally {
                if (active) setThreadLoading(false);
            }
        })();
        return () => { active = false; };
    }, [selected?.id]);

    useEffect(() => {
        if (skipNextScroll.current) { skipNextScroll.current = false; return; }
        if (activeMobile && selected) endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }, [messages.length, activeMobile, selected?.id]);

    const loadOlder = async () => {
        if (!selected || nextBeforeId === null || historyBusy) return;
        const peerId = selected.id;
        setHistoryBusy(true);
        setError('');
        try {
            const response = await fetch(`${API_ENDPOINTS.messages}/history/${peerId}?before=${nextBeforeId}`, { headers: authHeaders() });
            if (!response.ok) throw new Error('Could not load older messages.');
            const data = await response.json();
            if (selectedRef.current?.id !== peerId) return;
            skipNextScroll.current = true;
            setMessages(previous => {
                const existing = new Set(previous.map(message => message.id));
                return [...(Array.isArray(data.messages) ? data.messages.filter((message: Message) => !existing.has(message.id)) : []), ...previous];
            });
            setNextBeforeId(typeof data.nextBeforeId === 'number' ? data.nextBeforeId : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load history.');
        } finally {
            setHistoryBusy(false);
        }
    };

    const choose = (contact: Contact) => {
        setSelected(contact);
        setActiveMobile(true);
        setDraft('');
        setError('');
    };

    const send = async () => {
        const text = draft.trim();
        if (!text || !selected || sending) return;
        if (text.length > 5000) { setError('Messages must be 5,000 characters or fewer.'); return; }
        setSending(true);
        setError('');
        try {
            const response = await fetch(`${API_ENDPOINTS.messages}/send`, {
                method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: selected.id, content: text }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || 'Message could not be sent.');
            setMessages(prev => prev.some(msg => msg.id === data.id) ? prev : [...prev, data]);
            setDraft('');
            void loadConversations();
        } catch (err: any) {
            setError(err?.message || 'Could not send this message. Your text is still here.');
        } finally {
            setSending(false);
        }
    };

    const filteredConversations = conversations.filter(convo => convo.user.username.toLowerCase().includes(query.toLowerCase()) || convo.lastMessage.toLowerCase().includes(query.toLowerCase()));
    const activeConversation = conversations.some(c => c.user.id === selected?.id);

    return <div className="mx-auto max-w-[1380px] space-y-5 pb-0">
        <header className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.19em] text-[hsl(var(--accent))]"><CharacterBadge name="chika" tone="gold" size="xs" /> Your connections</p><h1 className="mt-2 font-editorial text-4xl">Messages</h1><p className="mt-2 text-sm text-muted-foreground">A quieter way to connect, one thoughtful note at a time.</p></div>
            <Link to="/dashboard/community" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold hover:bg-muted"><CharacterBadge name="lumi" tone="sage" size="xs" /> Explore writers</Link>
        </header>

        <div className="flex h-[min(74dvh,760px)] min-h-[530px] overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_14px_45px_rgba(46,50,39,.07)]">
            <aside className={`flex w-full shrink-0 flex-col border-r border-border bg-background/50 md:w-[325px] lg:w-[360px] ${activeMobile ? 'hidden md:flex' : 'flex'}`} aria-label="Conversations">
                <div className="border-b border-border p-5">
                    <div className="flex items-center justify-between"><h2 className="font-editorial text-2xl">Inbox</h2><CharacterBadge name="chika" tone="gold" size="sm" /></div>
                    <div className="relative mt-4"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search conversations…" aria-label="Search conversations" className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-primary" /></div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                    {listLoading ? <p className="p-5 text-sm text-muted-foreground">Loading conversations…</p> :
                        listError ? <div className="p-5 text-sm text-muted-foreground"><p>{listError}</p><button onClick={() => void loadConversations()} className="mt-3 font-bold underline">Try again</button></div> :
                        filteredConversations.length === 0 ? <div className="flex flex-col items-center px-5 py-12 text-center"><Mascot name="chika" className="h-28 w-28" /><p className="mt-4 font-editorial text-xl">No conversations yet</p><p className="mt-2 text-xs leading-6 text-muted-foreground">Visit a writer's profile to send your first message.</p><Link to="/dashboard/community" className="mt-5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">Explore community</Link></div> :
                        filteredConversations.map(convo => <button type="button" key={convo.user.id} onClick={() => choose(convo.user)} className={`flex w-full items-start gap-3 rounded-[19px] px-3 py-4 text-left transition-colors ${selected?.id === convo.user.id ? 'bg-[hsl(var(--surface-gold))]/55' : 'hover:bg-muted/65'}`}>
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[hsl(var(--surface-rose))] text-xl font-semibold">{convo.user.avatar ? <img src={getImageUrl(convo.user.avatar)} alt="" className="h-full w-full object-cover" /> : convo.user.username.slice(0, 1).toUpperCase()}</span>
                            <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{convo.user.username}</strong>{convo.lastMessageTime && <span className="shrink-0 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(convo.lastMessageTime), { addSuffix: false })}</span>}</span><span className="mt-1 flex items-center justify-between gap-2"><span className="line-clamp-1 text-xs leading-5 text-muted-foreground">{convo.lastMessage}</span>{convo.unreadCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{convo.unreadCount}</span>}</span></span>
                        </button>)}
                </div>
                <div className="border-t border-border bg-card px-4 py-3 text-[11px] text-muted-foreground">Private conversations • Only you and the recipient</div>
            </aside>

            <section className={`min-w-0 flex-1 flex-col bg-card ${!activeMobile ? 'hidden md:flex' : 'flex'}`} aria-label="Conversation thread">
                {selected ? <>
                    <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-4 sm:px-6">
                        <button type="button" onClick={() => setActiveMobile(false)} aria-label="Back to conversations" className="min-h-10 rounded-full px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted md:hidden">Back</button>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-[hsl(var(--surface-rose))] font-semibold">{selected.avatar ? <img src={getImageUrl(selected.avatar)} alt="" className="h-full w-full object-cover" /> : selected.username[0]?.toUpperCase()}</span>
                        <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold">{selected.username}</h2><p className="mt-1 text-xs text-muted-foreground">Your private conversation</p></div>
                        <Link to={`/dashboard/profile/${encodeURIComponent(selected.username)}`} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"><CharacterBadge name="lumi" tone="sage" size="xs" /><span className="hidden sm:inline">Profile</span></Link>
                    </header>
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-[hsl(var(--background))]/50 to-card px-4 py-6 sm:px-8">
                        {!threadLoading && nextBeforeId !== null && <div className="mb-5 text-center"><button type="button" disabled={historyBusy} onClick={() => void loadOlder()} className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-primary disabled:opacity-50">{historyBusy ? 'Loading…' : 'Load older messages'}</button></div>}
                        {threadLoading ? <p className="text-center text-sm text-muted-foreground">Opening conversation…</p> : messages.length === 0 ? <div className="mx-auto flex max-w-sm flex-col items-center py-14 text-center"><Mascot name="chika" className="h-28 w-28" /><p className="mt-5 font-editorial text-2xl">Start with a hello</p><p className="mt-2 text-sm leading-7 text-muted-foreground">Your first message could make someone's day a little brighter.</p></div> :
                            messages.map((message, index) => {
                                const mine = message.senderId === user?.id;
                                const prior = messages[index - 1];
                                const showDate = !prior || new Date(message.createdAt).toDateString() !== new Date(prior.createdAt).toDateString();
                                return <div key={message.id}>
                                    {showDate && <p className="mb-5 text-center text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">{format(new Date(message.createdAt), 'MMM d, yyyy')}</p>}
                                    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[84%] rounded-[22px] px-4 py-3 text-sm shadow-sm sm:max-w-[72%] ${mine ? 'rounded-br-[6px] bg-primary text-primary-foreground' : 'rounded-bl-[6px] border border-border bg-card text-foreground'}`}>
                                            <p className="whitespace-pre-wrap break-words leading-6">{message.content}</p>
                                            <div className={`mt-2 flex items-center justify-end gap-1.5 text-[10px] ${mine ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}><span>{format(new Date(message.createdAt), 'h:mm a')}</span>{mine && <span aria-label={message.isRead ? "Read" : "Sent"}>{message.isRead ? "Read" : "Sent"}</span>}</div>
                                        </div>
                                    </div>
                                </div>;
                            })}
                        <div ref={endRef} />
                    </div>
                    {error && <p role="alert" className="border-t border-border bg-red-50 px-5 py-2 text-xs text-red-700">{error}</p>}
                    <form onSubmit={event => { event.preventDefault(); void send(); }} className="shrink-0 border-t border-border bg-card px-4 py-4 sm:px-6">
                        <div className="flex items-end gap-2 rounded-[22px] border border-border bg-background px-3 py-2 focus-within:border-primary">
                            <textarea value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={2} maxLength={5000} placeholder={`Write something kind to ${selected.username}…`} aria-label="Your message" className="max-h-28 min-h-[45px] flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground" />
                            <button type="button" title="Add a heart" aria-label="Add a heart emoji" onClick={() => setDraft(prev => prev + ' 💌')} className="mb-1 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary"><CharacterBadge name="sely" tone="rose" size="sm" /></button>
                            <button type="submit" disabled={sending || !draft.trim()} aria-label="Send message" className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"><CharacterBadge name="piko" tone="forest" size="sm" /></button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground"><span>Enter to send • Shift+Enter for a new line</span><span>{draft.length} / 5,000</span></div>
                    </form>
                </> : <div className="flex h-full flex-col items-center justify-center px-7 text-center">
                    <Mascot name="chika" className="h-36 w-36" /><p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">A letter in a conversation</p><h2 className="mt-3 font-editorial text-3xl">Every connection starts somewhere.</h2><p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">Choose someone from your inbox, or visit a writer's profile to start a new conversation.</p><Link to="/dashboard/community" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground">Find a writer </Link>
                    {initialUserId && error && <p className="mt-4 text-xs text-red-600">{error}</p>}
                    {!activeConversation && <span className="sr-only">No conversation selected</span>}
                </div>}
            </section>
        </div>
    </div>;
}
