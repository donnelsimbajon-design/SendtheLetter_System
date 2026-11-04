import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNoteStore } from '../../store/noteStore';
import Mascot from '../../components/Mascot';
import CharacterBadge, { type CharacterTone } from '../../components/CharacterBadge';
import type { MascotName } from '../../components/Mascot';

const invitations: { title: string; subtitle: string; description: string; template: string; mascot: MascotName; tone: CharacterTone }[] = [
  { title: 'A heartfelt thank you', subtitle: 'Gratitude', description: 'Tell someone about the little things you appreciate.', template: 'gratitude', mascot: 'tala', tone: 'gold' },
  { title: 'A note to future me', subtitle: 'Reflection', description: 'Write something the future you deserves to hear.', template: 'future-self', mascot: 'araw', tone: 'sage' },
  { title: 'A little hello', subtitle: 'Friendship', description: 'Reach out with a few honest words.', template: 'hello', mascot: 'piko', tone: 'rose' },
];

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const { notes, drafts, fetchMyLetters, fetchDrafts } = useNoteStore();

  useEffect(() => {
    void fetchMyLetters();
    void fetchDrafts();
  }, [fetchMyLetters, fetchDrafts]);

  const hasDrafts = drafts.length > 0;
  const firstDraft = hasDrafts ? drafts[0] : null;
  const recentNotes = notes.slice(0, 3);

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-7 overflow-x-clip pb-6 sm:space-y-9">
      <section className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-9 text-primary-foreground sm:px-10 sm:py-12">
        <div aria-hidden="true" className="paper-grain pointer-events-none absolute inset-0 opacity-25" />
        <div className="relative z-10 max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] opacity-85">
            <CharacterBadge name="tala" tone="gold" size="xs" />
            Your little corner of the internet
          </p>
          <h1 className="font-editorial text-4xl leading-[1.12] sm:text-5xl">
            Welcome back, {user?.username || 'writer'}.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 opacity-85 sm:text-base">
            Whatever is on your mind today, there is a page for it. Pick up a draft or start with a few new words.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/dashboard/notes?compose=1" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[hsl(var(--surface-gold))] px-5 py-3 text-sm font-bold text-[#493D2A] transition-transform hover:-translate-y-0.5">
              <CharacterBadge name="lumi" tone="paper" size="xs" />
              Write a letter
            </Link>
            <Link to="/dashboard/notes" className="inline-flex min-h-12 items-center rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-white/10">
              Visit my library
            </Link>
          </div>
        </div>
        <Mascot name="lumi" className="pointer-events-none absolute -bottom-6 -right-5 hidden h-48 w-48 drop-shadow-lg md:block lg:h-56 lg:w-56" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-12 hidden h-72 w-72 rotate-[22deg] rounded-[3rem] border border-white/15 bg-white/5 md:block" />
      </section>

      <section aria-label="Your writing at a glance" className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-[1.65rem] border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Your letters</p>
            <CharacterBadge name="basa" tone="sage" size="md" />
          </div>
          <p className="mt-2 font-editorial text-4xl tabular-nums">{notes.length}</p>
          <Link to="/dashboard/notes" className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline">Open your collection</Link>
        </div>
        <div className="rounded-[1.65rem] border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Saved drafts</p>
            <CharacterBadge name="lumi" tone="gold" size="md" />
          </div>
          <p className="mt-2 font-editorial text-4xl tabular-nums">{drafts.length}</p>
          <Link to="/dashboard/notes?tab=drafts" className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline">Continue your thoughts</Link>
        </div>
        <div className="rounded-[1.65rem] border border-border/70 bg-card/70 p-5 text-foreground shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm opacity-80">Today's invitation</p>
            <CharacterBadge name="araw" tone="paper" size="md" />
          </div>
          <p className="mt-3 font-editorial text-xl leading-snug">A few words are enough.</p>
          <Link to="/dashboard/notes?compose=1&template=future-self" className="mt-3 inline-flex text-xs font-bold underline underline-offset-4">Find a starting point</Link>
        </div>
      </section>

      <section aria-label="Your letters and community discovery" className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
        <div className="min-w-0 rounded-[1.8rem] border border-border/70 bg-card/70 p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.17em] text-[hsl(var(--accent))]">Back to your words</p>
              <h2 className="mt-2 font-editorial text-2xl sm:text-3xl">{hasDrafts ? 'Something you started' : 'Your recent letters'}</h2>
            </div>
            <Link to="/dashboard/notes" className="inline-flex min-h-10 items-center rounded-full border border-border px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-muted">View library</Link>
          </div>
          {firstDraft ? (
            <div className="mt-6 flex min-w-0 flex-col gap-5 rounded-[1.45rem] bg-background/45 p-5 sm:flex-row sm:items-center sm:p-6">
              <CharacterBadge name="lumi" tone="gold" size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Saved for later</p>
                <h3 className="mt-2 truncate font-editorial text-2xl">{firstDraft.title || 'Untitled letter'}</h3>
                <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">{firstDraft.content}</p>
              </div>
              <Link to="/dashboard/notes?tab=drafts" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground">Continue draft</Link>
            </div>
          ) : recentNotes.length ? (
            <div className="mt-5 divide-y divide-border">
              {recentNotes.map((note) => (
                <div key={note.id} className="flex items-center gap-4 py-4">
                  <CharacterBadge name={note.isPublic ? 'piko' : 'susi'} tone={note.isPublic ? 'rose' : 'sage'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{note.title || 'Untitled letter'}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{note.content}</p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">{note.isPublic ? 'Public' : 'Private'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.4rem] bg-background px-5 py-8 text-center">
              <Mascot name="sely" className="mx-auto h-24 w-24" />
              <h3 className="mt-4 font-editorial text-2xl">Your first page is waiting.</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">A memory, a thought, or a simple hello is enough to begin.</p>
              <Link to="/dashboard/notes?compose=1" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground">Begin a letter</Link>
            </div>
          )}
        </div>

        <div className="relative min-w-0 overflow-hidden rounded-[1.8rem] border border-border/70 bg-card/70 p-6 text-foreground shadow-sm sm:p-8">
          <CharacterBadge name="basa" tone="paper" size="lg" />
          <p className="mt-6 text-xs font-bold uppercase tracking-[.17em] opacity-70">A gentle discovery</p>
          <h2 className="mt-3 max-w-sm font-editorial text-3xl leading-tight">Every letter holds a little world.</h2>
          <p className="mt-4 max-w-sm text-sm leading-7 opacity-85">Read published stories from other writers when you feel like finding a little connection.</p>
          <Link to="/dashboard/community" className="mt-7 inline-flex min-h-11 items-center rounded-full border border-border bg-transparent px-5 py-2.5 text-xs font-bold text-foreground transition-[transform,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:opacity-75 active:scale-[.98] motion-reduce:transform-none">Explore community letters</Link>
          <Mascot name="piko" className="pointer-events-none absolute -bottom-10 -right-9 h-32 w-32 opacity-60" />
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[.17em] text-[hsl(var(--accent))]">Need a first sentence?</p>
          <h2 className="mt-2 font-editorial text-3xl">Pick a little inspiration.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a template and make the rest your own.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {invitations.map((invitation) => (
            <Link key={invitation.template} to={'/dashboard/notes?compose=1&template=' + invitation.template}
              className="group flex flex-col rounded-[1.65rem] border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
              <div className="flex items-center justify-between gap-3">
                <CharacterBadge name={invitation.mascot} tone={invitation.tone} size="lg" />
                <span className="text-[11px] font-bold uppercase tracking-[.13em] text-muted-foreground">{invitation.subtitle}</span>
              </div>
              <h3 className="mt-6 font-editorial text-2xl leading-snug">{invitation.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{invitation.description}</p>
              <span className="mt-6 text-xs font-bold text-primary underline-offset-4 group-hover:underline">Start this letter</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
