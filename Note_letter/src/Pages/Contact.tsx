import WorldScene3D from '../components/WorldScene3D';
import { Link } from 'react-router-dom';
import CharacterBadge from '../components/CharacterBadge';

const Contact = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border/70 bg-background/95"><div className="mx-auto flex min-h-[72px] min-w-0 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-8"><Link to="/" aria-label="SendTheLetter home" className="inline-flex shrink-0 items-center"><img src="/sendtheletter-logo.svg" alt="SendTheLetter" className="h-10 w-[148px] object-contain object-left sm:h-11 sm:w-[190px]" /></Link><Link to="/" className="inline-flex min-h-11 shrink-0 items-center text-xs font-bold text-muted-foreground hover:text-foreground sm:text-sm">Back home</Link></div></header>
    <main className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_.8fr] lg:items-center">
      <WorldScene3D kind="messages" title="SendTheLetter interactive 3D experience" className="mb-7 h-[210px] w-full lg:col-span-2 " />

      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">Get in touch</p><h1 className="mt-5 break-words font-editorial text-4xl leading-[1.1] sm:text-7xl">We'd love to hear from you.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">Have a question, an idea, or feedback about SendTheLetter? Reach out by email and tell us what's on your mind.</p></div>
      <div className="stl-depth-card rounded-[2rem] border border-border bg-card p-7 shadow-sm sm:p-9"><CharacterBadge name="chika" tone="gold" size="xl" /><h2 className="mt-6 font-editorial text-3xl">Send us a note</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">For questions and feedback, use the contact email listed for the project.</p><a href="mailto:hello@sendtheletter.com" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90"><CharacterBadge name="piko" tone="paper" size="xs" /> Email SendTheLetter</a><p className="mt-4 text-center text-xs text-muted-foreground">Your email app will open with a new message.</p></div>
    </main>
  </div>
);
export default Contact;
