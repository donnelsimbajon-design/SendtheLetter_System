import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenText, PenLine } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNoteStore } from '../../store/noteStore';
import { useInboxStore } from '../../store/inboxStore';
import { getImageUrl } from '../../lib/utils';
import Mascot, { type MascotName } from '../../components/Mascot';
import InteractiveMascot from '../../components/InteractiveMascot';

const prompts: { title: string; description: string; template: string; mascot: MascotName }[] = [
  { title: 'Say what you appreciate', description: 'A small thank-you can mean a lot.', template: 'gratitude', mascot: 'tala' },
  { title: 'Write to your future self', description: 'Leave a reminder for the person you are becoming.', template: 'future-self', mascot: 'araw' },
  { title: 'Reach out with a hello', description: 'Start a connection with a few honest words.', template: 'hello', mascot: 'piko' },
];

const surface = 'rounded-[1.5rem] border border-border/80 bg-card/70 shadow-sm';
const hover = 'transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md active:translate-y-0 motion-reduce:transform-none';

const StatLink = ({ to, icon, label, value, description }: {
  to: string;
  icon: MascotName;
  label: string;
  value: string | number;
  description: string;
}) => (
  <Link to={to} className={`${surface} ${hover} flex min-w-0 items-center gap-3 p-4 sm:p-5`}>
    <Mascot name={icon} className="h-12 w-12 shrink-0" />
    <span className="min-w-0 flex-1">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <span className="mt-1 block truncate font-editorial text-3xl leading-none">{value}</span>
      <span className="mt-2 block truncate text-[11px] text-muted-foreground">{description}</span>
    </span>
    <ArrowRight size={17} className="shrink-0 text-muted-foreground" aria-hidden="true" />
  </Link>
);

export default function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const { notes, drafts, fetchMyLetters, fetchDrafts } = useNoteStore();
  const conversations = useInboxStore(state => state.conversations);
  const inboxError = useInboxStore(state => state.error);
  const unread = conversations.reduce((sum, convo) => sum + Math.max(0, convo.unreadCount || 0), 0);
  const firstDraft = drafts[0];
  const recentNotes = notes.slice(0, 4);
  const displayName = (user?.username || 'writer').split('@')[0].replace(/[._-]+/g, ' ').trim() || 'writer';
  const recentChats = conversations.slice(0, 3);

  useEffect(() => {
    void fetchMyLetters();
    void fetchDrafts();
  }, [fetchMyLetters, fetchDrafts]);

  return (
    <div className="mx-auto max-w-[1280px] min-w-0 space-y-6 pb-9 sm:space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-5">
        <div className="min-w-0">
          <img src="/sendtheletter-logo.svg" alt="SendTheLetter" className="h-9 w-[170px] object-contain object-left sm:h-11 sm:w-[210px]" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[.15em] text-muted-foreground">Your writing space</p>
          <h1 className="mt-2 break-words font-editorial text-3xl leading-tight sm:text-4xl">Welcome back, {displayName}.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Pick up where you left off, read a little, or connect with another writer.</p>
        </div>
        <Link to="/dashboard/notes?compose=1" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <PenLine size={16} /> Write a letter
        </Link>
      </header>

      <section aria-label="Start your day" className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(270px,1fr)]">
        <div className={`${surface} flex min-w-0 flex-col justify-between gap-5 p-6 sm:p-8`}>
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">Continue your story</span>
              <h2 className="mt-3 max-w-lg font-editorial text-2xl leading-snug sm:text-3xl">
                {firstDraft ? 'Your words are waiting.' : 'There is room for another story.'}
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                {firstDraft ? 'Come back to the thoughts you saved. You can keep writing at your own pace.' : 'Begin with a memory, a feeling, or one sentence you want to remember.'}
              </p>
            </div>
            <InteractiveMascot name="lumi" className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" label="Wave to Lumi" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={firstDraft ? '/dashboard/notes?tab=drafts' : '/dashboard/notes?compose=1'} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-85">
              <BookOpenText size={16} /> {firstDraft ? 'Continue a draft' : 'Start writing'}
            </Link>
            <Link to="/dashboard/notes" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold transition-colors hover:bg-muted">
              My library <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className={`${surface} flex flex-col justify-between gap-4 p-6 sm:p-7`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">A gentle prompt for today</p>
            <InteractiveMascot name="araw" className="h-12 w-12 shrink-0" label="Wave to Araw" />
          </div>
          <div>
            <h2 className="font-editorial text-2xl leading-snug">What would you tell your future self?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">You do not have to find the perfect words to begin.</p>
          </div>
          <div className="flex flex-wrap gap-4"><Link to="/dashboard/notes?compose=1&template=future-self" className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-primary underline underline-offset-4">Write about it <ArrowRight size={15} /></Link><Link to="/dashboard/notes?tab=scheduled" className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-primary underline underline-offset-4">My time capsules <ArrowRight size={15} /></Link></div>
        </div>
      </section>

      <section aria-label="Your activity at a glance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatLink to="/dashboard/notes" icon="basa" label="Your letters" value={notes.length} description="Open your collection" />
        <StatLink to="/dashboard/notes?tab=drafts" icon="lumi" label="Saved drafts" value={drafts.length} description="Pick up your writing" />
        <StatLink to="/dashboard/messages" icon="chika" label="Unread messages" value={unread} description="Catch up with writers" />
        <StatLink to="/dashboard/community" icon="piko" label="Community" value="Explore" description="Discover public stories" />
      </section>

      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.9fr)]">
        <section aria-labelledby="your-writing" className={`${surface} min-w-0 p-5 sm:p-7`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-[11px] font-semibold uppercase tracking-[.15em] text-muted-foreground">Your library</p><h2 id="your-writing" className="mt-1 font-editorial text-2xl">Recently in your writing</h2></div>
            <Link to="/dashboard/notes" className="inline-flex min-h-10 items-center gap-1 text-xs font-bold text-primary hover:underline">View all <ArrowRight size={15} /></Link>
          </div>

          {firstDraft && (
            <Link to="/dashboard/notes?tab=drafts" className="mt-5 flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-background/60 p-4 transition-colors hover:bg-muted/65">
              <Mascot name="lumi" className="h-12 w-12 shrink-0" />
              <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Continue draft</span><span className="mt-1 block truncate font-editorial text-lg">{firstDraft.title || 'Untitled letter'}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{firstDraft.content || 'Your next line is waiting.'}</span></span>
              <ArrowRight size={16} className="shrink-0" />
            </Link>
          )}

          {recentNotes.length > 0 ? (
            <ul className="mt-3 divide-y divide-border/70">
              {recentNotes.map(note => (
                <li key={note.id}>
                  <Link to="/dashboard/notes" className="flex min-w-0 items-center gap-3 rounded-xl py-4 transition-colors hover:bg-muted/40">
                    <Mascot name={note.isPublic ? 'piko' : 'susi'} className="h-10 w-10 shrink-0" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{note.title || 'Untitled letter'}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{note.content || 'Open your letter'}</span></span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{note.isPublic ? 'Public' : 'Private'}</span>
                    <ArrowRight size={15} className="shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : !firstDraft ? (
            <div className="flex flex-col items-center px-4 py-9 text-center">
              <Mascot name="basa" className="h-20 w-20" />
              <p className="mt-3 font-editorial text-xl">Your first letter starts here</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Save a thought or write to someone who matters to you.</p>
              <Link to="/dashboard/notes?compose=1" className="mt-5 rounded-full border border-border px-5 py-2.5 text-xs font-bold hover:bg-muted">Create your first letter</Link>
            </div>
          ) : null}
        </section>

        <div className="min-w-0 space-y-5">
          <section aria-labelledby="connections" className={`${surface} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[11px] font-semibold uppercase tracking-[.15em] text-muted-foreground">Stay connected</p><h2 id="connections" className="mt-1 font-editorial text-2xl">Messages</h2></div>
              <Mascot name="chika" className="h-12 w-12" />
            </div>
            {inboxError && <p className="mt-4 text-xs text-muted-foreground">Messages are temporarily unavailable.</p>}
            {recentChats.length ? <div className="mt-4 divide-y divide-border/60">
              {recentChats.map(convo => (
                <Link key={convo.user.id} to={`/dashboard/messages?userId=${convo.user.id}`} className="flex items-center gap-3 py-3 hover:opacity-75">
                  {convo.user.avatar ? <img src={getImageUrl(convo.user.avatar)} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <Mascot name="chika" className="h-10 w-10 shrink-0" />}
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{convo.user.username}</span><span className="block truncate text-xs text-muted-foreground">{convo.lastMessage}</span></span>
                  {convo.unreadCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{convo.unreadCount > 99 ? '99+' : convo.unreadCount}</span>}
                </Link>
              ))}
            </div> : !inboxError ? <p className="mt-4 text-sm leading-6 text-muted-foreground">Your conversations will appear here when you connect with other writers.</p> : null}
            <Link to="/dashboard/messages" className="mt-4 inline-flex min-h-10 items-center gap-2 text-xs font-bold text-primary underline underline-offset-4">Open inbox <ArrowRight size={14} /></Link>
          </section>

          <section aria-labelledby="discover" className={`${surface} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-3"><h2 id="discover" className="font-editorial text-2xl">Discover & connect</h2><Mascot name="piko" className="h-12 w-12" /></div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Meet writers, explore popular topics, and read stories that people appreciate.</p>
            <Link to="/dashboard/community" className="mt-4 inline-flex min-h-10 items-center gap-2 text-xs font-bold text-primary underline underline-offset-4">Explore community <ArrowRight size={14} /></Link>
          </section>
        </div>
      </div>

      <section aria-labelledby="inspiration" className="min-w-0">
        <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[.15em] text-muted-foreground">A little inspiration</p><h2 id="inspiration" className="mt-1 font-editorial text-2xl">Write about what matters</h2></div></div>
        <div className="grid gap-3 md:grid-cols-3">
          {prompts.map(prompt => (
            <Link key={prompt.template} to={`/dashboard/notes?compose=1&template=${prompt.template}`} className={`${surface} ${hover} flex min-w-0 items-start gap-3 p-5`}>
              <InteractiveMascot name={prompt.mascot} className="h-11 w-11 shrink-0" />
              <span className="min-w-0 flex-1"><span className="block font-editorial text-lg">{prompt.title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{prompt.description}</span></span>
              <ArrowRight size={16} className="mt-2 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
