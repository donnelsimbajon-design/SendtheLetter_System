import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Gift, ImagePlus, MessageCircle, PanelLeftClose, Send, Sparkles, UserRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { getImageUrl } from '../lib/utils';
import { useAuthStore } from '../store/authStore';

type Entry = {
    id: string;
    kind: 'comment' | 'gift';
    source: 'guest' | 'account';
    displayName: string;
    avatar: string | null;
    content: string | null;
    imageData: string | null;
    reaction: string | null;
    createdAt: string;
};
type GiftTotal = { reaction: string; count: number };

const gifts = [
    { key: 'heart', emoji: '❤️', label: 'Love' },
    { key: 'flower', emoji: '🌸', label: 'Flower' },
    { key: 'star', emoji: '🌟', label: 'Star' },
    { key: 'hug', emoji: '🤗', label: 'Hug' },
    { key: 'sparkles', emoji: '✨', label: 'Sparkles' },
];

type Props = {
    shareToken?: string;
    letterId?: string | number;
    actions?: React.ReactNode;
    onCollapse?: () => void;
    onCommentCountChange?: (count: number) => void;
    className?: string;
};

export default function CommentsPanel({ shareToken, letterId, actions, onCollapse, onCommentCountChange, className = '' }: Props) {
    const user = useAuthStore(state => state.user);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const publicToken = !!shareToken && /^[a-f0-9]{48}$/.test(shareToken);
    const endpoint = publicToken
        ? `${API_ENDPOINTS.letters}/public/${encodeURIComponent(shareToken!)}/thread`
        : `${API_ENDPOINTS.letters}/${encodeURIComponent(String(letterId || ''))}/comments`;
    const [mode, setMode] = useState<'account' | 'guest'>(isAuthenticated && user ? 'account' : 'guest');
    const [tab, setTab] = useState<'comments' | 'gifts'>('comments');
    const [nickname, setNickname] = useState(() => localStorage.getItem('stl_guest_name') || '');
    const [comment, setComment] = useState('');
    const [imageData, setImageData] = useState<string | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [totals, setTotals] = useState<GiftTotal[]>([]);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const uploadRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMode(isAuthenticated && user ? 'account' : 'guest');
    }, [isAuthenticated, user?.id]);

    const refresh = useCallback(async (silent = false) => {
        if (!publicToken && !letterId) return;
        if (!silent) setLoading(true);
        try {
            const response = await axios.get(endpoint);
            if (publicToken) {
                const list: Entry[] = Array.isArray(response.data.entries) ? response.data.entries : [];
                setEntries(list);
                setTotals(Array.isArray(response.data.totals) ? response.data.totals : []);
                onCommentCountChange?.(Number(response.data.commentCount) || 0);
            } else {
                const list: Entry[] = Array.isArray(response.data) ? response.data.map((c: any) => ({
                    id: `member-${c.id}`,
                    kind: 'comment',
                    source: 'account',
                    displayName: c.user?.username || 'Member',
                    avatar: c.user?.avatar || null,
                    content: c.content,
                    imageData: null,
                    reaction: null,
                    createdAt: c.createdAt,
                })) : [];
                setEntries(list);
                setTotals([]);
                onCommentCountChange?.(list.length);
            }
        } catch {
            if (!silent) setFeedback('Could not load comments. Please retry.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [endpoint, publicToken, letterId, onCommentCountChange]);

    useEffect(() => {
        void refresh();
        const interval = window.setInterval(() => { if (!document.hidden) void refresh(true); }, 20000);
        return () => window.clearInterval(interval);
    }, [refresh]);

    const handlePhoto = (file?: File) => {
        if (!file) return;
        if (!publicToken) { setFeedback('Photo reviews are available on public letters.'); return; }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
            setFeedback('Choose a JPG, PNG or WebP under 8 MB.');
            return;
        }
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, 900 / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const context = canvas.getContext('2d');
            if (!context) { URL.revokeObjectURL(url); return; }
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            let quality = 0.78;
            let data = canvas.toDataURL('image/jpeg', quality);
            while (data.length > 460000 && quality > 0.32) {
                quality -= 0.1;
                data = canvas.toDataURL('image/jpeg', quality);
            }
            URL.revokeObjectURL(url);
            if (data.length > 460000) { setFeedback('Photo is too large. Try a smaller image.'); return; }
            setImageData(data);
            setFeedback('');
        };
        img.onerror = () => { URL.revokeObjectURL(url); setFeedback('Could not read this photo.'); };
        img.src = url;
    };

    const send = async (kind: 'comment' | 'gift', reaction?: string) => {
        if (sending) return;
        if (mode === 'account' && (!isAuthenticated || !user)) {
            setFeedback('Please log in first to post with your account.');
            return;
        }
        if (mode === 'guest' && (!publicToken || nickname.trim().length < 2 || nickname.trim().length > 40)) {
            setFeedback(publicToken ? 'Guest nickname must be 2–40 characters.' : 'Guest comments are only available on public letters.');
            return;
        }
        if (kind === 'comment' && !comment.trim() && !imageData) {
            setFeedback('Write a comment or add a photo.');
            return;
        }
        setSending(true);
        setFeedback('');
        try {
            const token = localStorage.getItem('token');
            const headers = mode === 'account' && token ? { Authorization: `Bearer ${token}` } : undefined;
            if (publicToken) {
                await axios.post(endpoint, {
                    mode,
                    kind,
                    ...(mode === 'guest' ? { displayName: nickname.trim() } : {}),
                    ...(kind === 'comment' ? { content: comment.trim(), imageData } : { reaction }),
                }, { headers });
            } else {
                await axios.post(endpoint, { content: comment.trim() }, { headers });
            }
            if (mode === 'guest') localStorage.setItem('stl_guest_name', nickname.trim());
            setComment('');
            setImageData(null);
            setFeedback(kind === 'gift' ? 'Gift sent! ✨' : 'Comment posted! 💌');
            await refresh(true);
        } catch (error: any) {
            setFeedback(error?.response?.data?.message || 'Unable to post. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const commentCount = entries.filter(entry => entry.kind === 'comment').length;
    const giftCount = totals.reduce((sum, item) => sum + Number(item.count || 0), 0);

    return <section className={`flex h-full min-h-0 w-full flex-col overflow-hidden bg-white text-[#28362f] ${className}`} aria-label="Comments and gift reactions">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stone-100 bg-white px-4 py-4">
            <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-semibold">Comments</h2>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">{commentCount}</span>
            </div>
            <div className="flex items-center gap-3 text-stone-500">
                {actions}
                {onCollapse && <button type="button" onClick={onCollapse} title="Hide comments" aria-label="Hide comments" className="rounded-full p-1 hover:bg-stone-100 hover:text-stone-800"><PanelLeftClose size={19} /></button>}
            </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {publicToken && <div className="flex gap-2 border-b border-stone-100 px-4 py-3">
                <button type="button" onClick={() => setTab('comments')} className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${tab === 'comments' ? 'bg-[#283f36] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}><MessageCircle size={14} className="mr-1 inline" /> Comments</button>
                <button type="button" onClick={() => setTab('gifts')} className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${tab === 'gifts' ? 'bg-[#283f36] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}><Gift size={14} className="mr-1 inline" /> Gifts {giftCount ? `· ${giftCount}` : ''}</button>
            </div>}
            {tab === 'comments' || !publicToken ? <div className="space-y-4 p-4">
                {loading ? <p className="py-16 text-center text-sm text-stone-400">Loading comments…</p> :
                    entries.filter(entry => entry.kind === 'comment').length === 0 ?
                        <div className="flex min-h-[32vh] flex-col items-center justify-center px-4 text-center text-stone-400"><MessageCircle size={32} className="mb-3 opacity-30" /><p className="text-sm">No comments yet.</p><p className="mt-1 text-xs">Be the first to share your thoughts!</p></div> :
                        entries.filter(entry => entry.kind === 'comment').map(entry =>
                            <article key={entry.id} className="flex gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#efe8e0] text-sm font-semibold text-[#a06c56]">
                                    {entry.source === 'account' && entry.avatar ? <img src={getImageUrl(entry.avatar)} alt="" className="h-full w-full object-cover" /> : entry.displayName?.slice(0, 1).toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="rounded-2xl rounded-tl-none border border-stone-100 bg-[#fdfbf8] p-3">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="break-all text-sm font-semibold">{entry.displayName}</span>
                                            <span className="rounded-full bg-[#eee7dc] px-1.5 py-0.5 text-[10px] text-[#806c5b]">{entry.source === 'account' ? 'Member' : 'Guest'}</span>
                                        </div>
                                        {entry.content && <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">{entry.content}</p>}
                                        {entry.imageData && <img src={entry.imageData} alt="Photo shared in this comment" loading="lazy" className="mt-3 max-h-64 w-full rounded-xl object-contain" />}
                                    </div>
                                    <p className="mt-1 pl-2 text-[11px] text-stone-400">{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</p>
                                </div>
                            </article>)
                }
            </div> : <div className="p-4">
                <div className="mb-4 flex items-center gap-2 text-sm text-stone-600"><Sparkles size={16} /> Send a little love to this letter</div>
                <div className="grid grid-cols-3 gap-2">{gifts.map(gift => <button type="button" key={gift.key} disabled={sending} onClick={() => void send('gift', gift.key)} className="flex flex-col items-center gap-1 rounded-xl border border-[#ebded0] bg-[#fff8ee] p-3 hover:border-[#cc997d] disabled:opacity-50"><span className="text-2xl">{gift.emoji}</span><span className="text-xs">{gift.label}</span><span className="text-xs text-[#a06c56]">{totals.find(total => total.reaction === gift.key)?.count || 0}</span></button>)}</div>
                <p className="mt-6 text-xs text-stone-500">Recent gifts</p>
                <div className="mt-3 space-y-2">{entries.filter(e => e.kind === 'gift').length === 0 ? <p className="text-sm text-stone-400">No gifts yet. Be the first!</p> : entries.filter(e => e.kind === 'gift').map(e => <p key={e.id} className="rounded-xl bg-[#fdfbf8] p-3 text-sm"><strong>{e.displayName}</strong> {e.source === 'account' ? '· Member' : '· Guest'} sent {gifts.find(g => g.key === e.reaction)?.emoji || '🎁'}</p>)}</div>
            </div>}
        </div>

        <div className="shrink-0 border-t border-stone-100 bg-white px-4 pb-4 pt-3">
            {publicToken && <div className="mb-3 flex gap-2" role="group" aria-label="Comment identity">
                {isAuthenticated && user && <button type="button" onClick={() => setMode('account')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mode === 'account' ? 'bg-[#283f36] text-white' : 'bg-stone-100 text-stone-600'}`}><UserRound size={13} className="mr-1 inline" /> My account</button>}
                <button type="button" onClick={() => setMode('guest')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mode === 'guest' ? 'bg-[#283f36] text-white' : 'bg-stone-100 text-stone-600'}`}>Guest mode</button>
            </div>}
            {publicToken && mode === 'guest' && <input aria-label="Guest nickname" value={nickname} maxLength={40} onChange={e => setNickname(e.target.value)} placeholder="Guest nickname" className="mb-3 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#a06c56]" />}
            {mode === 'account' && isAuthenticated && user && <div className="mb-2 flex items-center gap-2 text-xs text-stone-500">Posting as <strong className="text-[#283f36]">@{user.username}</strong> <span className="rounded-full bg-[#e6f1e9] px-2 py-0.5 text-[#3f7655]">Member</span></div>}
            {!publicToken && !isAuthenticated && <p className="mb-2 text-sm text-stone-600"><Link to="/login" className="font-semibold underline">Log in</Link> to comment on this letter.</p>}
            {publicToken && mode === 'guest' && <p className="mb-2 text-xs text-stone-400">Guests do not need an account. Please keep it kind.</p>}
            {feedback && <p role="status" className="mb-2 rounded-lg bg-[#f7f1e9] px-3 py-2 text-xs text-[#755b48]">{feedback}</p>}
            {(tab === 'comments' || !publicToken) && <form onSubmit={e => { e.preventDefault(); void send('comment'); }} className="flex items-end gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-1 rounded-2xl bg-stone-100 px-3 py-2">
                    {publicToken && <><input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Attach photo review" onChange={e => handlePhoto(e.target.files?.[0])} /><button type="button" onClick={() => uploadRef.current?.click()} aria-label="Attach photo" title="Attach photo review" className="shrink-0 p-1 text-stone-500 hover:text-[#a06c56]"><ImagePlus size={18} /></button></>}
                    <textarea rows={1} value={comment} maxLength={publicToken ? 1200 : 5000} onChange={e => setComment(e.target.value)} placeholder="Write a comment…" aria-label="Write a comment" className="min-h-[32px] max-h-24 w-full resize-y bg-transparent py-1 text-sm text-stone-800 outline-none" />
                </div>
                <button type="submit" disabled={sending || (!comment.trim() && !imageData) || (!publicToken && !isAuthenticated)} aria-label="Post comment" className="shrink-0 rounded-full bg-[#283f36] p-3 text-white hover:bg-[#375747] disabled:opacity-40"><Send size={17} /></button>
            </form>}
            {imageData && <div className="mt-2 flex items-center gap-2"><img src={imageData} alt="Attached photo preview" className="h-14 w-14 rounded-lg object-cover" /><button type="button" onClick={() => setImageData(null)} className="flex items-center gap-1 text-xs text-stone-500"><X size={13} /> Remove photo</button></div>}
        </div>
    </section>;
}
