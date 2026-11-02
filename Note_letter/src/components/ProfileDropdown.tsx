import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getImageUrl } from '../lib/utils';
import CharacterBadge from './CharacterBadge';
import { useWriterPreferences, type ThemeChoice } from '../store/writerPreferences';

interface ProfileDropdownProps { isOpen: boolean; onClose: () => void; }

const themes: { value: ThemeChoice; label: string; color: string }[] = [
    { value: 'warm', label: 'Warm & cozy', color: '#344a3c' },
    { value: 'cool', label: 'Calm blue', color: '#657ea8' },
    { value: 'dark', label: 'Forest night', color: '#182c26' },
];

const ProfileDropdown = ({ isOpen, onClose }: ProfileDropdownProps) => {
    const logout = useAuthStore(state => state.logout);
    const user = useAuthStore(state => state.user);
    const theme = useWriterPreferences(state => state.preferences.theme);
    const change = useWriterPreferences(state => state.change);
    const navigate = useNavigate();
    const [showAppearance, setShowAppearance] = useState(false);

    useEffect(() => {
        if (!isOpen) setShowAppearance(false);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', escape);
        return () => document.removeEventListener('keydown', escape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const logoutNow = () => {
        onClose();
        logout();
        navigate('/login', { replace: true });
    };
    const itemClass = 'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary';

    return <>
        <button aria-label="Close account menu" type="button" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={onClose} />
        <div role="menu" aria-label="Account menu" className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(360px,calc(100vw-24px))] max-h-[calc(100vh-100px)] overflow-y-auto rounded-[26px] border border-border bg-card p-3 text-foreground shadow-[0_20px_70px_rgba(0,0,0,.22)]">
            <div className="rounded-[20px] border border-border/80 bg-background/70 p-3">
                <Link to="/dashboard/profile" onClick={onClose} className="flex items-center gap-3 rounded-xl p-1 hover:bg-muted/50">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--surface-gold))] font-editorial text-lg font-semibold">
                        {user?.avatar ? <img src={getImageUrl(user.avatar)} alt="" className="h-full w-full object-cover" /> : (user?.username?.[0]?.toUpperCase() || 'W')}
                    </span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{user?.username || 'Writer'}</span><span className="block truncate text-xs text-muted-foreground">{user?.email || 'Your writing space'}</span></span>
                    <ChevronRight size={18} className="text-muted-foreground" />
                </Link>
                <Link to="/dashboard/profile" onClick={onClose} className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-xs font-bold hover:bg-muted/80"><CharacterBadge name="sely" tone="rose" size="xs" /> View my profile</Link>
            </div>

            {showAppearance ? <>
                <button type="button" onClick={() => setShowAppearance(false)} className={itemClass}><ChevronLeft size={18} /> Back to menu</button>
                <p className="px-3 pb-2 pt-3 font-editorial text-xl">Choose your mood</p>
                <p className="px-3 pb-3 text-xs text-muted-foreground">Your selected theme is saved for this account on this device.</p>
                <div className="space-y-1">
                    {themes.map(t => <button key={t.value} role="menuitemradio" aria-checked={theme === t.value} type="button" onClick={() => change('theme', t.value)} className={itemClass}>
                        <span className="h-8 w-8 rounded-xl border border-white/20 shadow-sm" style={{ background: t.color }} />
                        <span className="flex-1">{t.label}</span>{theme === t.value && <Check size={17} />}
                    </button>)}
                </div>
                <Link to="/dashboard/settings?tab=appearance" onClick={onClose} className="mx-2 mt-3 flex items-center justify-center rounded-xl border border-border px-3 py-2.5 text-xs font-semibold hover:bg-muted">More display settings</Link>
            </> : <>
                <div className="mt-3 space-y-0.5">
                    <Link role="menuitem" to="/dashboard/settings" onClick={onClose} className={itemClass}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><CharacterBadge name="tala" tone="sage" size="sm" /></span><span className="flex-1">Settings & privacy</span><ChevronRight size={17} /></Link>
                    <button role="menuitem" type="button" onClick={() => setShowAppearance(true)} className={itemClass}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><CharacterBadge name="tala" tone="gold" size="sm" /></span><span className="flex-1">Display & appearance</span><ChevronRight size={17} /></button>
                    <Link role="menuitem" to="/dashboard/settings?tab=privacy" onClick={onClose} className={itemClass}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><CharacterBadge name="susi" tone="sage" size="sm" /></span><span className="flex-1">Privacy & sharing</span><ChevronRight size={17} /></Link>
                    <Link role="menuitem" to="/dashboard/settings?tab=help" onClick={onClose} className={itemClass}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><CharacterBadge name="chika" tone="rose" size="sm" /></span><span className="flex-1">Help & support</span><ChevronRight size={17} /></Link>
                    <Link role="menuitem" to="/contact" onClick={onClose} className={itemClass}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><CharacterBadge name="chika" tone="gold" size="sm" /></span><span className="flex-1">Report a problem</span><ChevronRight size={17} /></Link>
                </div>
                <div className="mt-2 border-t border-border pt-2">
                    <button role="menuitem" type="button" onClick={logoutNow} className={`${itemClass} hover:bg-red-500/10 hover:text-red-600`}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><LogOut size={18} /></span><span className="flex-1">Log out</span></button>
                </div>
            </>}
            <div className="mt-2 flex items-center justify-center gap-2 border-t border-border/70 pt-3 text-[11px] text-muted-foreground"><CharacterBadge name="tala" tone="gold" size="xs" /> A quiet place for your words</div>
        </div>
    </>;
};

export default ProfileDropdown;
