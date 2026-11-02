import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Mascot from '../components/Mascot';
import CharacterBadge from '../components/CharacterBadge';

const Home = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const startLink = isAuthenticated ? '/dashboard' : '/signup';

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3"><img src="/sendtheletter-logo.svg" alt="SendTheLetter" className="h-12 w-[205px] object-contain object-left sm:w-[240px]" /></Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex"><Link className="hover:text-foreground" to="/about">Our story</Link><Link className="hover:text-foreground" to="/services">What you can do</Link><Link className="hover:text-foreground" to="/contact">Contact</Link></nav>
          <div className="flex items-center gap-2"><Link to={isAuthenticated ? '/dashboard' : '/login'} className="hidden rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-muted sm:inline-flex">{isAuthenticated ? 'My space' : 'Sign in'}</Link><Link to={startLink} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5">Start writing <ArrowRight size={15} /></Link></div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.04fr_.96fr] lg:gap-16 lg:pb-28">
          <div className="relative z-10">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground"><span className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" /> A little more human, a little less hurried</p>
            <h1 className="font-editorial text-[clamp(3.3rem,7vw,6.6rem)] leading-[.99] tracking-[-.045em]">Some things are <span className="italic text-[hsl(var(--accent))]">better</span> in a letter.</h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">A thoughtful place to write what matters, keep the words you aren't ready to send, and share a little more of yourself with the people who matter.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3"><Link to={startLink} className="inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5">Write your first letter <CharacterBadge name="lumi" tone="paper" size="sm" /></Link><Link to="/services" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold hover:bg-muted">Explore the experience <ArrowRight size={16} /></Link></div>
            <div className="mt-12 flex items-center gap-8 border-t border-border pt-6"><div><p className="font-editorial text-2xl">Your pace</p><p className="mt-1 text-xs text-muted-foreground">No rush, no pressure</p></div><div className="h-10 w-px bg-border" /><div><p className="font-editorial text-2xl">Your words</p><p className="mt-1 text-xs text-muted-foreground">A space that feels yours</p></div></div>
          </div>

          <div className="relative mx-auto w-full max-w-[540px]">
            <Mascot name="lumi" className="pointer-events-none absolute -right-2 -top-12 z-20 h-28 w-28 drop-shadow-lg sm:h-36 sm:w-36" alt="Lumi, your friendly letter companion" loading="eager" />
            <div className="absolute -right-5 top-0 h-32 w-32 rounded-full bg-[hsl(var(--surface-sage))] opacity-70 blur-2xl" />
            <div className="absolute -bottom-6 -left-4 h-40 w-40 rounded-full bg-[hsl(var(--surface-rose))] opacity-80 blur-2xl" />
            <div className="relative rotate-[2deg] rounded-[2.5rem] bg-[hsl(var(--surface-sage))] p-4 shadow-[0_28px_80px_-35px_rgba(38,59,53,.45)] sm:p-6">
              <div className="paper-grain rounded-[2rem] bg-[#F9F5ED] px-7 py-9 text-[#303B33] sm:px-10 sm:py-12">
                <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.24em] text-[#718075]">A note for someone</span><CharacterBadge name="piko" size="xs" tone="rose" /></div>
                <div className="mt-10 font-editorial text-4xl leading-tight sm:text-5xl">Dear you,</div>
                <p className="mt-6 font-editorial text-lg leading-8 text-[#59645B] sm:text-xl">I hope you remember that the little things you do, the kindness you give, and the words you share can mean more than you know.</p>
                <p className="mt-7 font-editorial text-lg italic text-[#59645B]">Keep a little space for wonder.</p>
                <div className="mt-12 flex items-end justify-between border-t border-[#DCD8CE] pt-5"><span className="font-editorial text-2xl italic text-[#C87965]">With care,</span><span className="text-xs tracking-[.15em] text-[#8D988E]">✳︎ ALWAYS</span></div>
              </div>
            </div>
            <div className="absolute -bottom-7 right-1 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg sm:right-[-20px]"><div className="flex items-center gap-2 text-sm font-semibold"><CharacterBadge name="sely" size="sm" tone="rose" /> Made for meaningful words</div></div>
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-3 md:py-16">
            {([
              { mascot: 'lumi', tone: 'gold', title: 'Write freely', body: 'A calm, considered space to put your thoughts into words.' },
              { mascot: 'susi', tone: 'sage', title: 'Keep it personal', body: 'Choose what you share and what stays yours.' },
              { mascot: 'basa', tone: 'rose', title: 'Hold on to moments', body: 'Keep meaningful letters close and return whenever you need.' },
            ] as const).map(({ mascot, tone, title, body }) => <article key={title} className="flex gap-4"><CharacterBadge name={mascot} tone={tone} size="lg" /><div><h2 className="font-editorial text-xl">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div></article>)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8 sm:py-28">
          <div className="mb-4 flex justify-center"><CharacterBadge name="tala" tone="gold" size="lg" /></div><h2 className="mx-auto mt-5 max-w-2xl font-editorial text-4xl leading-tight sm:text-5xl">A few honest words can travel a long way.</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground">Start with a blank page. We'll keep the space ready.</p><Link to={startLink} className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground">Find your words <ArrowRight size={16}/></Link>
        </section>
      </main>
      <footer className="border-t border-border bg-card"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8"><span className="font-editorial text-lg font-semibold text-foreground">SendTheLetter</span><span>A little more meaning in every message.</span><div className="flex gap-5"><Link to="/about" className="hover:text-foreground">About</Link><Link to="/services" className="hover:text-foreground">Features</Link><Link to="/contact" className="hover:text-foreground">Contact</Link></div></div></footer>
    </div>
  );
};

export default Home;
