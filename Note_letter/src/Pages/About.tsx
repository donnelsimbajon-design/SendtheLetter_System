import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CharacterBadge from '../components/CharacterBadge';

const About = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border/70"><div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/" className="flex items-center gap-3"><CharacterBadge name="lumi" tone="forest" size="md" className="!h-10 !w-10" /><span className="font-editorial text-xl font-semibold">SendTheLetter</span></Link><nav className="flex items-center gap-5 text-sm font-medium text-muted-foreground sm:gap-8"><Link to="/services" className="hover:text-foreground">Features</Link><Link to="/contact" className="hover:text-foreground">Contact</Link><Link to="/login" className="rounded-full bg-primary px-4 py-2.5 text-primary-foreground">Sign in</Link></nav></div></header>
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">Our story</p>
      <h1 className="mt-5 max-w-4xl font-editorial text-5xl leading-[1.08] sm:text-7xl">A place for the words that deserve to be kept.</h1>
      <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">SendTheLetter brings a little intention back to digital communication. It gives people room to write, share thoughts, and hold on to meaningful messages without the rush of an ordinary feed.</p>
      <div className="mt-16 grid gap-5 md:grid-cols-3">
        {([
          { mascot: 'lumi', tone: 'gold', title: 'Write with intention', body: 'A letter can be thoughtful, messy, joyful, or unfinished. The important thing is that it sounds like you.' },
          { mascot: 'susi', tone: 'sage', title: 'Share on your terms', body: 'Choose whether a letter is for the community or something you want to keep personal.' },
          { mascot: 'chika', tone: 'rose', title: 'Keep the conversation going', body: 'Connect through messages, comments, and reactions when you want to say a little more.' },
        ] as const).map(({ mascot, tone, title, body }) => <article key={title} className="rounded-3xl border border-border bg-card p-7"><CharacterBadge name={mascot} tone={tone} size="lg" /><h2 className="mt-6 font-editorial text-2xl">{title}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p></article>)}
      </div>
      <div className="mt-16 rounded-[2rem] bg-primary px-7 py-10 text-primary-foreground sm:px-12 sm:py-14"><h2 className="max-w-2xl font-editorial text-4xl leading-tight sm:text-5xl">The internet is loud. Your words don't have to be.</h2><p className="mt-4 max-w-xl leading-7 opacity-75">Make a little room for meaningful communication, one letter at a time.</p><Link to="/signup" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--surface-gold))] px-5 py-3 text-sm font-bold text-[#493D2A]">Start writing <ArrowRight size={16}/></Link></div>
    </main>
  </div>
);
export default About;
