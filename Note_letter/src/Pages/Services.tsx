import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CharacterBadge from '../components/CharacterBadge';
import { avatarUrl, type AvatarId } from '../constants/avatars';

type ExperienceFeature = { avatar: AvatarId; title: string; body: string };

const features: ExperienceFeature[] = [
  { avatar: 'female-01', title: 'A thoughtful writing space', body: 'Create letters with a simple editor that keeps the focus on what you want to say.' },
  { avatar: 'female-02', title: 'Personal or public', body: 'Use the visibility options available when creating a letter to choose how it is shared.' },
  { avatar: 'female-03', title: 'A community of words', body: 'Explore public letters and discover different stories, perspectives, and moments.' },
  { avatar: 'male-01', title: 'Conversations', body: 'Continue the connection through the app’s messaging and letter discussion features.' },
  { avatar: 'male-02', title: 'Reactions and keepsakes', body: 'React to letters and revisit writing that meant something to you.' },
  { avatar: 'male-03', title: 'Music with a message', body: 'Add a music link to a letter when a song says what words cannot.' },
];

const Services = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border/70"><div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/" className="flex items-center gap-3"><CharacterBadge name="lumi" tone="forest" size="md" className="!h-10 !w-10" /><span className="font-editorial text-xl font-semibold">SendTheLetter</span></Link><nav className="flex items-center gap-5 text-sm font-medium text-muted-foreground sm:gap-8"><Link to="/about" className="hover:text-foreground">Our story</Link><Link to="/contact" className="hover:text-foreground">Contact</Link><Link to="/login" className="rounded-full bg-primary px-4 py-2.5 text-primary-foreground">Sign in</Link></nav></div></header>
    <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">The experience</p><h1 className="mt-5 font-editorial text-5xl leading-[1.08] sm:text-7xl">Everything starts with a few words.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">Tools to help you write, share, and stay connected—without making the experience feel complicated.</p></div>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ avatar, title, body }) => (
          <article
            key={title}
            className="rounded-3xl border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <img
              src={avatarUrl(avatar)}
              alt=""
              aria-hidden="true"
              width={80}
              height={80}
              loading="lazy"
              decoding="async"
              className="h-20 w-20 rounded-full border border-[#E8D0C2] bg-[#F4DBD1] object-cover"
            />
            <h2 className="mt-3 font-editorial text-2xl">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
          </article>
        ))}
      </div>
      <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-[hsl(var(--surface-sage))] p-8 text-[#263B35] sm:flex-row sm:items-center sm:p-10"><div><p className="text-xs font-bold uppercase tracking-[.18em] opacity-70">Ready when you are</p><h2 className="mt-2 font-editorial text-3xl sm:text-4xl">Put your thoughts into words.</h2></div><Link to="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#263B35] px-5 py-3 text-sm font-semibold text-white">Create your space <ArrowRight size={16}/></Link></div>
    </main>
  </div>
);
export default Services;
