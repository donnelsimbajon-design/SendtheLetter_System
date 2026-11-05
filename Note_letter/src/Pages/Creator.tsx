import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CharacterBadge from '../components/CharacterBadge';

const Creator = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border/70 bg-background/95"><div className="mx-auto flex min-h-[72px] min-w-0 max-w-7xl items-center justify-between gap-2 px-4 py-2 sm:px-8"><Link to="/" aria-label="SendTheLetter home" className="inline-flex shrink-0 items-center"><img src="/sendtheletter-logo.svg" alt="SendTheLetter" className="h-10 w-[148px] object-contain object-left sm:h-11 sm:w-[190px]" /></Link><nav aria-label="Creator navigation" className="flex shrink-0 items-center gap-3 text-xs font-semibold text-muted-foreground sm:gap-5 sm:text-sm"><Link to="/" className="min-h-10 items-center hover:text-foreground sm:hidden">Home</Link><Link to="/about" className="hidden min-h-10 items-center hover:text-foreground sm:inline-flex">About</Link><Link to="/services" className="hidden min-h-10 items-center hover:text-foreground md:inline-flex">Features</Link><Link to="/contact" className="hidden min-h-10 items-center hover:text-foreground lg:inline-flex">Contact</Link></nav></div></header>
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <section className="grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div className="stl-depth-hero mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] bg-[hsl(var(--surface-sage))] p-3"><img src="/creator-profile.jpg" alt="SendTheLetter creator" className="aspect-[4/5] w-full rounded-[1.5rem] object-cover" onError={(event)=>{event.currentTarget.style.display='none';}}/><div className="p-5 text-center font-editorial text-2xl text-[#263B35]">The person behind the letters</div></div>
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">The creator</p><h1 className="mt-5 break-words font-editorial text-4xl leading-[1.1] sm:text-7xl">Building meaningful connection, one letter at a time.</h1><p className="mt-7 text-lg leading-8 text-muted-foreground">SendTheLetter began with a simple idea: make a digital space where words can breathe. It brings together thoughtful writing, community sharing, and conversations in one place.</p><Link to="/about" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Discover the story <ArrowRight size={16}/></Link></div>
      </section>
      <section className="mt-20 grid gap-5 md:grid-cols-3">{([
          { mascot: 'suri', tone: 'gold', title: 'Built with care', body: 'A modern web application shaped around a clear and useful experience.' },
          { mascot: 'sely', tone: 'rose', title: 'Made for people', body: 'The product puts expression, privacy choices, and connection first.' },
          { mascot: 'araw', tone: 'sage', title: 'Always evolving', body: 'The best improvements start by listening, testing, and refining.' },
        ] as const).map(({ mascot, tone, title, body }) => <article key={title} className="stl-depth-card rounded-3xl border border-border bg-card p-7"><CharacterBadge name={mascot} tone={tone} size="lg" /><h2 className="mt-5 font-editorial text-2xl">{title}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p></article>)}</section>
    </main>
  </div>
);
export default Creator;
