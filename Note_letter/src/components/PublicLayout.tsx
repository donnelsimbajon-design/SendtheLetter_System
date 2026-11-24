import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';
import { useWriterPreferences } from '../store/writerPreferences';
import { PublicMotionContext } from '../hooks/usePublicReveal';
import PublicHeader from './PublicHeader';

/**
 * Persistent shell for the four unauthenticated landing pages.
 *
 * The header is rendered here — outside of AnimatePresence — so it stays
 * mounted, sticky, and completely unaffected while the page below it
 * cross-fades. Only the routed outlet participates in the transition.
 */
const ScrollManager = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [hash]);

  return null;
};

const PublicLayout = () => {
  const location = useLocation();
  // Capturing the outlet element keeps the outgoing page's content intact
  // while AnimatePresence holds it for the exit animation.
  const outlet = useOutlet();
  const prefersReducedMotion = useReducedMotion();
  const appReduceMotion = useWriterPreferences((state) => state.preferences.reduceMotion);
  const motionDisabled = Boolean(prefersReducedMotion) || appReduceMotion;
  const isFirstRender = useRef(true);

  // Skip the route fade on the very first paint, but leave AnimatePresence's
  // initial context enabled so descendant scroll reveals can still start hidden.
  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  // Share links keep their standalone, header-less presentation.
  if (new URLSearchParams(location.search).has('s')) {
    return <PublicMotionContext.Provider value={motionDisabled}>{outlet}</PublicMotionContext.Provider>;
  }

  return (
    <PublicMotionContext.Provider value={motionDisabled}>
      <PublicHeader />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={motionDisabled || isFirstRender.current ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={motionDisabled ? { opacity: 1 } : { opacity: 0, y: -10 }}
          transition={{ duration: motionDisabled ? 0 : 0.22, ease: 'easeOut' }}
        >
          <ScrollManager />
          {outlet}
        </motion.div>
      </AnimatePresence>
    </PublicMotionContext.Provider>
  );
};

export default PublicLayout;
