import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getImageUrl } from '../lib/utils';
import NotificationsMenu from './NotificationsMenu';
import CharacterBadge from './CharacterBadge';
import Mascot from './Mascot';
import MessageDock from './MessageDock';
import WorldScene3D, { type WorldKind } from './WorldScene3D';
import { useInboxStore } from '../store/inboxStore';
import ProfileDropdown from './ProfileDropdown';
import { useWriterPreferences } from '../store/writerPreferences';

const navigation = [
  { to: '/dashboard', label: 'Overview', mascot: 'lumi', end: true },
  { to: '/dashboard/notes', label: 'My library', mascot: 'basa', end: false },
  { to: '/dashboard/community', label: 'Community', mascot: 'piko', end: false },
  { to: '/dashboard/messages', label: 'Messages', mascot: 'chika', end: false },
  { to: '/dashboard/profile', label: 'My profile', mascot: 'sely', end: false },
] as const;

// These are the app's own illustrated SVG characters, not generic navigation glyphs.
const railNavigation = navigation.slice(0, 4);

const worldFor = (path: string): WorldKind => {
  if (path.includes('/notes')) return 'library';
  if (path.includes('/community')) return 'community';
  if (path.includes('/messages')) return 'messages';
  if (path.includes('/profile')) return 'profile';
  if (path.includes('/settings')) return 'settings';
  return 'overview';
};

const railLink = (active: boolean) =>
  'stl-depth-nav relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-transparent transition-[transform,opacity,box-shadow] duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none motion-reduce:transition-none ' +
  (active ? 'opacity-100 ring-1 ring-border/70 shadow-sm' : 'opacity-90 hover:opacity-100');

const MobileNavLink = ({ to, label, mascot, end, avatar, unreadCount = 0 }: {
  to: string;
  label: string;
  mascot: typeof navigation[number]['mascot'];
  end: boolean;
  avatar?: string;
  unreadCount?: number;
}) => (
  <NavLink to={to} end={end} aria-label={label} title={label}
    className={({ isActive }) =>
      'stl-depth-nav relative flex min-h-12 min-w-0 flex-col items-center justify-center rounded-xl bg-transparent px-1 py-1 transition-[transform,opacity] duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-primary motion-reduce:transform-none ' +
      (isActive ? 'text-primary opacity-100' : 'text-muted-foreground opacity-80 hover:opacity-100')
    }>
    {avatar
      ? <img src={getImageUrl(avatar)} alt="" className="h-8 w-8 rounded-full border-2 border-primary object-cover" />
      : <CharacterBadge name={mascot} tone="paper" size="sm" />}
    {unreadCount > 0 && <span className="absolute right-0 top-0 min-w-5 rounded-full bg-primary px-1 text-center text-[10px] font-bold text-primary-foreground" aria-label={`${unreadCount} unread messages`}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
    <span className="max-w-full truncate text-[9px] font-semibold leading-tight sm:text-[10px]">{label}</span>
  </NavLink>
);

export default function DashboardLayout() {
  const user = useAuthStore(state => state.user);
  const inboxConversations = useInboxStore(state => state.conversations);
  const unreadMessages = inboxConversations.reduce((sum, item) => sum + Math.max(0, item.unreadCount || 0), 0);
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
                : <Mascot name="sely" className="h-10 w-10" />}
            </button>
            <ProfileDropdown isOpen={showAccountMenu} onClose={() => setShowAccountMenu(false)} />
          </div>
        </div>
      </header>

      {/* Original SendTheLetter character icons in a lightweight, translucent rail.
          No solid sidebar color, no copied social-network icons. */}
      <aside aria-label="SendTheLetter sidebar"
        className="stl-depth-rail fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col items-center border-r border-border/50 bg-background/40 px-3 pb-4 pt-4 text-foreground backdrop-blur-xl lg:flex">
        <Link to="/dashboard" aria-label="SendTheLetter home" title="SendTheLetter"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-transparent transition-[transform,opacity] duration-200 ease-out hover:scale-105 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none">
          <span className="relative block h-10 w-10 overflow-hidden rounded-xl" aria-hidden="true">
            <img src="/sendtheletter-logo.svg" alt="" className="absolute left-0 top-0 h-10 w-[158px] max-w-none" />
          </span>
        </Link>

        <nav aria-label="Workspace navigation"
          className="workspace-rail-primary mt-[clamp(40px,16vh,150px)] flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-visible pb-3">
          {railNavigation.map(({ to, label, mascot, end }) => (
            <NavLink key={to} to={to} end={end} aria-label={label} title={label}
              className={({ isActive }) => railLink(isActive)}>
              <Mascot name={mascot} className="h-10 w-10" />
              {label === "Messages" && unreadMessages > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1 text-center text-[10px] font-bold text-primary-foreground" aria-label={`${unreadMessages} unread messages`}>{unreadMessages > 99 ? "99+" : unreadMessages}</span>}
            </NavLink>
          ))}

          <Link to="/dashboard/community?focus=search" aria-label="Search public letters" title="Search public letters"
            className={railLink(false)}>
            <Mascot name="suri" className="h-10 w-10" />
          </Link>

          <Link to="/dashboard/notes?compose=1" aria-label="Write a new letter" title="Write a letter"
            className={railLink(false)}>
            <Mascot name="tala" className="h-10 w-10" />
          </Link>

          <NavLink to="/dashboard/profile" aria-label="My profile" title="My profile"
            className={({ isActive }) => railLink(isActive) + ' mt-auto'}>
            {({ isActive }) => user?.avatar
              ? <img src={getImageUrl(user.avatar)} alt="" className={'h-9 w-9 rounded-full object-cover ' + (isActive ? 'ring-2 ring-foreground/70' : 'ring-1 ring-border')} />
              : <CharacterBadge name="sely" tone="paper" size="sm" />}
          </NavLink>
        </nav>

        <div className="flex w-full shrink-0 flex-col items-center gap-2 border-t border-border/40 pt-3">
          <NotificationsMenu placement="rail" />
          <div className="relative">
            <button type="button"
              onClick={() => setShowAccountMenu(value => !value)}
              aria-label="Account, settings and appearance"
              title="More options"
              aria-haspopup="menu"
              aria-expanded={showAccountMenu}
              className={railLink(showAccountMenu)}>
              <Mascot name="susi" className="h-10 w-10" />
            </button>
            <ProfileDropdown isOpen={showAccountMenu} onClose={() => setShowAccountMenu(false)} placement="rail" />
          </div>

          {user?.role === 'admin' && (
            <Link to="/admin" aria-label="Admin panel" title="Admin panel" className={railLink(false)}>
              <CharacterBadge name="araw" tone="paper" size="sm" />
            </Link>
          )}
        </div>
      </aside>

      <div className="min-h-screen min-w-0 pt-16 lg:pl-[72px] lg:pt-0">
        <main id="main-content" tabIndex={-1}
          className="mx-auto min-w-0 w-full max-w-[1800px] px-3 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10 lg:pt-8 xl:px-10">
          <WorldScene3D key={worldFor(location.pathname)} kind={worldFor(location.pathname)} className="mb-4 h-[150px] min-w-0 sm:mb-7 sm:h-[205px]" title="Interactive 3D SendTheLetter workspace" />
          <div key={location.pathname} className="workspace-page-enter min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* A compact bottom bar keeps every main destination reachable on phones. */}
      <nav aria-label="Mobile workspace navigation"
        className={'fixed inset-x-0 bottom-0 z-40 grid ' + (user?.role === 'admin' ? 'grid-cols-7' : 'grid-cols-6') +
          ' stl-depth-bottomnav items-center gap-0.5 border-t border-border bg-card/95 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-4px_24px_rgba(0,0,0,.04)] backdrop-blur-xl lg:hidden sm:px-3'}>
        {navigation.slice(0, 3).map(item => <MobileNavLink key={item.to} {...item} />)}
        <Link to="/dashboard/notes?compose=1" aria-label="Write a new letter" title="Write a letter"
          className="stl-depth-nav relative -mt-3 flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl bg-primary text-primary-foreground shadow-md focus-visible:outline-2 focus-visible:outline-primary">
          <CharacterBadge name="tala" tone="paper" size="sm" />
          <span className="text-[9px] font-bold leading-tight sm:text-[10px]">Write</span>
        </Link>
        {navigation.slice(3).map(item => <MobileNavLink key={item.to} {...item} unreadCount={item.to === '/dashboard/messages' ? unreadMessages : 0} avatar={item.to === '/dashboard/profile' ? user?.avatar : undefined} />)}
        {user?.role === 'admin' && <Link to="/admin" aria-label="Admin panel" title="Admin panel" className="flex min-h-12 min-w-0 items-center justify-center rounded-xl hover:bg-muted"><CharacterBadge name="susi" tone="paper" size="sm" /></Link>}
      </nav>
      <MessageDock />
    </div>
  );
}
