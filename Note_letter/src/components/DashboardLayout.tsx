import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getImageUrl } from '../lib/utils';
import NotificationsMenu from './NotificationsMenu';
import CharacterBadge from './CharacterBadge';
import ProfileDropdown from './ProfileDropdown';
import { useWriterPreferences } from '../store/writerPreferences';

const navigation = [
  { to: '/dashboard', label: 'Overview', mascot: 'lumi', end: true },
  { to: '/dashboard/notes', label: 'My library', mascot: 'basa', end: false },
  { to: '/dashboard/community', label: 'Community', mascot: 'piko', end: false },
  { to: '/dashboard/messages', label: 'Messages', mascot: 'chika', end: false },
  { to: '/dashboard/profile', label: 'My profile', mascot: 'sely', end: false },
] as const;

const DashboardLayout = () => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const preferences = useWriterPreferences(state => state.preferences);
  const loadForUser = useWriterPreferences(state => state.loadForUser);

  useEffect(() => {
    loadForUser(user?.id);
  }, [loadForUser, user?.id]);

  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'warm') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', preferences.theme);
    root.dataset.readingSize = preferences.readingSize;
    root.dataset.reduceMotion = String(preferences.reduceMotion);
  }, [preferences]);

  useEffect(() => { setShowAccountMenu(false); }, [location.pathname]);

  const pageTitle = navigation.find((item) => item.to === location.pathname)?.label || 'Your space';

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-primary-foreground">Skip to main content</a>
      <header className="fixed inset-x-0 top-0 z-40 h-[72px] border-b border-border/80 bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img src="/sendtheletter-logo.svg" alt="SendTheLetter" className="h-10 w-[154px] object-contain object-left sm:h-12 sm:w-[218px]" />
          </Link>
          <nav aria-label="Workspace navigation" className="hidden min-w-0 flex-1 items-center justify-center gap-2 xl:flex">
            {navigation.map(({ to, label, mascot, end }) => (
              <NavLink key={to} to={to} end={end}
                aria-label={label}
                title={label}
                className={({ isActive }) => `group relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isActive ? 'border-primary bg-primary shadow-sm' : 'border-transparent bg-transparent hover:border-border hover:bg-muted'}`}>
                <CharacterBadge name={mascot} tone="paper" size="sm" />
                <span className="sr-only">{label}</span>
                <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-bold text-foreground shadow-lg group-hover:block group-focus-visible:block">
                  {label}
                </span>
              </NavLink>
            ))}
          </nav>
          <div className="ml-2 flex shrink-0 items-center gap-1 sm:gap-4">
            <Link to="/dashboard/notes?compose=1" className="hidden min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 2xl:inline-flex"><CharacterBadge name="lumi" tone="paper" size="xs" /> Write a letter</Link>
            <NotificationsMenu />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountMenu(value => !value)}
                aria-label="Account, settings and appearance"
                aria-haspopup="menu"
                aria-expanded={showAccountMenu}
                className="group flex h-11 items-center gap-2 rounded-full border border-border bg-background/80 p-1 pr-2.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary sm:gap-3 sm:pr-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--surface-gold))] font-semibold text-[#394a3b] ring-2 ring-card">
                  {user?.avatar ? <img src={getImageUrl(user.avatar)} alt="" className="h-full w-full object-cover" /> : (user?.username?.slice(0, 1).toUpperCase() || 'W')}
                </span>
                <span className="hidden max-w-40 min-w-0 text-left sm:block">
                  <span className="block truncate text-sm font-semibold leading-tight">{user?.username || 'Writer'}</span>
                  <span className="block text-[11px] text-muted-foreground">My account</span>
                </span>
                <span aria-hidden="true" className={`ml-1 h-2 w-2 border-b-2 border-r-2 border-muted-foreground transition-transform ${showAccountMenu ? 'rotate-[225deg]' : 'rotate-45'}`} />
              </button>
              <ProfileDropdown isOpen={showAccountMenu} onClose={() => setShowAccountMenu(false)} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] pt-[72px]">
        <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[248px] shrink-0 flex-col border-r border-border/70 bg-background/80 px-5 py-8 lg:flex xl:hidden">
          <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[.18em] text-muted-foreground">Workspace</p>
          <nav className="space-y-1.5">
            {navigation.map(({ to, label, mascot, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <CharacterBadge name={mascot} tone="paper" size="sm" />{label}
              </NavLink>
            ))}
            {user?.role === 'admin' && <NavLink to="/admin" className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><CharacterBadge name="susi" tone="sage" size="sm" />Admin panel</NavLink>}
          </nav>
          <div className="mt-auto rounded-2xl bg-[hsl(var(--surface-rose))] p-4 text-[#49363B]">
            <p className="font-editorial text-lg leading-snug">Some words deserve a little more time.</p>
            <p className="mt-2 text-xs leading-relaxed opacity-80">Make room for the things you want to say.</p>
            <Link to="/dashboard/notes" className="mt-3 inline-flex items-center gap-2 text-xs font-bold">Write a letter <CharacterBadge name="lumi" size="xs" tone="paper" /></Link>
          </div>
        </aside>

        <main id="main-content" tabIndex={-1} className="min-w-0 w-full flex-1 px-3 pb-32 pt-5 sm:px-6 sm:pt-7 lg:px-10 lg:py-10">
          <div className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-3 lg:hidden">
            <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Workspace</p><p className="font-editorial text-2xl">{pageTitle}</p></div>
            <Link to="/dashboard/settings" className="rounded-full border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted" aria-label="Open settings">Settings</Link>
          </div>
          <Outlet />
        </main>
      </div>

      <nav aria-label="Mobile workspace navigation" className={'fixed inset-x-0 bottom-0 z-40 grid ' + (user?.role === 'admin' ? 'grid-cols-6' : 'grid-cols-5') + ' border-t border-border bg-card/95 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl lg:hidden sm:px-3'}>
        {navigation.slice(0, 2).map(({ to, label, mascot, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => 'flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-[10px] font-semibold sm:text-xs ' + (isActive ? 'text-primary' : 'text-muted-foreground')}>
            <CharacterBadge name={mascot} tone="paper" size="sm" /><span className="max-w-full truncate text-center">{label === "My library" ? "Library" : label}</span>
          </NavLink>
        ))}
        <Link to="/dashboard/notes?compose=1" aria-label="Write a new letter" className="relative -mt-3 flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl bg-primary px-1 py-2 text-[10px] font-bold text-primary-foreground shadow-md sm:text-xs">
          <CharacterBadge name="lumi" tone="paper" size="md" />
          <span>Write</span>
        </Link>
        {navigation.slice(2, 4).map(({ to, label, mascot, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => 'flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-[10px] font-semibold sm:text-xs ' + (isActive ? 'text-primary' : 'text-muted-foreground')}>
            <CharacterBadge name={mascot} tone="paper" size="sm" /><span className="max-w-full truncate text-center">{label === "My profile" ? "Profile" : label}</span>
          </NavLink>
        ))}
        {user?.role === 'admin' && <NavLink to="/admin" className={({ isActive }) => 'flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-[10px] font-semibold ' + (isActive ? 'text-primary' : 'text-muted-foreground')}><CharacterBadge name="susi" tone="sage" size="sm" /><span>Admin</span></NavLink>}
      </nav>
    </div>
  );
};

export default DashboardLayout;
