import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useWriterPreferences, type ThemeChoice } from '../../store/writerPreferences';
import { getImageUrl } from '../../lib/utils';
import { API_ENDPOINTS } from '../../config/api';
import CharacterBadge from '../../components/CharacterBadge';
import type { MascotName } from '../../components/Mascot';

type Tab = 'account' | 'privacy' | 'appearance' | 'help';
const tabs: { value: Tab; label: string; description: string; mascot: MascotName }[] = [
    { value: 'account', label: 'Account', description: 'Your profile and password', mascot: 'sely' },
    { value: 'privacy', label: 'Privacy & writing', description: 'How your letters begin', mascot: 'lumi' },
    { value: 'appearance', label: 'Display & accessibility', description: 'Make it feel like yours', mascot: 'tala' },
    { value: 'help', label: 'Help & support', description: 'Answers and feedback', mascot: 'piko' },
];
const themeChoices: { value: ThemeChoice; title: string; description: string; tint: string; foreground: string }[] = [
    { value: 'warm', title: 'Warm editorial', description: 'Cream, paper and sage', tint: '#f3ece1', foreground: '#344a3c' },
    { value: 'cool', title: 'Calm blue', description: 'A quiet, airy workspace', tint: '#e9eff9', foreground: '#5b74a1' },
    { value: 'dark', title: 'Forest night', description: 'Softer on the eyes at night', tint: '#1e302c', foreground: '#e3d5b6' },
];

function SettingToggle({ title, description, enabled, onChange }: { title: string; description: string; enabled: boolean; onChange: (value: boolean) => void }) {
    return <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 py-5 last:border-b-0">
        <div className="max-w-xl flex-1"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
        <button type="button" role="switch" aria-checked={enabled} aria-label={title} onClick={() => onChange(!enabled)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${enabled ? 'bg-primary' : 'bg-muted-foreground/35'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${enabled ? 'left-6' : 'left-1'}`} />
        </button>
    </div>;
}

const SettingsPage = () => {
    const user = useAuthStore(state => state.user);
    const preferences = useWriterPreferences(state => state.preferences);
    const change = useWriterPreferences(state => state.change);
    const restoreDefaults = useWriterPreferences(state => state.restoreDefaults);
    const [params, setParams] = useSearchParams();
    const tab = (tabs.some(t => t.value === params.get('tab')) ? params.get('tab') : 'account') as Tab;
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [feedback, setFeedback] = useState('');

    const selectTab = (value: Tab) => {
        setParams(value === 'account' ? {} : { tab: value });
        setFeedback('');
    };

    const savePassword = async (event: React.FormEvent) => {
        event.preventDefault();
        setFeedback('');
        if (newPassword !== confirmPassword) return setFeedback('New passwords do not match.');
        if (newPassword.length < 8) return setFeedback('Use at least 8 characters for your new password.');
        setSavingPassword(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_ENDPOINTS.auth}/change-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || 'Could not update your password.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setFeedback('Password changed successfully. Use your new password the next time you sign in.');
        } catch (error: any) {
            setFeedback(error?.message || 'Something went wrong.');
        } finally {
            setSavingPassword(false);
        }
    };

    return <div className="mx-auto max-w-6xl space-y-7 pb-12">
        <div className="flex items-center justify-between gap-4">
            <div><Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft size={15} /> Back to workspace</Link><p className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.19em] text-[hsl(var(--accent))]"><CharacterBadge name="tala" tone="gold" size="xs" /> Make your space yours</p><h1 className="mt-2 font-editorial text-4xl sm:text-5xl">Settings & privacy</h1><p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">A calmer, more personal space for your stories. Changes to your preferences save instantly on this device.</p></div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)] lg:items-start">
            <aside className="rounded-[27px] border border-border bg-card p-3 shadow-sm lg:sticky lg:top-24">
                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-background p-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--surface-gold))] font-semibold">{user?.avatar ? <img src={getImageUrl(user.avatar)} alt="" className="h-full w-full object-cover" /> : user?.username?.[0]?.toUpperCase() || 'W'}</span>
                    <span className="min-w-0"><strong className="block truncate text-sm">{user?.username || 'Writer'}</strong><span className="block truncate text-xs text-muted-foreground">Your settings</span></span>
                </div>
                <nav aria-label="Settings categories" className="grid grid-cols-2 gap-1 lg:grid-cols-1">
                    {tabs.map(({ value, label, mascot }) => <button type="button" key={value} onClick={() => selectTab(value)} aria-current={tab === value ? 'page' : undefined} className={`flex items-center gap-2 rounded-2xl px-3 py-3 text-left text-xs font-semibold transition-colors sm:text-sm ${tab === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><CharacterBadge name={mascot} tone="paper" size="sm" />{label}</button>)}
                </nav>
            </aside>
            <div className="space-y-5">
                {tab === 'account' && <>
                    <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
                        <div className="border-b border-border px-6 py-5 sm:px-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">Account</p><h2 className="mt-2 font-editorial text-2xl">Your identity</h2></div>
                        <div className="flex flex-wrap items-center gap-4 p-6 sm:p-8">
                            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[hsl(var(--surface-gold))] text-2xl font-semibold">{user?.avatar ? <img src={getImageUrl(user.avatar)} alt="" className="h-full w-full object-cover" /> : user?.username?.[0]?.toUpperCase() || 'W'}</span>
                            <div className="min-w-0 flex-1"><p className="break-words text-base font-semibold">{user?.username}</p><p className="break-all text-sm text-muted-foreground">{user?.email}</p><p className="mt-1 text-xs text-muted-foreground">Your email is used for account sign-in.</p></div>
                            <Link to="/dashboard/profile" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground hover:opacity-90">Edit profile <ChevronRight size={15} /></Link>
                        </div>
                    </section>
                    <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
                        <div className="flex items-start gap-3"><CharacterBadge name="lumi" tone="sage" size="lg" /><div><h2 className="font-editorial text-2xl">Change password</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Protect your account with a new password. You'll need the current one to make changes.</p></div></div>
                        <form onSubmit={savePassword} className="mt-6 grid gap-4">
                            <label className="grid gap-2 text-sm font-semibold">Current password<input required autoComplete="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" /></label>
                            <label className="grid gap-2 text-sm font-semibold">New password<input required minLength={8} maxLength={72} autoComplete="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" /></label>
                            <label className="grid gap-2 text-sm font-semibold">Confirm new password<input required minLength={8} maxLength={72} autoComplete="new-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" /></label>
                            <p className="text-xs text-muted-foreground">Use at least 8 characters. Existing sign-ins can remain active until their normal session expiry.</p>
                            {feedback && <p role="status" className="rounded-xl bg-muted px-4 py-3 text-sm">{feedback}</p>}
                            <button type="submit" disabled={savingPassword} className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"><CharacterBadge name="lumi" tone="paper" size="xs" />{savingPassword ? 'Updating…' : 'Update password'}</button>
                        </form>
                    </section>
                </>}
                {tab === 'privacy' && <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--accent))]"><CharacterBadge name="lumi" tone="sage" size="sm" /> Privacy by design</p>
                    <h2 className="mt-2 font-editorial text-3xl">Your words, your choice</h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">These defaults apply when you start a new letter. They do not change letters you have already written or shared.</p>
                    <SettingToggle title="Make new letters public by default" description="Off is the safest choice. Turn on only if you usually share your letters with everyone." enabled={preferences.defaultPublic} onChange={value => change('defaultPublic', value)} />
                    <SettingToggle title="Write anonymously by default" description="Hide your writer name when you choose to publish a new letter publicly." enabled={preferences.defaultAnonymous} onChange={value => change('defaultAnonymous', value)} />
                    <SettingToggle title="Confirm before publishing" description="Ask for a final review before a letter goes live or is scheduled." enabled={preferences.confirmBeforePublishing} onChange={value => change('confirmBeforePublishing', value)} />
                    <div className="mt-5 flex gap-3 rounded-2xl bg-[hsl(var(--surface-gold))] p-4 text-[#51442f]"><CharacterBadge name="sely" tone="paper" size="sm" /><p className="text-xs leading-6">Sharing uses a random link token, but anyone with a valid public link can read that published letter. Private, drafts and unreleased letters remain protected by server checks.</p></div>
                </section>}
                {tab === 'appearance' && <div className="space-y-5">
                    <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--accent))]"><CharacterBadge name="tala" tone="gold" size="sm" /> Appearance</p>
                        <h2 className="mt-2 font-editorial text-3xl">Set the mood</h2>
                        <p className="mt-2 text-sm text-muted-foreground">Pick the palette that makes writing feel right.</p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            {themeChoices.map(choice => <button type="button" key={choice.value} onClick={() => change('theme', choice.value)} aria-pressed={preferences.theme === choice.value} className={`rounded-[20px] border-2 p-3 text-left transition-all hover:-translate-y-0.5 ${preferences.theme === choice.value ? 'border-primary shadow-md' : 'border-border hover:border-muted-foreground'}`}>
                                <span className="relative mb-3 block h-24 overflow-hidden rounded-xl border border-black/5" style={{ backgroundColor: choice.tint }}><span className="absolute bottom-4 left-4 right-4 rounded-xl p-3 shadow-sm" style={{ backgroundColor: choice.foreground }}><span className="block h-1.5 w-3/4 rounded-full bg-white/70" /><span className="mt-2 block h-1.5 w-1/2 rounded-full bg-white/40" /></span></span>
                                <span className="flex items-center justify-between text-sm font-bold">{choice.title}{preferences.theme === choice.value && <Check size={16} />}</span><span className="mt-1 block text-xs text-muted-foreground">{choice.description}</span>
                            </button>)}
                        </div>
                    </section>
                    <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
                        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">Comfort</p><h2 className="mt-2 font-editorial text-2xl">Make reading easier</h2>
                        <div className="mt-4 border-b border-border py-5"><p className="mb-3 text-sm font-semibold">Text size</p><div className="inline-flex gap-1 rounded-2xl bg-muted p-1">
                            {(['normal', 'large'] as const).map(size => <button type="button" key={size} onClick={() => change('readingSize', size)} className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${preferences.readingSize === size ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>{size === 'normal' ? 'Standard' : 'Larger text'}</button>)}
                        </div></div>
                        <SettingToggle title="Reduce motion" description="Minimize animations and decorative movement on this device." enabled={preferences.reduceMotion} onChange={v => change('reduceMotion', v)} />
                    </section>
                    <button type="button" onClick={restoreDefaults} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted"><RotateCcw size={16} /> Reset display and writing preferences</button>
                </div>}
                {tab === 'help' && <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--accent))]"><CharacterBadge name="piko" tone="rose" size="sm" /> Here to help</p><h2 className="mt-2 font-editorial text-3xl">Need a hand?</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Explore how the app works, contact the project, or report a problem.</p>
                    <div className="mt-6 grid gap-3">
                        <Link to="/services" className="flex items-center gap-4 rounded-2xl border border-border p-4 hover:bg-muted"><CharacterBadge name="lumi" tone="gold" size="md" /><span className="flex-1"><strong className="block text-sm">Explore SendTheLetter</strong><span className="text-xs text-muted-foreground">Learn about writing, saving and sharing letters</span></span><ChevronRight size={18} /></Link>
                        <Link to="/contact" className="flex items-center gap-4 rounded-2xl border border-border p-4 hover:bg-muted"><CharacterBadge name="piko" tone="sage" size="md" /><span className="flex-1"><strong className="block text-sm">Contact & feedback</strong><span className="text-xs text-muted-foreground">Share a suggestion or ask a question</span></span><ChevronRight size={18} /></Link>
                        <Link to="/contact" className="flex items-center gap-4 rounded-2xl border border-border p-4 hover:bg-muted"><CharacterBadge name="tala" tone="rose" size="md" /><span className="flex-1"><strong className="block text-sm">Report a problem</strong><span className="text-xs text-muted-foreground">Explain the issue through the contact page</span></span><ChevronRight size={18} /></Link>
                    </div>
                    <div className="mt-6 rounded-2xl bg-muted/70 p-4 text-xs leading-6 text-muted-foreground"><CharacterBadge name="tala" tone="paper" size="xs" className="mr-2 align-middle" /> Tips: Use private mode for personal letters. Share public letters using their generated link; never share your password or authentication token.</div>
                </section>}
            </div>
        </div>
    </div>;
};

export default SettingsPage;
