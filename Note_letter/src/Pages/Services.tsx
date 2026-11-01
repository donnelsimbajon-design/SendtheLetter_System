import { Link } from 'react-router-dom';
import { ArrowRight, BookHeart, Globe2, Heart, LockKeyhole, Mail, MessageCircle, Music2, PenLine } from 'lucide-react';

const features = [
  {icon:PenLine,title:'A thoughtful writing space',body:'Create letters with a simple editor that keeps the focus on what you want to say.',tone:'gold'},
  {icon:LockKeyhole,title:'Personal or public',body:'Use the visibility options available when creating a letter to choose how it is shared.',tone:'sage'},
  {icon:Globe2,title:'A community of words',body:'Explore public letters and discover different stories, perspectives, and moments.',tone:'rose'},
  {icon:MessageCircle,title:'Conversations',body:'Continue the connection through the app’s messaging and letter discussion features.',tone:'blue'},
  {icon:Heart,title:'Reactions and keepsakes',body:'React to letters and revisit writing that meant something to you.',tone:'sage'},
  {icon:Music2,title:'Music with a message',body:'Add a music link to a letter when a song says what words cannot.',tone:'gold'},
];

const Services = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border/70"><div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><BookHeart size={21}/></span><span className="font-editorial text-xl font-semibold">SendTheLetter</span></Link><nav className="flex items-center gap-5 text-sm font-medium text-muted-foreground sm:gap-8"><Link to="/about" className="hover:text-foreground">Our story</Link><Link to="/contact" className="hover:text-foreground">Contact</Link><Link to="/login" className="rounded-full bg-primary px-4 py-2.5 text-primary-foreground">Sign in</Link></nav></div></header>
    <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">The experience</p><h1 className="mt-5 font-editorial text-5xl leading-[1.08] sm:text-7xl">Everything starts with a few words.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">Tools to help you write, share, and stay connected—without making the experience feel complicated.</p></div>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{features.map(({icon:Icon,title,body,tone})=><article key={title} className="rounded-3xl border border-border bg-card p-7 transition-transform hover:-translate-y-1"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone==='gold'?'bg-[hsl(var(--surface-gold))] text-[#55462A]':tone==='sage'?'bg-[hsl(var(--surface-sage))] text-[#263B35]':tone==='rose'?'bg-[hsl(var(--surface-rose))] text-[#68444D]': 'bg-[#DCE5F0] text-[#405B7B]'}`}><Icon size={22}/></span><h2 className="mt-6 font-editorial text-2xl">{title}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p></article>)}</div>
      <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-[hsl(var(--surface-sage))] p-8 text-[#263B35] sm:flex-row sm:items-center sm:p-10"><div><p className="text-xs font-bold uppercase tracking-[.18em] opacity-70">Ready when you are</p><h2 className="mt-2 font-editorial text-3xl sm:text-4xl">Put your thoughts into words.</h2></div><Link to="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#263B35] px-5 py-3 text-sm font-semibold text-white">Create your space <ArrowRight size={16}/></Link></div>
    </main>
  </div>
);
export default Services;
