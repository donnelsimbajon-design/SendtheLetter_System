import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, FileText, Heart, PenLine, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNoteStore } from '../../store/noteStore';
import Mascot from '../../components/Mascot';

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const { notes, drafts, fetchMyLetters, fetchDrafts } = useNoteStore();

  useEffect(() => {
    void fetchMyLetters();
    void fetchDrafts();
  }, [fetchMyLetters, fetchDrafts]);

  const cards = [
    { label: 'Your letters', value: notes.length, icon: FileText, tone: 'bg-[hsl(var(--surface-sage))] text-[#263B35]' },
    { label: 'Saved drafts', value: drafts.length, icon: BookOpen, tone: 'bg-[hsl(var(--surface-gold))] text-[#55462A]' },
    { label: 'A place to begin', value: 'Today', icon: Heart, tone: 'bg-[hsl(var(--surface-rose))] text-[#68444D]' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-9 text-primary-foreground sm:px-10 sm:py-12">
        <div className="paper-grain absolute inset-0 opacity-30" />
        <div className="relative z-10 max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] opacity-75"><Sparkles size={14} /> A quieter kind of connection</p>
          <h1 className="font-editorial text-4xl leading-[1.12] sm:text-5xl">Good to have you here, {user?.username || 'writer'}.</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 opacity-80 sm:text-base">Take a breath, find the words, and send something that matters. Your next letter can start right here.</p>
          <Link to="/dashboard/notes" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--surface-gold))] px-5 py-3 text-sm font-bold text-[#493D2A] transition-transform hover:-translate-y-0.5">Write a letter <PenLine size={16} /></Link>
        </div>
        <Mascot name="lumi" className="pointer-events-none absolute bottom-0 right-4 z-10 hidden h-48 w-48 drop-shadow-lg md:block lg:h-56 lg:w-56" />
        <div className="pointer-events-none absolute -bottom-20 -right-12 hidden h-72 w-72 rotate-[-12deg] rounded-[2.5rem] border border-white/20 bg-white/10 p-6 sm:block">
          <div className="h-full rounded-[1.8rem] border border-white/20 bg-white/10 p-6"><div className="h-2 w-16 rounded-full bg-white/40" /><div className="mt-8 space-y-3"><div className="h-2 w-full rounded-full bg-white/30" /><div className="h-2 w-4/5 rounded-full bg-white/30" /><div className="h-2 w-5/6 rounded-full bg-white/30" /><div className="h-2 w-2/3 rounded-full bg-white/30" /></div><div className="mt-10 font-editorial text-2xl italic opacity-70">with care,</div></div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}><Icon size={18} /></span></div>
            <p className="mt-4 font-editorial text-3xl">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">Your collection</p><h2 className="mt-1 font-editorial text-2xl">Recently written</h2></div><Link to="/dashboard/notes" className="text-sm font-semibold text-primary">View all <ArrowRight className="ml-1 inline" size={15} /></Link></div>
          {notes.length ? (
            <div className="mt-5 divide-y divide-border">{notes.slice(0, 4).map((note) => <div key={note.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="truncate font-semibold">{note.title || 'Untitled letter'}</p><p className="mt-1 truncate text-sm text-muted-foreground">{note.content}</p></div><span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{note.isPublic ? 'Public' : 'Private'}</span></div>)}</div>
          ) : (
            <div className="mt-6 rounded-2xl bg-background px-5 py-8 text-center"><Mascot name="sely" className="mx-auto h-24 w-24" /><p className="mt-4 font-semibold">Your first letter is waiting</p><p className="mt-1 text-sm text-muted-foreground">Start with a thought, a memory, or a simple hello.</p><Link to="/dashboard/notes" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">Write your first letter <ArrowRight size={15} /></Link></div>
          )}
        </div>
        <div className="rounded-3xl border border-border bg-[hsl(var(--surface-gold))] p-6 text-[#493D2A] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.16em] opacity-70">A small reminder</p><h2 className="mt-3 font-editorial text-3xl leading-tight">The best letters sound like you.</h2><p className="mt-3 text-sm leading-6 opacity-80">You don't need perfect words. Just honest ones. Keep a draft, take your time, and come back when you're ready.</p>
          <Link to="/dashboard/notes" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#493D2A] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">Open your letters <ArrowRight size={15} /></Link>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
