import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import CharacterBadge from '../components/CharacterBadge';
import Mascot, { type MascotName } from '../components/Mascot';
import type { CharacterTone } from '../components/CharacterBadge';

type Feature = { mascot: MascotName; tone: CharacterTone; title: string; body: string; label: string };
const features: Feature[] = [
  { mascot: 'lumi', tone: 'gold', title: 'Write in your own words', body: 'Start from a blank page or choose a gentle writing template. Save drafts and return when you are ready.', label: 'Your writing desk' },
  { mascot: 'tala', tone: 'rose', title: 'Make every page yours', body: 'Choose a writing font, paper color, category, and optional photo or music link.', label: 'Personal expression' },
  { mascot: 'susi', tone: 'sage', title: 'Choose what you share', body: 'Keep letters private in your library, or choose to publish a letter for the community.', label: 'Privacy choices' },
  { mascot: 'basa', tone: 'gold', title: 'Discover other stories', body: 'Explore published public letters, search by topic, and find writers whose words resonate.', label: 'Community' },
  { mascot: 'chika', tone: 'sage', title: 'Connect with writers', body: 'Follow, find friends, and exchange messages with people in your writing community.', label: 'Conversations' },
  { mascot: 'araw', tone: 'rose', title: 'Keep a letter for later', body: 'Choose a future release date or create a time capsule to revisit words at a meaningful moment.', label: 'Scheduled writing' },
];

const Services = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isVerifying = useAuthStore(state => state.isVerifying);
  const startLink = isAuthenticated ? '/dashboard/notes?compose=1' : '/try';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-primary-foreground">Skip to main content</a>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link to="/" className="inline-flex items-center" aria-label="SendTheLetter home"><img src="/sendtheletter-logo.svg" alt="SendTheLetter" width="180" height="48" className="h-11 w-[155px] object-contain object-left sm:w-[195px]" /></Link>
          <nav aria-label="Page navigation" className="flex items-center gap-3 text-xs font-bold sm:gap-5 sm:text-sm">
            <Link to="/about" className="hidden hover:underline sm:inline">Our story</Link>
            <Link to="/contact" className="hidden hover:underline sm:inline">Contact</Link>
            {isVerifying ? <span role="status" className="text-muted-foreground">Checking session…</span> : <Link to={isAuthenticated ? '/dashboard' : '/login'} className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 py-2 text-primary-foreground hover:opacity-90">{isAuthenticated ? 'My space' : 'Sign in'}</Link>}
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="relative overflow-hidden border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl items-center gap-7 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_.55fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">The SendTheLetter experience</p>
              <h1 className="mt-5 max-w-3xl break-words font-editorial text-4xl leading-[1.1] tracking-tight sm:text-6xl">A little more room for what matters.</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">Letters can hold feelings that ordinary messages sometimes cannot. Write freely, keep a thought close, or share a story when you are ready.</p>
              <Link to={startLink} className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">
                <CharacterBadge name="lumi" tone="paper" size="xs" /> Start a letter
              </Link>
            </div>
            <div className="stl-depth-hero relative flex min-h-[220px] items-center justify-center rounded-[2rem] bg-[hsl(var(--surface-sage))] sm:min-h-[300px]">
              <div aria-hidden="true" className="paper-grain absolute inset-4 rounded-[1.6rem] border border-white/35 bg-white/15" />
              <Mascot name="lumi" className="relative h-52 w-52 drop-shadow-lg sm:h-64 sm:w-64" alt="Lumi, the friendly SendTheLetter mascot" />
              <CharacterBadge name="tala" tone="gold" size="lg" className="absolute right-7 top-7" />
              <CharacterBadge name="sely" tone="rose" size="md" className="absolute bottom-7 left-7" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">Made for every kind of letter</p>
            <h2 className="mt-4 font-editorial text-4xl leading-tight sm:text-5xl">Your words. Your rhythm. Your space.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">Use the features that feel right for you. You do not have to share a letter to make writing meaningful.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(feature => (
              <article key={feature.title} className="stl-depth-card flex min-h-[265px] flex-col rounded-[1.75rem] border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-md sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <CharacterBadge name={feature.mascot} tone={feature.tone} size="lg" />
                  <span className="text-right text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{feature.label}</span>
                </div>
                <h3 className="mt-7 font-editorial text-2xl leading-tight">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-[hsl(var(--surface-sage))]/35">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <CharacterBadge name="susi" tone="paper" size="lg" />
              <h2 className="mt-5 font-editorial text-3xl leading-tight sm:text-4xl">Share with care.</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">Private drafts stay in your personal library. Public letters can be discovered and shared through a public link. Scheduled letters need a future release time.</p>
            </div>
            <div className="stl-depth-card rounded-[1.75rem] border border-border bg-card p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--accent))]">A few things to know</p>
              <ul className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <li><strong className="text-foreground">Private or public:</strong> you choose how a letter is stored and whether it appears in the community.</li>
                <li><strong className="text-foreground">Scheduled letters:</strong> a chosen date controls when a scheduled letter becomes available. This is not automatic email delivery to a recipient.</li>
                <li><strong className="text-foreground">Writing your way:</strong> customize your paper and drafts without committing to a public post.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[hsl(var(--accent))]">Ready when you are</p>
            <h2 className="mt-3 font-editorial text-3xl sm:text-4xl">Put your thoughts into words.</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">You can start with a simple hello.</p>
          </div>
          <Link to={startLink} className="inline-flex min-h-12 shrink-0 items-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"><CharacterBadge name="piko" tone="paper" size="xs" /> Begin writing</Link>
        </section>
      </main>
    </div>
  );
};
export default Services;
