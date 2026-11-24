import { useEffect, useState } from 'react';
import { AnimatePresence, motion, type Transition, type Variants } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePublicMotionDisabled } from '../hooks/usePublicReveal';

const navigation = [
  { label: 'Our story', to: '/about' },
  { label: 'The experience', to: '/services' },
  { label: 'Contact', to: '/contact' },
] as const;

// One underline per link: hover reveals it, the active route keeps it visible.
const desktopLinkClass = (isActive: boolean) => [
  'relative inline-flex items-center text-sm font-semibold transition-colors duration-200 ease-out',
  'after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-1 after:h-px',
  'after:origin-left after:scale-x-0 after:bg-current after:opacity-0',
  'after:transition-[transform,opacity] after:duration-200 after:ease-out',
  'hover:text-foreground hover:after:scale-x-100 hover:after:opacity-100',
  'motion-reduce:transition-none motion-reduce:after:transition-none',
  isActive ? 'text-foreground after:scale-x-100 after:opacity-100' : 'text-muted-foreground',
].join(' ');

const mobileLinkClass = (isActive: boolean) => [
  'relative block rounded-xl px-3 py-3 text-sm font-semibold text-foreground',
  'transition-[background-color,color] duration-200 ease-out hover:bg-muted hover:text-foreground',
  'after:pointer-events-none after:absolute after:inset-x-3 after:bottom-1.5 after:h-px',
  'after:origin-left after:scale-x-0 after:bg-current after:opacity-0',
  'after:transition-[transform,opacity] after:duration-200 after:ease-out',
  'hover:after:scale-x-100 hover:after:opacity-100',
  'motion-reduce:transition-none motion-reduce:after:transition-none',
  isActive ? 'bg-muted/70 after:scale-x-100 after:opacity-100' : '',
].join(' ');

const mobileListVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
};

const mobileItemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

/**
 * The single header used by every unauthenticated public page.
 *
 * Layout (desktop): logo left, primary navigation truly centered, and
 * account actions right. On smaller screens the navigation and actions move
 * into a toggleable panel so nothing overlaps and every destination stays
 * reachable.
 */
const PublicHeader = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const motionDisabled = usePublicMotionDisabled();

  // Close the mobile panel whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Escape is a familiar keyboard affordance for dismissing an open menu.
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);
  const closeMenu = () => setMenuOpen(false);

  const signInLabel = isAuthenticated ? 'My space' : 'Sign in';
  const signInHref = isAuthenticated ? '/dashboard' : '/login';
  const startLabel = isAuthenticated ? 'Write a letter' : 'Start writing';
  const startHref = isAuthenticated ? '/dashboard/notes?compose=1' : '/try';

  const menuTransition: Transition = motionDisabled
    ? { duration: 0 }
    : { duration: 0.25, ease: [0.22, 1, 0.36, 1] };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-xl">
      <div className="relative mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-8 md:min-h-[80px]">
        <Link
          to="/"
          aria-label="SendTheLetter home"
          className="inline-flex shrink-0 items-center rounded-lg transition-transform duration-200 ease-out hover:scale-[1.015] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
        >
          <img
            src="/sendtheletter-logo.svg"
            alt="SendTheLetter"
            className="h-10 w-[156px] object-contain object-left min-[380px]:w-[180px] sm:h-12 sm:w-[218px]"
          />
        </Link>

        <nav aria-label="Main navigation" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-sm font-semibold text-muted-foreground lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.to}
              className={desktopLinkClass(isActive(item.to))}
              aria-current={isActive(item.to) ? 'page' : undefined}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={signInHref}
            className="hidden rounded-full px-4 py-3 text-sm font-semibold transition-[background-color,color,transform] duration-200 ease-out hover:bg-muted hover:text-foreground active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 sm:inline-flex"
          >
            {signInLabel}
          </Link>
          <Link
            to={startHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] active:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 sm:px-6 sm:text-sm"
          >
            {startLabel}
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="public-header-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-[background-color,transform] duration-200 ease-out hover:bg-muted active:scale-[0.95] motion-reduce:transition-none motion-reduce:active:scale-100 lg:hidden"
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.nav
            id="public-header-mobile-menu"
            aria-label="Mobile navigation"
            className="overflow-hidden border-t border-border/70 bg-background px-4 pb-5 pt-3 sm:px-8 lg:hidden"
            initial={motionDisabled ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={motionDisabled ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
            transition={menuTransition}
          >
            <motion.ul
              className="flex flex-col gap-1"
              initial={motionDisabled ? false : 'hidden'}
              animate={motionDisabled ? undefined : 'show'}
              exit={motionDisabled ? undefined : 'hidden'}
              variants={motionDisabled ? undefined : mobileListVariants}
            >
              {navigation.map((item) => (
                <motion.li
                  key={item.to}
                  variants={motionDisabled ? undefined : mobileItemVariants}
                >
                  <Link
                    to={item.to}
                    onClick={closeMenu}
                    aria-current={isActive(item.to) ? 'page' : undefined}
                    className={mobileLinkClass(isActive(item.to))}
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li className="sm:hidden" variants={motionDisabled ? undefined : mobileItemVariants}>
                <Link
                  to={signInHref}
                  onClick={closeMenu}
                  className="block rounded-xl px-3 py-3 text-sm font-semibold text-foreground transition-[background-color,color] duration-200 ease-out hover:bg-muted hover:text-foreground motion-reduce:transition-none"
                >
                  {signInLabel}
                </Link>
              </motion.li>
            </motion.ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default PublicHeader;
