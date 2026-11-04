import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookHeart, Eye, LockKeyhole, PencilLine, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  GUEST_LETTER_RETURN_TO, clearGuestLetter, guestPrompts, newGuestLetter,
  readGuestLetter, storeGuestLetter,
} from '../lib/guestLetterDraft';

export default function TryLetterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signedIn = useAuthStore(state => state.isAuthenticated);
  const [draft, setDraft] = useState(() => readGuestLetter() || newGuestLetter(params.get('template') || ''));
  const [preview, setPreview] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setStorageOk(storeGuestLetter(draft));
  }, [draft]);

  const update = (field: 'title' | 'recipientName' | 'content', value: string) => {
    setDraft(previous => ({ ...previous, [field]: value }));
    setNotice('');
  };

  const choosePrompt = (id: string) => {
    if ((draft.title.trim() || draft.content.trim()) &&
      !window.confirm('Start a different letter? This will replace your current practice words.')) return;
    setDraft(newGuestLetter(id));
    setPreview(false);
  };

  const continueToSave = () => {
    if (!draft.content.trim()) { setNotice('Write at least a few words before continuing.'); return; }
    if (!storeGuestLetter(draft)) {
      setNotice('Your browser blocked temporary storage. Enable site storage to carry your words safely into signup, or copy your text first.');
      return;
    }
    const next = signedIn ? GUEST_LETTER_RETURN_TO : '/signup?returnTo=' + encodeURIComponent(GUEST_LETTER_RETURN_TO);
    navigate(next);
  };

  const startOver = () => {
    if ((draft.title.trim() || draft.content.trim()) && !window.confirm('Clear your practice letter from this tab?')) return;
    clearGuestLetter();
    setDraft(newGuestLetter());
    setPreview(false);
    setNotice('Your practice letter was cleared.');
  };

  return <main className="min-h-screen bg-background px-4 pb-16 pt-5 text-foreground sm:px-6 sm:pt-10">
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 font-editorial text-xl font-bold"><BookHeart size={22} /> SendTheLetter</Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold"><LockKeyhole size={14} /> Private practice</span>
      </header>

      <div className="mt-8 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[hsl(var(--accent))]">Try it for free</p>
        <h1 className="mt-3 font-editorial text-4xl leading-tight sm:text-5xl">Write before you sign up.</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">See how a thoughtful letter feels. No account, payment, or API request is needed to try writing. Sign up only when you want to save or send it.</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-label="Practice letter editor" className="min-w-0 rounded-[26px] border border-border bg-card p-4 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-editorial text-2xl">Your first page</h2>
            <div className="flex rounded-xl border border-border p-1" role="group" aria-label="Writing view">
              <button type="button" onClick={() => setPreview(false)} aria-pressed={!preview} className={'inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ' + (!preview ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}><PencilLine size={14} /> Write</button>
              <button type="button" onClick={() => setPreview(true)} aria-pressed={preview} className={'inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ' + (preview ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}><Eye size={14} /> Preview</button>
            </div>
          </div>
          {preview ? <article aria-label="Practice letter preview" className="mt-5 min-h-[360px] rounded-[20px] border border-[#e8dac9] bg-[#fffcf7] p-6 text-[#30483b] sm:p-9">
            <h3 className="font-editorial text-3xl">{draft.title.trim() || 'Untitled letter'}</h3>
            {draft.recipientName.trim() && <p className="mt-6 font-editorial text-lg">Dear {draft.recipientName.trim()},</p>}
            <p className="mt-5 whitespace-pre-wrap break-words font-editorial text-lg leading-9">{draft.content || 'Your words will appear here.'}</p>
          </article> : <div className="mt-5 space-y-5">
            <label className="block text-sm font-semibold">Letter title
              <input maxLength={255} value={draft.title} onChange={e => update('title', e.target.value)} placeholder="A letter for someone special" className="mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-normal" />
            </label>
            <label className="block text-sm font-semibold">Who is this for? (optional)
              <input maxLength={100} value={draft.recipientName} onChange={e => update('recipientName', e.target.value)} placeholder="Their name" className="mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-normal" />
            </label>
            <label className="block text-sm font-semibold">Your letter
              <textarea maxLength={12000} rows={10} value={draft.content} onChange={e => update('content', e.target.value)} placeholder="Dear you, I wanted to say…" className="mt-2 min-h-[260px] w-full resize-y rounded-xl border border-border bg-background px-4 py-3 font-editorial text-lg font-normal leading-8" />
            </label>
            <p className="text-right text-xs text-muted-foreground">{draft.content.length.toLocaleString()} / 12,000 characters</p>
          </div>}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <button type="button" onClick={continueToSave} className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">Continue to save or send</button>
            <button type="button" onClick={startOver} className="min-h-11 rounded-full border border-border px-4 text-xs font-bold hover:bg-muted">Clear practice letter</button>
          </div>
          {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
          {!storageOk && <p role="alert" className="mt-3 text-xs text-destructive">Browser storage is unavailable. Copy your words before leaving this page.</p>}
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-editorial text-xl">Need a starting point?</h2>
            <div className="mt-4 flex flex-col gap-2">
              {guestPrompts.map(prompt => <button type="button" key={prompt.id} onClick={() => choosePrompt(prompt.id)}
                className="min-h-11 rounded-xl border border-border px-3 py-2 text-left text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                {prompt.label}
              </button>)}
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-[hsl(var(--surface-sage))]/50 p-5">
            <h2 className="flex items-center gap-2 font-editorial text-xl"><ShieldCheck size={19} /> Your words stay yours</h2>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">Your practice letter is temporarily stored in this browser tab so it survives a refresh and can move into the full editor after signup. It is not uploaded during practice. Tab recovery may restore it; clear it if using a shared device.</p>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">Saving to your account and sending a private invitation happen later, under your control. Never include passwords or confidential information in a shareable letter.</p>
          </section>
          <p className="text-center text-xs text-muted-foreground">Already have an account? <Link className="font-bold underline underline-offset-2" to={'/login?returnTo=' + encodeURIComponent(GUEST_LETTER_RETURN_TO)}>Sign in to save</Link></p>
        </aside>
      </div>
    </div>
  </main>;
}
