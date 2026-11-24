import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getRevealGroupProps, getRevealItemProps, getRevealProps, usePublicMotionDisabled } from '../hooks/usePublicReveal';
import { useAuthStore } from '../store/authStore';
import CharacterBadge from '../components/CharacterBadge';

const About = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const motionDisabled = usePublicMotionDisabled();
  const intro = getRevealProps(motionDisabled);
  const heading = getRevealProps(motionDisabled, { delay: 0.05 });
  const description = getRevealProps(motionDisabled, { delay: 0.1 });
  const cardGroup = getRevealGroupProps(motionDisabled);
  const cardItem = getRevealItemProps(motionDisabled);
  const closing = getRevealProps(motionDisabled);

  return (
  <div className="min-h-screen bg-background text-foreground">
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <motion.p {...intro} className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">Our story</motion.p>
      <motion.h1 {...heading} className="mt-5 max-w-4xl break-words font-editorial text-4xl leading-[1.12] sm:text-6xl lg:text-7xl">A place for the words that deserve to be kept.</motion.h1>
      <motion.p {...description} className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">SendTheLetter brings a little intention back to digital communication. It gives people room to write, share thoughts, and hold on to meaningful messages without the rush of an ordinary feed.</motion.p>
      <motion.div {...cardGroup} className="mt-16 grid gap-5 md:grid-cols-3">
        {([
          { mascot: 'lumi', tone: 'gold', title: 'Write with intention', body: 'A letter can be thoughtful, messy, joyful, or unfinished. The important thing is that it sounds like you.' },
          { mascot: 'susi', tone: 'sage', title: 'Share on your terms', body: 'Choose whether a letter is for the community or something you want to keep personal.' },
          { mascot: 'chika', tone: 'rose', title: 'Keep the conversation going', body: 'Connect through messages, comments, and reactions when you want to say a little more.' },
        ] as const).map(({ mascot, tone, title, body }) => <motion.article {...cardItem} key={title} className="stl-depth-card rounded-3xl border border-border bg-card p-7"><CharacterBadge name={mascot} tone={tone} size="lg" /><h2 className="mt-6 font-editorial text-2xl">{title}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p></motion.article>)}
      </motion.div>
      <motion.div {...closing} className="stl-depth-card mt-16 rounded-[2rem] bg-primary px-7 py-10 text-primary-foreground sm:px-12 sm:py-14"><h2 className="max-w-2xl font-editorial text-4xl leading-tight sm:text-5xl">The internet is loud. Your words don't have to be.</h2><p className="mt-4 max-w-xl leading-7 opacity-75">Make a little room for meaningful communication, one letter at a time.</p><Link to={isAuthenticated ? '/dashboard/notes' : '/signup'} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--surface-gold))] px-5 py-3 text-sm font-bold text-[#493D2A]">{isAuthenticated ? 'Continue writing' : 'Start writing'} <CharacterBadge name="piko" tone="paper" size="xs" /></Link></motion.div>
    </main>
  </div>
  );
};
export default About;
