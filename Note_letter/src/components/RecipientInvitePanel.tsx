import { useMemo, useState } from 'react';
import { Copy, ExternalLink, Heart, LockKeyhole, QrCode, RefreshCw, ShieldCheck, Share2, Trash2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { useAuthStore } from '../store/authStore';
import { invitationQrSvg } from '../lib/invitationQr';

type Reply = { reaction: string; displayName: string | null; message: string | null; createdAt: string };

type Props = { letterId: string | number; title: string };

export default function RecipientInvitePanel({ letterId, title }: Props) {
    const token = useAuthStore(s => s.token);
    const [days, setDays] = useState(7);
    const [link, setLink] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [exists, setExists] = useState<boolean | null>(null);
    const [replies, setReplies] = useState<Reply[] | null>(null);
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState('');
    const endpoint = `${API_ENDPOINTS.letters}/${encodeURIComponent(String(letterId))}`;
    const headers = { Authorization: `Bearer ${token || ''}`, 'Content-Type': 'application/json' };
    const qrSvg = useMemo(() => {
        if (!link) return '';
        try { return invitationQrSvg(link); } catch { return ''; }
    }, [link]);

    async function request(method: 'GET' | 'POST' | 'DELETE', suffix: string, body?: object) {
        const response = await fetch(endpoint + suffix, {
            method, headers, body: body ? JSON.stringify(body) : undefined,
            cache: 'no-store',
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.message || 'Could not update this invitation.');
        return json;
    }

    const create = async () => {
        if (!window.confirm('This creates a new private invitation and revokes any older link for this letter. Continue?')) return;
        setBusy(true); setFeedback('');
        try {
            const result = await request('POST', '/recipient-link', { expiresInDays: days });
            const base = import.meta.env.VITE_APP_URL || window.location.origin;
            const url = new URL(`/open#${result.token}`, base).toString();
            setLink(url); setExists(true); setReplies(null); setExpiresAt(result.expiresAt);
            setFeedback('Invitation ready. Copy the link or save its QR code before closing this window.');
        } catch (error) {
            setFeedback(error instanceof Error ? error.message : 'Unable to create this invitation.');
        } finally { setBusy(false); }
    };

    const status = async () => {
        setBusy(true); setFeedback('');
        try {
            const result = await request('GET', '/recipient-link');
            setExists(result.active);
            setExpiresAt(result.expiresAt || '');
            setFeedback(result.active
                ? 'An invitation is active. For security, the old link cannot be recovered—create a new one to share it.'
                : 'No active invitation. Create one when you are ready to share.');
        } catch (error) { setFeedback(error instanceof Error ? error.message : 'Could not check invitation.'); }
        finally { setBusy(false); }
    };

    const revoke = async () => {
        if (!window.confirm('Disable all private invitations to this letter immediately?')) return;
        setBusy(true); setFeedback('');
        try {
            await request('DELETE', '/recipient-link');
            setLink(''); setExists(false); setExpiresAt('');
            setFeedback('Private invitation revoked. The old link and QR code no longer open this letter.');
        } catch (error) { setFeedback(error instanceof Error ? error.message : 'Could not revoke the invitation.'); }
        finally { setBusy(false); }
    };

    const copy = async () => {
        try { await navigator.clipboard.writeText(link); setFeedback('Invitation link copied. Send it only to someone you trust.'); }
        catch { setFeedback('Copy failed. Select the URL above and copy it manually.'); }
    };

    const share = async () => {
        if (!navigator.share) { setFeedback('Choose Copy link, then paste it into Messenger, TikTok, or your preferred app.'); return; }
        try {
            await navigator.share({ title: 'A private SendTheLetter invitation', text: 'I made a special letter for you. Open it whenever you are ready.', url: link });
            setFeedback('Share sheet opened. Choose a trusted recipient.');
        } catch (error) {
            if ((error as Error).name !== 'AbortError') setFeedback('Your browser could not share the link. Try Copy link instead.');
        }
    };

    const downloadQr = () => {
        if (!qrSvg) { setFeedback('QR code unavailable for this long URL. Copy the link instead.'); return; }
        const url = URL.createObjectURL(new Blob([qrSvg], { type: 'image/svg+xml' }));
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = 'sendtheletter-private-invitation.svg';
        document.body.appendChild(anchor); anchor.click(); anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const loadReplies = async () => {
        setBusy(true); setFeedback('');
        try {
            const result = await request('GET', '/recipient-replies');
            setReplies(Array.isArray(result) ? result : []);
        } catch (error) { setFeedback(error instanceof Error ? error.message : 'Could not load replies.'); }
        finally { setBusy(false); }
    };

    return <section aria-label="Private recipient invitation" className="rounded-2xl border border-[#dfd5c6] bg-[#faf5ec] p-4 text-[#304839]">
        <div className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 shrink-0" aria-hidden="true" />
            <h3 className="font-editorial text-xl font-semibold">Send to someone special</h3>
        </div>
        <p className="mt-1.5 text-xs leading-5 text-[#65746a]">
            Your letter stays off the public Community. Only people with this invitation link can open it, without an account.
            Anyone they forward it to can also read it. Do not share sensitive secrets.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor="recipient-expiry" className="text-xs font-semibold">Invitation expires</label>
            <select id="recipient-expiry" value={days} onChange={e => setDays(Number(e.target.value))}
                className="min-h-10 rounded-xl border border-[#d6cab8] bg-white px-2 text-sm">
                <option value={1}>After 1 day</option>
                <option value={7}>After 7 days</option>
                <option value={30}>After 30 days</option>
            </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={create} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#315541] px-4 py-2 text-xs font-bold text-white hover:bg-[#244334] disabled:opacity-50">
                <ShieldCheck size={16} /> {link || exists ? 'Replace invitation' : 'Create private invitation'}
            </button>
            <button type="button" disabled={busy} onClick={status} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#cec4b5] bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"><RefreshCw size={14}/> Check status</button>
            {exists !== false && <button type="button" disabled={busy} onClick={revoke} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#d8c3bb] bg-white px-3 py-2 text-xs font-semibold text-[#934e3a] disabled:opacity-50"><Trash2 size={14}/> Revoke</button>}
        </div>
        {expiresAt && <p className="mt-2 text-xs text-[#65746a]">Expires {new Date(expiresAt).toLocaleString()}</p>}
        {link && <div className="mt-4 space-y-3 rounded-xl border border-[#dfd5c6] bg-white p-3">
            <label htmlFor="private-invitation-link" className="block text-xs font-bold">Your one-time-generated invitation URL</label>
            <input id="private-invitation-link" readOnly onFocus={e => e.currentTarget.select()} value={link}
                className="w-full rounded-lg border border-[#dcd6cd] bg-[#faf9f6] px-2 py-2 text-xs" />
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copy} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#315541] px-3 text-xs font-semibold text-white"><Copy size={14}/> Copy link</button>
                <button type="button" onClick={share} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold"><Share2 size={14}/> Share to an app</button>
                <a href={link} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold"><ExternalLink size={14}/> Preview</a>
            </div>
            {qrSvg ? <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[#ddd4c6] p-3">
                <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`} alt="Scannable private invitation QR code" width="196" height="196" className="h-44 w-44 bg-white p-1" />
                <button type="button" onClick={downloadQr} className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold"><QrCode size={14}/> Download QR card</button>
                <p className="text-center text-[11px] text-[#6b756d]">QR generated on your device. The link is not sent to any QR service.</p>
            </div> : <p className="text-xs text-amber-700">The link is too long for the offline QR. Copy the link instead.</p>}
        </div>}
        <button type="button" disabled={busy} onClick={loadReplies} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[#315541] underline underline-offset-4 disabled:opacity-50"><Heart size={14}/> View recipient responses</button>
        {replies && <div aria-label="Recipient responses" className="mt-2 space-y-2">
            {replies.length === 0 ? <p className="text-xs text-[#65746a]">No replies yet.</p> :
                replies.map((reply, index) => <div key={index} className="rounded-lg border border-[#e4d8ca] bg-white p-2.5 text-xs">
                    <strong>{reply.displayName || 'Your recipient'} · {reply.reaction}</strong>
                    {reply.message && <p className="mt-1 whitespace-pre-wrap break-words">{reply.message}</p>}
                    <p className="mt-1 text-[11px] text-[#7c8276]">{new Date(reply.createdAt).toLocaleString()}</p>
                </div>)}
        </div>}
        {feedback && <p role="status" className="mt-3 rounded-lg bg-white px-3 py-2 text-xs leading-5">{feedback}</p>}
    </section>;
}
