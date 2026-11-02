import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Mascot from '../components/Mascot';
import CharacterBadge from '../components/CharacterBadge';

const startingPoints = [
  {
    value: 'gratitude',
    label: 'Say thank you',
    eyebrow: 'A little gratitude',
    title: 'Thank you for being you',
    excerpt: 'I wanted to take a moment to say thank you. The little things you do mean more than you know.',
    tone: 'bg-[hsl(var(--surface-gold))]',
    mascot: 'tala',
  },
  {
    value: 'future-self',
    label: 'Write to future me',
    eyebrow: 'A letter for later',
    title: 'Dear future me',
    excerpt: 'I hope you remember this version of us. The small beginnings, the lessons, and everything we are becoming.',
    tone: 'bg-[hsl(var(--surface-sage))]',
    mascot: 'araw',
  },
  {
    value: 'apology',
    label: 'Find the words',
    eyebrow: 'An honest beginning',
    title: 'Something I need to say',
    excerpt: 'I have been thinking about what happened. I want to be honest, take responsibility, and begin with these words.',
    tone: 'bg-[hsl(var(--surface-rose))]',
    mascot: 'sely',
  },
  {
    value: 'hello',
    label: 'Just say hello',
    eyebrow: 'A thoughtful hello',
    title: 'You crossed my mind',
    excerpt: 'I thought of you today and wanted to send a few words your way. Sometimes a simple hello means a lot.',
    tone: 'bg-[#DDE9DF]',
    mascot: 'piko',
  },
] as const;

const paths = [
  {
    heading: 'Write what is on your mind',
    body: 'Start with a thought, a thank-you, or something you have been meaning to say.',
    mascot: 'lumi',
    tone: 'gold',
    number: '01',
  },
  {
    heading: 'Make it your own',
    body: 'Choose your letter paper, keep a draft, or decide whether your writing is private or public.',
    mascot: 'susi',
    tone: 'sage',
    number: '02',
  },
  {
    heading: 'Keep it close or share',
    body: 'Return to your own letters, or connect through published community stories.',
    mascot: 'basa',
    tone: 'rose',
    number: '03',
  },
] as const;

const Home = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = startingPoints[selectedIndex];
  const composePath = '/dashboard/notes?compose=1&template=' + selected.value;
  const startLink = isAuthenticated ? composePath : '/signup?returnTo=' + encodeURIComponent(composePath);
  const exploreLink = isAuthenticated ? '/dashboard/community' : '/services';

  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-8 md:min-h-[80px]">
          <Link to="/" aria-label="SendTheLetter home" className="inline-flex shrink-0 items-center">
            <img src="/sendtheletter-logo.svg" alt="SendTheLetter" className="h-10 w-[156px] object-contain object-left min-[380px]:w-[180px] sm:h-12 sm:w-[218px]" />
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground lg:flex">
            <Link className="transition-colors hover:text-foreground" to="/about">Our story</Link>
            <Link className="transition-colors hover:text-foreground" to="/services">The experience</Link>
            <Link className="transition-colors hover:text-foreground" to="/contact">Contact</Link>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="hidden rounded-full px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted sm:inline-flex">
              {isAuthenticated ? 'My space' : 'Sign in'}
            </Link>
            <Link to={startLink} className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:px-6 sm:text-sm">
              {isAuthenticated ? 'Write a letter' : 'Start writing'}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[1.04fr_.96fr] lg:gap-12 lg:pb-24 lg:pt-24">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[11px] font-bold tracking-wide text-muted-foreground sm:px-4">
              <CharacterBadge name="tala" tone="gold" size="xs" />
              A little space for big feelings
            </span>
            <h1 className="mt-7 max-w-[730px] font-editorial text-[clamp(3rem,7.4vw,6.25rem)] leading-[1.02] tracking-[-.045em]">
              Some things are <span className="italic text-[hsl(var(--accent))]">better</span> in a letter.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              The words you never said. The memories you want to keep. The little thank-yous that matter.
              Give them a place to live.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={startLink} className="inline-flex min-h-12 items-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CharacterBadge name="lumi" tone="paper" size="xs" />
                Write your first letter
              </Link>
              <Link to={exploreLink} className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-bold transition-colors hover:bg-muted">
                {isAuthenticated ? 'Explore community letters' : 'See what you can do'}
              </Link>
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              Start with a template. Save your words in your own writing space.
            </p>
            <div className="mt-10 grid max-w-lg grid-cols-2 gap-3 border-t border-border pt-6">
              <div>
                <p className="font-editorial text-xl sm:text-2xl">Your words, your pace.</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">No perfect words required</p>
              </div>
              <div className="border-l border-border pl-5">
                <p className="font-editorial text-xl sm:text-2xl">Made to feel personal.</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Private drafts and public stories</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[540px] px-3 pb-7 pt-8 sm:px-6">
            <div aria-hidden="true" className="absolute left-2 top-10 h-44 w-44 rounded-full bg-[hsl(var(--surface-rose))] opacity-60 blur-3xl" />
            <div aria-hidden="true" className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[hsl(var(--surface-sage))] opacity-65 blur-3xl" />
            <div className="relative rotate-[2deg] rounded-[2.25rem] bg-[hsl(var(--surface-sage))] p-3 shadow-[0_28px_80px_-35px_rgba(38,59,53,.4)] sm:p-5">
              <div className="paper-grain min-h-[410px] rounded-[1.8rem] border border-[#E4DACE] bg-[#FBF7EF] px-7 py-8 text-[#263B35] sm:min-h-[480px] sm:px-10 sm:py-10">
                <div className="flex items-center justify-between border-b border-[#E6DCCF] pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#718075]">A letter from the heart</p>
                  <CharacterBadge name="sely" tone="rose" size="xs" />
                </div>
                <p className="mt-11 font-editorial text-4xl sm:mt-14 sm:text-5xl">Dear you,</p>
                <p className="mt-7 font-editorial text-xl leading-9 text-[#57675D] sm:text-[1.55rem] sm:leading-10">
                  I hope you know that the little things you do matter more than you think.
                  Sometimes the best words are the ones we finally write down.
                </p>
                <div className="mt-10 flex items-end justify-between border-t border-[#E6DCCF] pt-5">
                  <p className="font-editorial text-2xl italic text-[#C87965]">With care,</p>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8D988E]">SendTheLetter</p>
                </div>
              </div>
            </div>
            <Mascot name="lumi" alt="Lumi, the SendTheLetter letter companion" loading="eager" className="pointer-events-none absolute -right-2 -top-10 z-10 h-28 w-28 drop-shadow-lg sm:-right-4 sm:-top-12 sm:h-36 sm:w-36" />
            <div className="absolute -bottom-2 left-0 z-10 inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-semibold shadow-lg sm:left-[-12px] sm:text-sm">
              <CharacterBadge name="basa" tone="gold" size="xs" /> Every story starts somewhere
            </div>
          </div>
        </section>

        <section id="starting-points" className="border-y border-border bg-card/75">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">Not sure where to start?</p>
              <h2 className="mt-4 font-editorial text-3xl leading-tight sm:text-5xl">A few words can open the door.</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">Choose a starting point. We will open a matching writing template when you enter your space.</p>
            </div>
            <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-[.9fr_1.1fr] lg:gap-8">
              <div role="group" aria-label="Choose a letter starting point" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {startingPoints.map((point, index) => (
                  <button key={point.value} type="button" aria-pressed={index === selectedIndex} onClick={() => setSelectedIndex(index)}
                    className={'flex min-h-[80px] w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
                      (index === selectedIndex ? 'border-primary bg-background shadow-md' : 'border-border bg-card hover:bg-muted/60')}>
                    <CharacterBadge name={point.mascot} tone="paper" size="md" />
                    <span className="flex-1">
                      <span className="block text-sm font-bold">{point.label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{point.eyebrow}</span>
                    </span>
                    <span aria-hidden="true" className={'h-3 w-3 rounded-full border-2 ' + (index === selectedIndex ? 'border-primary bg-primary' : 'border-border bg-transparent')} />
                  </button>
                ))}
              </div>
              <div className={'relative flex min-h-[340px] flex-col overflow-hidden rounded-[2rem] p-5 sm:p-8 ' + selected.tone}>
                <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#344A3C]/80">A peek at your first page</p>
                <div className="paper-grain flex flex-1 flex-col rounded-[1.5rem] border border-[#E4DACE] bg-[#FFFCF7] px-6 py-7 text-[#2F4137] shadow-[0_16px_40px_-28px_rgba(38,59,53,.35)] sm:px-9 sm:py-9" aria-live="polite">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7B887B]">{selected.eyebrow}</p>
                  <h3 className="mt-5 font-editorial text-2xl leading-snug sm:text-3xl">{selected.title}</h3>
                  <p className="mt-5 max-w-lg font-editorial text-lg leading-8 text-[#58675C]">{selected.excerpt}</p>
                  <p className="mt-auto pt-8 font-editorial text-xl italic text-[#C87965]">Your story begins here.</p>
                </div>
                <Link to={startLink} className="mt-5 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:opacity-90">
                  Open this writing template
                  <CharacterBadge name="piko" tone="paper" size="xs" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">A softer way to connect</p>
            <h2 className="mt-4 font-editorial text-4xl leading-tight sm:text-5xl">Simple enough to begin. Meaningful enough to keep.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {paths.map((step) => (
              <article key={step.number} className="group rounded-[1.75rem] border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-md sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <CharacterBadge name={step.mascot} tone={step.tone} size="lg" />
                  <span className="font-editorial text-2xl text-muted-foreground/55">{step.number}</span>
                </div>
                <h3 className="mt-7 font-editorial text-2xl leading-snug">{step.heading}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-border bg-primary text-primary-foreground">
          <div className="paper-grain pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
          <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 py-14 sm:px-8 sm:py-16 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.2em] opacity-70">Whenever you are ready</p>
              <h2 className="mt-4 font-editorial text-3xl leading-tight sm:text-5xl">There is room here for your words.</h2>
              <p className="mt-4 text-sm leading-7 opacity-80 sm:text-base">Begin with one sentence. The rest can come later.</p>
            </div>
            <Link to={startLink} className="inline-flex min-h-12 shrink-0 items-center gap-3 rounded-full bg-[hsl(var(--surface-gold))] px-6 py-3 text-sm font-bold text-[#493D2A] transition-transform hover:-translate-y-0.5">
              <CharacterBadge name="lumi" tone="paper" size="xs" />
              Begin your letter
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-9 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link to="/" className="font-editorial text-xl font-semibold text-foreground">SendTheLetter</Link>
          <p>A little more meaning in every message.</p>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-5">
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/services" className="hover:text-foreground">Features</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Home;
