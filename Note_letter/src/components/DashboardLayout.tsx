import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { Bell, BookHeart, ChevronDown, FileText, Home, MessageCircle, PenLine, UserRound, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { useNoteStore } from '../store/noteStore';
import socketService from '../services/socketService';
import { getImageUrl } from '../lib/utils';
import Mascot from './Mascot';
import ProfileDropdown from './ProfileDropdown';
import { useWriterPreferences } from '../store/writerPreferences';

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: Home, end: true },
  { to: '/dashboard/notes', label: 'Letters', icon: FileText, end: false },
  { to: '/dashboard/messages', label: 'Messages', icon: MessageCircle, end: false },
  { to: '/dashboard/profile', label: 'My profile', icon: UserRound, end: false },
];

const DashboardLayout = () => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const preferences = useWriterPreferences(state => state.preferences);
  const loadForUser = useWriterPreferences(state => state.loadForUser);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, fetchNotifications, markNotificationsRead } = useNoteStore();
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  useEffect(() => {
    void fetchNotifications();
    socketService.onNewNotification(() => { void fetchNotifications(); });
    return () => socketService.offNewNotification();
  }, [fetchNotifications]);

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

  useEffect(() => { setShowAccountMenu(false); setShowNotifications(false); }, [location.pathname]);

  const pageTitle = navigation.find((item) => item.to === location.pathname)?.label || 'Your space';

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-40 h-[72px] border-b border-border/80 bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><BookHeart size={21} /></span>
            <span className="font-editorial text-xl font-semibold tracking-tight">SendTheLetter</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button onClick={() => { const next = !showNotifications; setShowNotifications(next); if (next && unreadCount > 0) void markNotificationsRead(); }} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Notifications">
                <Bell size={17} />
                {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[hsl(var(--accent))] ring-2 ring-card" />}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 z-50 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-sm font-semibold">Notifications</p><span className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} new` : 'All caught up'}</span></div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length ? notifications.slice(0, 12).map((notification) => (
                      <Link key={notification.id} to={notification.actor?.username ? `/dashboard/profile/${notification.actor.username}` : '/dashboard'} onClick={() => setShowNotifications(false)} className="block border-b border-border/70 px-4 py-3 last:border-0 hover:bg-muted/60">
                        <p className="text-sm leading-5"><span className="font-semibold">{notification.actor?.username || 'Someone'}</span>{notification.type === 'like' ? ' liked your letter ' : notification.type === 'friend_request' ? ' sent you a friend request' : notification.type === 'follow' ? ' started following you' : ' commented on your letter '}<span className="font-medium">{notification.letter?.title || 'your letter'}</span></p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</p>
                      </Link>
                    )) : <div className="flex flex-col items-center px-4 py-6 text-center text-sm text-muted-foreground"><Mascot name="tala" className="mb-2 h-20 w-20" /><p>No notifications yet.</p></div>}
                  </div>
                </div>
              )}
            </div>
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
                <ChevronDown size={16} className={`text-muted-foreground transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
              </button>
              <ProfileDropdown isOpen={showAccountMenu} onClose={() => setShowAccountMenu(false)} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] pt-[72px]">
        <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[248px] shrink-0 flex-col border-r border-border/70 bg-background/80 px-5 py-8 lg:flex">
          <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[.18em] text-muted-foreground">Workspace</p>
          <nav className="space-y-1.5">
            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <Icon size={18} strokeWidth={1.8} />{label}
              </NavLink>
            ))}
            {user?.role === 'admin' && <NavLink to="/admin" className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><ShieldCheck size={18} />Admin panel</NavLink>}
          </nav>
          <div className="mt-auto rounded-2xl bg-[hsl(var(--surface-rose))] p-4 text-[#49363B]">
            <p className="font-editorial text-lg leading-snug">Some words deserve a little more time.</p>
            <p className="mt-2 text-xs leading-relaxed opacity-80">Make room for the things you want to say.</p>
            <Link to="/dashboard/notes" className="mt-3 inline-flex items-center gap-2 text-xs font-bold">Write a letter <PenLine size={13} /></Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-7 sm:px-6 lg:px-10 lg:py-10">
          <div className="mb-7 flex items-center justify-between lg:hidden">
            <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Workspace</p><p className="font-editorial text-2xl">{pageTitle}</p></div>
            <Link to="/dashboard/settings" className="rounded-full border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted" aria-label="Open settings">Settings</Link>
          </div>
          <Outlet />
        </main>
      </div>

      <nav className={`fixed inset-x-0 bottom-0 z-40 grid ${user?.role === "admin" ? "grid-cols-5" : "grid-cols-4"} border-t border-border bg-card/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl lg:hidden`}>
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            <Icon size={20} strokeWidth={1.9} /><span>{label}</span>
          </NavLink>
        ))}
        {user?.role === 'admin' && <NavLink to="/admin" className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}><ShieldCheck size={20} /><span>Admin</span></NavLink>}
      </nav>
    </div>
  );
};

export default DashboardLayout;
