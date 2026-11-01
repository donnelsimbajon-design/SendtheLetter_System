import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { BookHeart, FileText, Home, LogOut, MessageCircle, PenLine, UserRound, Palette } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: Home, end: true },
  { to: '/dashboard/notes', label: 'Letters', icon: FileText, end: false },
  { to: '/dashboard/messages', label: 'Messages', icon: MessageCircle, end: false },
  { to: '/dashboard/profile', label: 'My profile', icon: UserRound, end: false },
];

const DashboardLayout = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const [theme, setTheme] = useState<'warm' | 'cool' | 'dark'>('warm');
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sendtheletter-theme');
    if (saved === 'cool' || saved === 'dark' || saved === 'warm') setTheme(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'warm') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    localStorage.setItem('sendtheletter-theme', theme);
  }, [theme]);

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
              <button onClick={() => setShowThemes((value) => !value)} className="flex h-10 items-center gap-2 rounded-full border border-border bg-background px-3 text-sm font-medium hover:bg-muted" aria-label="Choose color theme">
                <Palette size={16} /><span className="hidden sm:inline">Appearance</span>
              </button>
              {showThemes && (
                <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-border bg-card p-2 shadow-xl">
                  {([
                    ['warm', 'Warm editorial', 'bg-[#263B35]'],
                    ['cool', 'Cool blue', 'bg-[#526E9D]'],
                    ['dark', 'Forest dark', 'bg-[#A9B9A6]'],
                  ] as const).map(([value, label, swatch]) => (
                    <button key={value} onClick={() => { setTheme(value); setShowThemes(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-muted">
                      <span className={`h-4 w-4 rounded-full ${swatch}`} />{label}{theme === value && <span className="ml-auto text-primary">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.username || 'Writer'}</p>
              <p className="text-xs text-muted-foreground">Your personal space</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--surface-gold))] font-semibold text-foreground">
              {user?.username?.slice(0, 1).toUpperCase() || 'W'}
            </div>
            <button onClick={logout} className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground sm:flex" title="Sign out">
              <LogOut size={17} /><span>Sign out</span>
            </button>
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
            <button onClick={logout} className="rounded-full border border-border p-2.5 text-muted-foreground" aria-label="Sign out"><LogOut size={18} /></button>
          </div>
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl lg:hidden">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            <Icon size={20} strokeWidth={1.9} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default DashboardLayout;
