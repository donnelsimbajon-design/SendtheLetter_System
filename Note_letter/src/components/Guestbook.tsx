import { useEffect, useState } from 'react';
import axios from 'axios';
import { Gift, ImagePlus, MessageCircle, Send, Share2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

type Entry = { id: number; displayName: string; kind: 'comment' | 'gift'; content: string | null; imageData: string | null; reaction: string | null; createdAt: string };
type Total = { reaction: string; count: number };
const gifts = [
    { key: 'heart', emoji: '❤️', label: 'Love' },
    { key: 'flower', emoji: '🌸', label: 'Flower' },
    { key: 'star', emoji: '🌟', label: 'Star' },
    { key: 'hug', emoji: '🤗', label: 'Hug' },
    { key: 'sparkles', emoji: '✨', label: 'Sparkles' },
];

export default function Guestbook({ token }: { token: string }) {
    const [nickname, setNickname] = useState(() => localStorage.getItem('stl_guest_name') || '');
    const [comment, setComment] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [totals, setTotals] = useState<Total[]>([]);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [tab, setTab] = useState<'comments' | 'gifts'>('comments');
    const endpoint = API_ENDPOINTS.letters + '/public/' + encodeURIComponent(token) + '/guest';

    const refresh = async () => {
        try {
            const response = await axios.get(endpoint);
            setEntries(Array.isArray(response.data.entries) ? response.data.entries : []);
            setTotals(Array.isArray(response.data.totals) ? response.data.totals : []);
        } catch {
            setMessage('Guestbook is temporarily unavailable.');
        }
    };
    useEffect(() => { void refresh(); }, [token]);

    const post = async (kind: 'comment' | 'gift', reaction?: string) => {
        if (busy) return;
        if (nickname.trim().length < 2 || nickname.trim().length > 40) {
            setMessage('Please enter a nickname (2–40 characters).');
            return;
        }
        if (kind === 'comment' && !comment.trim() && !image) {
            setMessage('Write a message or attach a photo.');
            return;
        }
        setBusy(true);
        setMessage('');
        try {
            await axios.post(endpoint, {
                displayName: nickname.trim(), kind,
                ...(kind === 'comment' ? { content: comment.trim(), imageData: image } : { reaction }),
            });
            localStorage.setItem('stl_guest_name', nickname.trim());
            setComment('');
            setImage(null);
            setMessage(kind === 'gift' ? 'Gift sent! ✨' : 'Your message was posted! 💌');
            await refresh();
        } catch (error: any) {
            setMessage(error?.response?.data?.message || 'Could not post. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const selectPhoto = (file?: File) => {
        if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
            setMessage('Choose a JPG, PNG or WebP under 8 MB.');
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        const preview = new Image();
        preview.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = Math.min(1, 900 / Math.max(preview.width, preview.height));
            canvas.width = Math.max(1, Math.round(preview.width * scale));
            canvas.height = Math.max(1, Math.round(preview.height * scale));
            const context = canvas.getContext('2d');
            if (!context) { URL.revokeObjectURL(objectUrl); return; }
            context.drawImage(preview, 0, 0, canvas.width, canvas.height);
            let quality = 0.75;
            let data = canvas.toDataURL('image/jpeg', quality);
            while (data.length > 460000 && quality > 0.3) {
                quality -= 0.1;
                data = canvas.toDataURL('image/jpeg', quality);
            }
            URL.revokeObjectURL(objectUrl);
            if (data.length > 460000) { setMessage('Photo is still too large. Try a smaller photo.'); return; }
            setImage(data);
            setMessage('');
        };
        preview.onerror = () => { URL.revokeObjectURL(objectUrl); setMessage('Could not read this photo.'); };
        preview.src = objectUrl;
    };

    const copyLink = async () => {
        try { await navigator.clipboard.writeText(window.location.href); setMessage('Link copied! 💌'); }
        catch { setMessage('Copy unavailable. Use your browser share option.'); }
    };

    return <section className="no-print mt-8 rounded-[2rem] border border-[#e3d8cd] bg-[#fffdf9] p-6 shadow-lg sm:p-9">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a06c56]"><Gift size={16} /> A little love goes a long way</span>
        <h2 className="mt-3 font-serif text-3xl text-[#263b35]">Leave a little love 💌</h2>
        <p className="mt-2 text-sm leading-6 text-[#6f756b]">No login needed. Comment, share a photo review, or send a sweet reaction gift.</p>

        <div className="mt-6 flex gap-2 border-b border-[#e9e2d8] pb-4">
            <button type="button" onClick={() => setTab('comments')} className={tab === 'comments' ? 'rounded-full bg-[#263b35] px-4 py-2 text-sm text-white' : 'rounded-full bg-[#f3ede5] px-4 py-2 text-sm text-[#52645d]'}><MessageCircle size={15} className="mr-2 inline" />Comments</button>
            <button type="button" onClick={() => setTab('gifts')} className={tab === 'gifts' ? 'rounded-full bg-[#263b35] px-4 py-2 text-sm text-white' : 'rounded-full bg-[#f3ede5] px-4 py-2 text-sm text-[#52645d]'}><Gift size={15} className="mr-2 inline" />Gift reactions</button>
        </div>
        <label htmlFor="guest-nickname" className="mt-5 mb-2 block text-sm font-medium">Your nickname</label>
        <input id="guest-nickname" value={nickname} maxLength={40} onChange={e => setNickname(e.target.value)} placeholder="What should we call you?" className="w-full rounded-xl border border-[#ddd3c8] bg-white px-4 py-3 text-sm outline-none focus:border-[#a06c56]" />
        {tab === 'comments' ? <div className="mt-4">
            <label htmlFor="guest-message" className="mb-2 block text-sm font-medium">Your message</label>
            <textarea id="guest-message" value={comment} maxLength={1200} rows={3} onChange={e => setComment(e.target.value)} placeholder="This letter made me feel…" className="w-full resize-y rounded-xl border border-[#ddd3c8] bg-white px-4 py-3 text-sm outline-none focus:border-[#a06c56]" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#ddd3c8] bg-white px-4 py-2 text-sm"><ImagePlus size={17} />{image ? 'Change photo' : 'Add photo'}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={e => selectPhoto(e.target.files?.[0])} /></label>
                <button type="button" disabled={busy} onClick={() => void post('comment')} className="inline-flex items-center gap-2 rounded-full bg-[#263b35] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Send size={16} />{busy ? 'Posting…' : 'Post comment'}</button>
            </div>
            {image && <div className="mt-3"><img src={image} alt="Photo preview" className="max-h-48 rounded-xl object-cover" /><button type="button" onClick={() => setImage(null)} className="mt-2 block text-xs underline">Remove photo</button></div>}
        </div> : <div className="mt-6">
            <p className="mb-4 text-sm text-[#6f756b]">Choose a gift to brighten someone's day.</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{gifts.map(gift =>
                <button key={gift.key} type="button" disabled={busy} onClick={() => void post('gift', gift.key)} className="flex flex-col items-center gap-1 rounded-2xl border border-[#ebded0] bg-[#fff8ee] p-3 hover:border-[#c88e77] disabled:opacity-50">
                    <span className="text-3xl">{gift.emoji}</span><span className="text-xs">{gift.label}</span><span className="text-xs font-semibold text-[#a06c56]">{totals.find(t => t.reaction === gift.key)?.count || 0}</span>
                </button>
            )}</div>
        </div>}
        {message && <p role="status" className="mt-4 rounded-xl bg-[#f5efe5] px-4 py-3 text-sm text-[#52645d]">{message}</p>}
        <div className="mt-9 border-t border-[#e9e2d8] pt-6"><h3 className="font-serif text-xl">From the guestbook</h3></div>
        {entries.length === 0 ? <p className="mt-4 text-sm text-[#7c8179]">No guest messages yet. Be the first! ✨</p> :
            <div className="mt-4 space-y-3">{entries.map(entry =>
                <article key={entry.id} className="rounded-2xl border border-[#efe4d8] bg-white p-4">
                    <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{entry.displayName}</span><span className="text-xs text-[#94948a]">{new Date(entry.createdAt).toLocaleDateString()}</span></div>
                    {entry.kind === 'gift' ?
                        <p className="mt-2 text-sm text-[#627065]">Sent {gifts.find(g => g.key === entry.reaction)?.emoji || '🎁'} {gifts.find(g => g.key === entry.reaction)?.label || 'a gift'}!</p> :
                        <><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#52645d]">{entry.content}</p>{entry.imageData && <img src={entry.imageData} alt="Guest photo review" loading="lazy" className="mt-3 max-h-80 max-w-full rounded-xl object-cover" />}</>
                    }
                </article>
            )}</div>}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f6f0e8] p-4 text-sm"><span>Know someone who'd love this letter?</span><button type="button" onClick={() => void copyLink()} className="inline-flex items-center gap-2 font-semibold text-[#a06c56]"><Share2 size={16} />Copy share link</button></div>
    </section>;
}
