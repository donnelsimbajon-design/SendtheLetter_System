import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CharacterBadge from '../components/CharacterBadge';

const Contact = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border/70"><div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/" className="flex items-center gap-3"><CharacterBadge name="lumi" tone="forest" size="md" className="!h-10 !w-10" /><span className="font-editorial text-xl font-semibold">SendTheLetter</span></Link><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Back home</Link></div></header>
    <main className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_.8fr] lg:items-center">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">Get in touch</p><h1 className="mt-5 font-editorial text-5xl leading-[1.08] sm:text-7xl">We'd love to hear from you.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">Have a question, an idea, or feedback about SendTheLetter? Reach out by email and tell us what's on your mind.</p></div>
      <div className="rounded-[2rem] border border-border bg-card p-7 shadow-sm sm:p-9"><CharacterBadge name="piko" tone="gold" size="xl" /><h2 className="mt-6 font-editorial text-3xl">Send us a note</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">For questions and feedback, use the contact email listed for the project.</p><a href="mailto:hello@sendtheletter.com" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90"><CharacterBadge name="piko" tone="paper" size="xs" /> Email SendTheLetter</a><p className="mt-4 text-center text-xs text-muted-foreground">Your email app will open with a new message.</p></div>
    </main>
  </div>
);
export default Contact;
