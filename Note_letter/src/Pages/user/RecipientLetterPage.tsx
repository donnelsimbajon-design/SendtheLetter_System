import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookHeart, HeartHandshake, LockKeyhole, MailOpen, Send, ShieldCheck } from 'lucide-react';
import LetterBookReader from '../../components/LetterBookReader';
import { API_ENDPOINTS } from '../../config/api';
import type { Note } from '../../types/note';

type LetterInvitation = { letter: Note; expiresAt: string };
const reactionChoices = [
    { id: 'heart', emoji: '❤️', text: 'Love it' },
    { id: 'hug', emoji: '🤗', text: 'Sending a hug' },
    { id: 'smile', emoji: '😊', text: 'Made me smile' },
    { id: 'thanks', emoji: '🙏', text: 'Thank you' },
    { id: 'star', emoji: '⭐', text: 'So special' },
];

export default function RecipientLetterPage() {
    const { token = '' } = useParams();
    const [invitation, setInvitation] = useState<LetterInvitation | null>(null);
    const [loading, setLoading] = useState(true);
    const [unavailable, setUnavailable] = useState('');
    const [opened, setOpened] = useState(false);
    const [reaction, setReaction] = useState('heart');
    const [displayName, setDisplayName] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        const robots = document.createElement('meta');
        robots.name = 'robots'; robots.content = 'noindex,nofollow,noarchive';
        const referrer = document.createElement('meta');
        referrer.name = 'referrer'; referrer.content = 'no-referrer';
        document.head.append(robots, referrer);
        document.title = 'A private letter for you | SendTheLetter';
        return () => { robots.remove(); referrer.remove(); };
    }, []);

    useEffect(() => {
        if (!/^[a-f0-9]{48}$/.test(token)) { setLoading(false); setUnavailable('This invitation is invalid.'); return; }
        const abort = new AbortController();
        setLoading(true); setUnavailable(''); setInvitation(null); setOpened(false);
        fetch(`${API_ENDPOINTS.letters}/recipient/${token}`, {
            cache: 'no-store', signal: abort.signal, referrerPolicy: 'no-referrer',
        }).then(async response => {
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.message || 'This invitation is unavailable.');
            if (!abort.signal.aborted) setInvitation(body);
        }).catch(error => {
            if (!abort.signal.aborted) setUnavailable(error instanceof Error ? error.message : 'Unable to open this letter.');
        }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
        return () => abort.abort();
    }, [token]);

    const reply = async (event: FormEvent) => {
        event.preventDefault();
        if (!invitation || sending || sent) return;
        setSending(true); setFeedback('');
        try {
            const response = await fetch(`${API_ENDPOINTS.letters}/recipient/${token}/reply`, {
                method: 'POST', cache: 'no-store', referrerPolicy: 'no-referrer',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reaction, displayName, message }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || 'Your reply could not be delivered.');
            setSent(true);
            setFeedback('Thank you. Your reaction and reply were delivered to the writer.');
        } catch (error) {
            setFeedback(error instanceof Error ? error.message : 'Your reply was not sent.');
        } finally { setSending(false); }
    };

    if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#f6f1e9] px-5 text-center text-[#294336]"><p role="status">Opening your invitation…</p></main>;

    if (!invitation) return <main className="flex min-h-screen items-center justify-center bg-[#f6f1e9] px-5 py-16 text-center text-[#294336]">
        <section className="max-w-md rounded-[24px] border border-[#e0d7c8] bg-white p-8 shadow-sm">
            <LockKeyhole className="mx-auto h-10 w-10" aria-hidden="true" />
            <h1 className="mt-5 font-editorial text-3xl">This letter is unavailable.</h1>
            <p role="alert" className="mt-3 text-sm leading-6 text-[#6b746b]">{unavailable || 'This invitation has expired or been revoked.'} Ask the writer for a fresh invitation.</p>
            <Link to="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#315541] px-5 text-sm font-semibold text-white">Visit SendTheLetter</Link>
        </section>
    </main>;

    const letter = invitation.letter;
    return <main className="min-h-screen bg-[#f5f0e8] px-3 pb-16 pt-6 text-[#30483b] sm:px-6">
        <div className="mx-auto max-w-[800px]">
            <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <Link to="/" className="inline-flex items-center gap-2 font-editorial text-xl font-bold text-[#30483b]"><BookHeart size={22}/> SendTheLetter</Link>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9d6c8] bg-white px-3 py-2 text-xs font-semibold"><LockKeyhole size={14}/> Private invitation</span>
            </header>
            {!opened ? <section aria-label="Private letter envelope" className="flex min-h-[500px] flex-col items-center justify-center rounded-[30px] border border-[#dfd3bf] bg-[#fcf9f3] px-5 py-12 text-center shadow-[0_12px_42px_rgba(53,66,48,.07)] sm:min-h-[570px]">
                <div aria-hidden="true" className="flex h-36 w-48 items-center justify-center rounded-[20px] border-2 border-[#d5b896] bg-[#eedfc8] shadow-[0_16px_30px_rgba(91,74,48,.12)] sm:h-44 sm:w-60">
                    <MailOpen className="h-20 w-20 text-[#7b705c]" strokeWidth={1.3}/>
                </div>
                <p className="mt-9 text-xs font-bold uppercase tracking-[.22em] text-[#a07761]">For someone special</p>
                <h1 className="mt-3 font-editorial text-3xl font-semibold sm:text-4xl">You've received a letter.</h1>
                <p className="mt-4 max-w-sm text-sm leading-7 text-[#66796e]">
                    Someone took the time to write something just for you. No account or payment needed to read it.
                </p>
                <button type="button" onClick={() => setOpened(true)} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#315541] px-7 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#254232] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315541]">
                    <MailOpen size={19}/> Open my letter
                </button>
                <p className="mt-4 text-xs text-[#829084]">Available until {new Date(invitation.expiresAt).toLocaleDateString()}</p>
            </section> : <>
                <div className="mb-4 rounded-xl border border-[#dfe0d3] bg-[#e9eee6] px-4 py-3 text-xs leading-5 text-[#41624e]">
                    <ShieldCheck size={15} className="mr-1.5 inline" aria-hidden="true"/> This is a private invitation. You may read it for free until it expires. Please don't forward it without the writer's permission.
                </div>
                <article aria-label="Your private letter" className="overflow-hidden rounded-[28px] border border-[#dfd3bf] bg-[#fffdf8] shadow-sm">
                    <LetterBookReader
                        title={letter.title}
                        content={letter.content}
                        letterPages={letter.letterPages}
                        category={letter.type || letter.category}
                        authorName={letter.authorName}
                        isAnonymous={letter.isAnonymous}
                        recipientName={letter.recipientName}
                        font={letter.font}
                        backgroundImage={letter.backgroundImage}
                        coverImage={letter.imageUrl}
                    />
                </article>
                <section className="mt-6 rounded-[25px] border border-[#e2d7c8] bg-white p-5 sm:p-7">
                    <div className="flex items-center gap-2"><HeartHandshake size={22}/><h2 className="font-editorial text-2xl">Send a little love back</h2></div>
                    <p className="mt-2 text-sm leading-6 text-[#6b766d]">Want to let the writer know you read their letter? One optional reaction and short reply. No signup required, no public posting.</p>
                    {sent ? <p role="status" className="mt-5 rounded-xl bg-[#e7f0e5] p-4 text-sm font-semibold">Your reply has been delivered. Thank you for reading with care.</p>
                        : <form onSubmit={reply} className="mt-5 space-y-4">
                            <fieldset>
                                <legend className="text-sm font-semibold">How did this letter make you feel?</legend>
                                <div className="mt-2 flex flex-wrap gap-2">{reactionChoices.map(choice => <label key={choice.id} className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold ${reaction === choice.id ? 'border-[#39604a] bg-[#eaf0e8]' : 'border-[#e1d8cc] bg-[#faf9f6]'}`}>
                                    <input type="radio" name="reaction" value={choice.id} checked={reaction === choice.id} onChange={() => setReaction(choice.id)} className="accent-[#315541]" />
                                    <span aria-hidden="true">{choice.emoji}</span> {choice.text}
                                </label>)}</div>
                            </fieldset>
                            <label className="block text-xs font-semibold">Your name (optional)
                                <input maxLength={60} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" className="mt-1.5 h-11 w-full rounded-xl border border-[#d9d2c7] bg-white px-3 text-sm" />
                            </label>
                            <label className="block text-xs font-semibold">Your message (optional)
                                <textarea maxLength={600} rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="This meant a lot to me…" className="mt-1.5 w-full resize-y rounded-xl border border-[#d9d2c7] bg-white px-3 py-2.5 text-sm" />
                            </label>
                            <button type="submit" disabled={sending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#315541] px-5 text-sm font-bold text-white disabled:opacity-50"><Send size={15}/> {sending ? 'Sending…' : 'Send private reply'}</button>
                        </form>}
                    {feedback && <p role="status" className="mt-3 text-xs text-[#576b5c]">{feedback}</p>}
                </section>
                <div className="mt-8 rounded-2xl border border-[#e2d7c8] bg-[#fffaf2] p-5 text-center">
                    <p className="font-editorial text-xl">Have someone on your mind?</p>
                    <p className="mt-1 text-sm text-[#647367]">Write a heartfelt letter of your own. Reading this one is always free.</p>
                    <Link to="/signup?returnTo=%2Fdashboard%2Fnotes%3Fcompose%3D1%26template%3Dhello"
                        className="mt-4 inline-flex min-h-11 items-center rounded-full border border-[#315541] px-5 text-xs font-bold text-[#315541] hover:bg-[#e8ede4]">Write a letter back</Link>
                </div>
            </>}
        </div>
    </main>;
}
