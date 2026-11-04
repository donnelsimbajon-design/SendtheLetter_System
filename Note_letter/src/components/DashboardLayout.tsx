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

const railLink = (active: boolean) =>
  'group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2D49D] xl:w-full xl:justify-start xl:gap-3 xl:px-3 ' +
  (active ? 'border-[#d7dacc] bg-[#f3f2e9] text-[#2d4d3c]' : 'border-transparent hover:border-white/20 hover:bg-white/10');

const MobileNavLink = ({ to, label, mascot, end, avatar }: {
  to: string;
  label: string;
  mascot: typeof navigation[number]['mascot'];
  end: boolean;
  avatar?: string;
}) => (
  <NavLink to={to} end={end} aria-label={label} title={label}
    className={({ isActive }) =>
      'flex min-h-12 min-w-0 flex-col items-center justify-center rounded-xl px-1 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-primary ' +
      (isActive ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted/60')
    }>
    {avatar
      ? <img src={getImageUrl(avatar)} alt="" className="h-8 w-8 rounded-full border-2 border-primary object-cover" />
      : <CharacterBadge name={mascot} tone="paper" size="sm" />}
    <span className="max-w-full truncate text-[9px] font-semibold leading-tight sm:text-[10px]">{label}</span>
  </NavLink>
);

export default function DashboardLayout() {
  const user = useAuthStore(state => state.user);
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

  return (
    <div className="min-h-screen min-w-0 bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-primary-foreground">
        Skip to main content
      </a>

      {/* Instagram-inspired mobile header keeps the full SendTheLetter brand. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border/80 bg-card/95 px-4 backdrop-blur-xl lg:hidden">
        <Link to="/dashboard" className="inline-flex min-w-0 items-center" aria-label="SendTheLetter home">
          <img src="/sendtheletter-logo.svg" alt="SendTheLetter" className="h-11 w-[154px] object-contain object-left sm:w-[195px]" />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <NotificationsMenu />
          <div className="relative">
            <button type="button"
              onClick={() => setShowAccountMenu(value => !value)}
              aria-label="Account, settings and appearance"
              aria-haspopup="menu"
              aria-expanded={showAccountMenu}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
              {user?.avatar
                ? <img src={getImageUrl(user.avatar)} alt="" className="h-9 w-9 rounded-full object-cover" />
                : <CharacterBadge name="sely" tone="paper" size="sm" />}
            </button>
            <ProfileDropdown isOpen={showAccountMenu} onClose={() => setShowAccountMenu(false)} />
          </div>
        </div>
      </header>

      {/* On desktop, replace the top navigation with one slim, fixed dark rail. */}
      <aside aria-label="SendTheLetter sidebar" className="fixed inset-y-0 left-0 z-40 hidden w-[84px] flex-col items-center border-r border-[#405e4b] bg-[#2b4839] px-3 pb-5 pt-5 text-[#F7F2E9] lg:flex xl:w-[204px] xl:items-stretch xl:px-4">
        <Link to="/dashboard" aria-label="SendTheLetter home" title="SendTheLetter"
          className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors xl:w-full xl:justify-start xl:gap-3 xl:px-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2D49D]">
          <CharacterBadge name="sely" tone="paper" size="md" />
          <span className="hidden font-editorial text-lg font-semibold tracking-tight xl:inline">SendTheLetter</span>
          <span aria-hidden="true" className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground shadow-xl group-hover:block group-focus-visible:block">SendTheLetter</span>
        </Link>

        <nav aria-label="Workspace navigation" className="mt-7 flex min-h-0 w-full flex-1 flex-col items-center gap-2 xl:items-stretch">
          {navigation.slice(0, 4).map(({ to, label, mascot, end }) => (
            <NavLink key={to} to={to} end={end} aria-label={label} title={label}
              className={({ isActive }) => railLink(isActive)}>
              <CharacterBadge name={mascot} tone="paper" size="sm" />
              <span className="hidden text-[13px] font-semibold xl:inline">{label}</span>
              <span aria-hidden="true" className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground shadow-lg group-hover:block group-focus-visible:block">{label}</span>
            </NavLink>
          ))}

          <Link to="/dashboard/community?focus=search" aria-label="Search public letters" title="Search public letters"
            className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-transparent transition-colors xl:w-full xl:justify-start xl:gap-3 xl:px-3 hover:border-white/20 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2D49D]">
            <CharacterBadge name="suri" tone="paper" size="sm" />
            <span className="hidden text-[13px] font-semibold xl:inline">Search letters</span>
            <span aria-hidden="true" className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground shadow-lg group-hover:block group-focus-visible:block">Search public letters</span>
          </Link>

          <Link to="/dashboard/notes?compose=1" aria-label="Write a new letter" title="Write a letter"
            className="group relative mt-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border xl:w-full xl:justify-start xl:gap-3 xl:px-3 text-[#304736] border-[#8F7955]/50 bg-[#E1C998] transition-colors hover:bg-[#F2DAA9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2D49D]">
            <CharacterBadge name="tala" tone="paper" size="sm" />
            <span className="hidden text-[13px] font-bold xl:inline">Write a letter</span>
            <span aria-hidden="true" className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground shadow-lg group-hover:block group-focus-visible:block">Write a letter</span>
          </Link>

          <NavLink to={navigation[4].to} end={navigation[4].end} aria-label={navigation[4].label} title={navigation[4].label}
            className={({ isActive }) => railLink(isActive) + ' mt-auto'}>
            {user?.avatar
              ? <img src={getImageUrl(user.avatar)} alt="" className="h-9 w-9 rounded-full border-2 border-[#F2D49D] object-cover" />
              : <CharacterBadge name="sely" tone="paper" size="sm" />}
            <span className="hidden text-[13px] font-semibold xl:inline">{navigation[4].label}</span>
            <span aria-hidden="true" className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground shadow-lg group-hover:block group-focus-visible:block">{navigation[4].label}</span>
          </NavLink>
        </nav>

        <div className="mt-3 flex w-full shrink-0 flex-col items-center gap-2 border-t border-white/15 pt-3 xl:items-stretch">
          <NotificationsMenu placement="rail" />

          {user?.role === 'admin' && (
            <Link to="/admin" aria-label="Admin panel" title="Admin panel"
              className="group relative flex h-12 w-12 items-center justify-center rounded-xl transition-colors xl:w-full xl:justify-start xl:gap-3 xl:px-3 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#F2D49D]">
              <CharacterBadge name="susi" tone="paper" size="sm" />
              <span aria-hidden="true" className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground shadow-lg group-hover:block group-focus-visible:block">Admin panel</span>
            </Link>
          )}

          <div className="relative">
            <button type="button"
              onClick={() => setShowAccountMenu(value => !value)}
              aria-label="Account, settings and appearance"
              title="More options"
              aria-haspopup="menu"
              aria-expanded={showAccountMenu}
              className="group relative flex h-12 w-12 items-center justify-center rounded-xl transition-colors xl:w-full xl:justify-start xl:gap-3 xl:px-3 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#F2D49D]">
              <CharacterBadge name="susi" tone="paper" size="sm" />
              <span aria-hidden="true" className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground shadow-lg group-hover:block group-focus-visible:block">More options</span>
            </button>
            <ProfileDropdown isOpen={showAccountMenu} onClose={() => setShowAccountMenu(false)} placement="rail" />
          </div>
        </div>
      </aside>

      <div className="min-h-screen min-w-0 pt-16 lg:pl-[84px] lg:pt-0 xl:pl-[204px]">
        <main id="main-content" tabIndex={-1}
          className="mx-auto min-w-0 w-full max-w-[1800px] px-3 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10 lg:pt-8 xl:px-10">
          <Outlet />
        </main>
      </div>

      {/* A compact bottom bar keeps every main destination reachable on phones. */}
      <nav aria-label="Mobile workspace navigation"
        className={'fixed inset-x-0 bottom-0 z-40 grid ' + (user?.role === 'admin' ? 'grid-cols-7' : 'grid-cols-6') +
          ' items-center gap-0.5 border-t border-border bg-card/95 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-4px_24px_rgba(0,0,0,.04)] backdrop-blur-xl lg:hidden sm:px-3'}>
        {navigation.slice(0, 3).map(item => <MobileNavLink key={item.to} {...item} />)}
        <Link to="/dashboard/notes?compose=1" aria-label="Write a new letter" title="Write a letter"
          className="relative -mt-3 flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl bg-primary text-primary-foreground shadow-md focus-visible:outline-2 focus-visible:outline-primary">
          <CharacterBadge name="tala" tone="paper" size="sm" />
          <span className="text-[9px] font-bold leading-tight sm:text-[10px]">Write</span>
        </Link>
        {navigation.slice(3).map(item => <MobileNavLink key={item.to} {...item} avatar={item.to === '/dashboard/profile' ? user?.avatar : undefined} />)}
        {user?.role === 'admin' && <Link to="/admin" aria-label="Admin panel" title="Admin panel" className="flex min-h-12 min-w-0 items-center justify-center rounded-xl hover:bg-muted"><CharacterBadge name="susi" tone="paper" size="sm" /></Link>}
      </nav>
    </div>
  );
}
