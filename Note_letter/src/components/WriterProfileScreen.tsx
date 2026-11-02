import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Camera, MapPin, Search, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Note } from '../types/note';
import { API_ENDPOINTS } from '../config/api';
import { getImageUrl } from '../lib/utils';
import CharacterBadge from './CharacterBadge';
import type { MascotName } from './Mascot';
import { useAuthStore } from '../store/authStore';

export interface WriterPublicProfile {
    id: number;
    username: string;
    avatar?: string;
    coverImage?: string;
    bio?: string;
    location?: string;
    createdAt?: string;
    followerCount: number;
    followingCount: number;
    isFollowing?: boolean;
}

export type WriterFeedNote = Note & { repostedAt?: string };

type ProfileTab = 'posts' | 'letters' | 'about' | 'connections';
type Connection = { id: number; username: string; avatar?: string };

interface Props {
    profile: WriterPublicProfile;
    ownProfile?: boolean;
    letters: Note[];
    reposts: WriterFeedNote[];
    loading?: boolean;
    error?: string;
    onRetry?: () => void;
    onOpenLetter: (letter: Note) => void;
    onEditProfile?: () => void;
    onWriteLetter?: () => void;
    onFollow?: () => void;
    followBusy?: boolean;
    onMessage?: () => void;
    friendAction?: { label: string; onClick?: () => void; disabled?: boolean; secondaryLabel?: string; secondaryClick?: () => void };
    actionError?: string;
    onDismissActionError?: () => void;
    onRefresh?: () => void;
}

const shortName = (name: string) => name.includes('@') ? name.split('@')[0] : name;
const validDate = (value?: string | Date) => value && !Number.isNaN(new Date(value).getTime());
const friendlyDate = (value?: string | Date) => validDate(value) ? format(new Date(value!), 'MMM yyyy') : null;
const relativeDate = (value?: string | Date) => validDate(value) ? formatDistanceToNow(new Date(value!), { addSuffix: true }) : 'Recently';

const topTabs: { id: ProfileTab; text: string; mascot: MascotName }[] = [
    { id: 'posts', text: 'Posts', mascot: 'lumi' },
    { id: 'letters', text: 'Letters', mascot: 'sely' },
    { id: 'about', text: 'About', mascot: 'tala' },
    { id: 'connections', text: 'Connections', mascot: 'piko' },
];

export default function WriterProfileScreen({
    profile, ownProfile = false, letters, reposts, loading = false, error = '', onRetry,
    onOpenLetter, onEditProfile, onWriteLetter, onFollow, followBusy, onMessage, friendAction,
    actionError = '', onDismissActionError, onRefresh,
}: Props) {
    const signedIn = useAuthStore(state => state.isAuthenticated);
    const currentUserId = useAuthStore(state => state.user?.id);
    const isSelfVisitor = !ownProfile && Number(currentUserId) === Number(profile.id);
    const [tab, setTab] = useState<ProfileTab>('posts');
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [feedback, setFeedback] = useState('');
    const [people, setPeople] = useState<{ followers: Connection[]; following: Connection[] }>({ followers: [], following: [] });
    const [connectionsLoading, setConnectionsLoading] = useState(false);
    const [connectionsError, setConnectionsError] = useState('');
    const [likeStates, setLikeStates] = useState<Record<string, { liked: boolean; count: number }>>({});
    const [likingId, setLikingId] = useState<string | null>(null);
    const [connectionsRefresh, setConnectionsRefresh] = useState(0);

    // Reset only when navigating to a different writer.
    useEffect(() => {
        setTab('posts');
        setQuery('');
        setCategory('All');
        setLikeStates({});
        setFeedback('');
        setPeople({ followers: [], following: [] });
    }, [profile.id]);

    const publishedLetters = useMemo(() => letters.filter(n =>
        n.isPublic === true && n.status === 'published' && n.isArchived !== true &&
        n.isAnonymous !== true && (!n.openDate || new Date(n.openDate).getTime() <= Date.now()) &&
        (!n.scheduledDate || new Date(n.scheduledDate).getTime() <= Date.now())
    ), [letters]);

    const publicReposts = useMemo(() => reposts.filter(n =>
        n.isPublic === true && n.status === 'published' && n.isArchived !== true &&
        (!n.openDate || new Date(n.openDate).getTime() <= Date.now()) &&
        (!n.scheduledDate || new Date(n.scheduledDate).getTime() <= Date.now())
    ), [reposts]);

    const feed = useMemo(() => {
        const authored = publishedLetters.map(letter => ({ note: letter as WriterFeedNote, isRepost: false, date: letter.createdAt }));
        const shared = publicReposts.map(letter => ({ note: letter, isRepost: true, date: letter.repostedAt || letter.createdAt }));
        return [...authored, ...shared].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [publishedLetters, publicReposts]);

    const categoryOptions = useMemo(() => ['All', ...Array.from(new Set(publishedLetters.map(n => n.category || n.type || 'Other').filter(Boolean)))].slice(0, 10), [publishedLetters]);
    const current = tab === 'letters' ? feed.filter(item => !item.isRepost) : feed;
    const filtered = current.filter(({ note }) => {
        const text = `${note.title || ''} ${note.content || ''} ${note.category || note.type || ''}`.toLowerCase();
        return text.includes(query.trim().toLowerCase()) && (category === 'All' || (note.category || note.type || 'Other') === category);
    });

    const shareProfile = async () => {
        const url = `${window.location.origin}/writers/${encodeURIComponent(profile.username)}`;
        try {
            await navigator.clipboard.writeText(url);
            setFeedback('Public profile link copied!');
        } catch {
            setFeedback('Copy the address from your browser to share this public profile.');
        }
    };

    const shareLetter = async (note: Note) => {
        if (!note.shareToken || !/^[a-f0-9]{48}$/.test(note.shareToken)) {
            setFeedback('This letter does not currently have a public share link.');
            return;
        }
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/?s=${encodeURIComponent(note.shareToken)}`);
            setFeedback('Public letter link copied!');
        } catch {
            setFeedback('Unable to copy. Open the letter to share it.');
        }
    };

    const toggleLike = async (note: Note) => {
        if (!signedIn || likingId) return;
        const id = String(note.id);
        setLikingId(id);
        try {
            const response = await fetch(`${API_ENDPOINTS.letters}/${encodeURIComponent(id)}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || 'Could not update the reaction.');
            setLikeStates(prev => ({ ...prev, [id]: { liked: !!data.liked, count: Number(data.likeCount) || 0 } }));
        } catch (err: any) {
            setFeedback(err?.message || 'Could not send love to this letter.');
        } finally {
            setLikingId(null);
        }
    };

    useEffect(() => {
        if (tab !== 'connections') return;
        let active = true;
        const load = async () => {
            setConnectionsLoading(true);
            setConnectionsError('');
            try {
                const [followers, following] = await Promise.all([
                    fetch(`${API_ENDPOINTS.users}/${profile.id}/followers`),
                    fetch(`${API_ENDPOINTS.users}/${profile.id}/following`),
                ]);
                if (!followers.ok || !following.ok) throw new Error('Connections are temporarily unavailable.');
                const [a, b] = await Promise.all([followers.json(), following.json()]);
                if (!active) return;
                setPeople({
                    followers: Array.isArray(a) ? a.map((record: any) => record.follower).filter(Boolean) : [],
                    following: Array.isArray(b) ? b.map((record: any) => record.following).filter(Boolean) : [],
                });
            } catch (err: any) {
                if (active) setConnectionsError(err?.message || 'Unable to load connections.');
            } finally { if (active) setConnectionsLoading(false); }
        };
        void load();
        return () => { active = false; };
    }, [profile.id, tab, connectionsRefresh]);

    const name = shortName(profile.username);
    const hasBio = !!profile.bio?.trim();
    const profileUrl = `/writers/${encodeURIComponent(profile.username)}`;

    return <div className="mx-auto w-full max-w-[1190px] space-y-5 pb-16 text-foreground">
        <section className="overflow-hidden rounded-[30px] border border-border bg-card shadow-[0_15px_50px_rgba(25,46,33,.07)]">
            <div className="relative h-44 overflow-hidden bg-[#294139] sm:h-60">
                {profile.coverImage ? <img src={getImageUrl(profile.coverImage)} alt="Writer cover" className="absolute inset-0 h-full w-full object-cover" /> : <>
                    <div className="absolute -right-20 -top-36 h-[340px] w-[340px] rounded-full border border-white/15 bg-[#799184]/20 sm:right-12" />
                    <div className="absolute -bottom-48 left-[-60px] h-[320px] w-[320px] rounded-full border border-white/10 bg-[#cfaa7d]/20" />
                    <div className="absolute right-[17%] top-7 rotate-[-18deg] font-editorial text-[120px] italic leading-none text-white/[.07] sm:text-[185px]">Letters</div>
                </>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
                <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-white backdrop-blur sm:left-8"><CharacterBadge name="lumi" tone="paper" size="xs" /> A writer's little corner</span>
                {ownProfile && onEditProfile && <button type="button" onClick={onEditProfile} className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/30 px-4 py-2.5 text-xs font-bold text-white backdrop-blur hover:bg-black/50"><Camera size={15} /> <span className="hidden sm:inline">Edit cover</span><span className="sm:hidden">Edit</span></button>}
            </div>
            <div className="relative px-5 pb-6 pt-14 sm:px-8 sm:pt-5">
                <div className="absolute -top-12 left-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[30px] border-[5px] border-card bg-[#e9d9b5] font-editorial text-3xl font-semibold text-[#465d4d] shadow-lg sm:-top-14 sm:left-8 sm:h-28 sm:w-28">
                    {profile.avatar ? <img src={getImageUrl(profile.avatar)} alt={name} className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex flex-col justify-between gap-5 sm:ml-36 sm:flex-row sm:items-end">
                    <div className="min-w-0">
                        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.17em] text-[hsl(var(--accent))]"><CharacterBadge name="tala" tone="gold" size="xs" /> {ownProfile ? 'Your public writer identity' : 'Meet the writer'}</p>
                        <h1 className="mt-2 break-words font-editorial text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{name}</h1>
                        <p className="mt-1 max-w-xl break-words text-sm leading-6 text-muted-foreground">{profile.bio?.trim() || (ownProfile ? 'Tell your community a little about the person behind the letters.' : 'Sharing stories one letter at a time.')}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            {profile.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {profile.location}</span>}
                            {friendlyDate(profile.createdAt) && <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> Joined {friendlyDate(profile.createdAt)}</span>}
                            <span className="inline-flex items-center gap-1.5"><CharacterBadge name="tala" tone="sage" size="xs" /> Public profile</span>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        {ownProfile ? <>
                            <button type="button" onClick={onEditProfile} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-bold hover:bg-muted"><CharacterBadge name="lumi" tone="paper" size="xs" /> Edit profile</button>
                            <button type="button" onClick={onWriteLetter} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90"><CharacterBadge name="lumi" tone="paper" size="xs" /> Write a letter</button>
                        </> : isSelfVisitor ? <Link to="/dashboard/profile" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"><CharacterBadge name="lumi" tone="paper" size="xs" /> Manage my profile</Link> : <>
                            {signedIn ? <button type="button" onClick={onFollow} disabled={followBusy} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold disabled:opacity-50 ${profile.isFollowing ? 'border border-border bg-background hover:bg-muted' : 'bg-primary text-primary-foreground hover:opacity-90'}`}>{profile.isFollowing ? <><CharacterBadge name="sely" tone="rose" size="xs" /> Following</> : <><CharacterBadge name="piko" tone="sage" size="xs" /> Follow</>}</button> : <Link to={`/login?returnTo=${encodeURIComponent(profileUrl)}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"><CharacterBadge name="piko" tone="sage" size="xs" /> Follow</Link>}
                            {friendAction && signedIn && <button type="button" onClick={friendAction.onClick} disabled={friendAction.disabled || !friendAction.onClick} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-bold hover:bg-muted disabled:opacity-50"><CharacterBadge name="sely" tone="sage" size="xs" /> {friendAction.label}</button>}
                            {friendAction?.secondaryLabel && friendAction.secondaryClick && signedIn && <button type="button" onClick={friendAction.secondaryClick} disabled={friendAction.disabled} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-50">{friendAction.secondaryLabel}</button>}
                            {signedIn ? <button type="button" onClick={onMessage} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-bold hover:bg-muted"><CharacterBadge name="piko" tone="sage" size="xs" /> Message</button> : <Link to={`/login?returnTo=${encodeURIComponent(profileUrl)}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-bold"><CharacterBadge name="piko" tone="sage" size="xs" /> Message</Link>}
                        </>}
                        <button type="button" onClick={() => void shareProfile()} aria-label="Copy public profile link" title="Copy public profile link" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background hover:bg-muted"><CharacterBadge name="piko" tone="paper" size="sm" /></button>
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-6 border-t border-border pt-5 text-sm sm:gap-10">
                    <div><strong className="font-editorial text-2xl">{publishedLetters.length}</strong><span className="ml-2 text-xs text-muted-foreground">Public letters</span></div>
                    <button type="button" onClick={() => setTab('connections')} className="text-left hover:text-primary"><strong className="font-editorial text-2xl">{profile.followerCount || 0}</strong><span className="ml-2 text-xs text-muted-foreground">Followers</span></button>
                    <button type="button" onClick={() => setTab('connections')} className="text-left hover:text-primary"><strong className="font-editorial text-2xl">{profile.followingCount || 0}</strong><span className="ml-2 text-xs text-muted-foreground">Following</span></button>
                </div>
            </div>
        </section>

        <nav aria-label="Writer profile sections" className="sticky top-[72px] z-30 flex gap-1 overflow-x-auto rounded-[20px] border border-border bg-card/95 p-1.5 shadow-sm backdrop-blur-xl">
            {topTabs.map(({ id, text, mascot }) => <button key={id} type="button" onClick={() => { setTab(id); setFeedback(''); setCategory('All'); }} aria-current={tab === id ? 'page' : undefined} className={`inline-flex min-w-fit flex-1 items-center justify-center gap-2 rounded-[15px] px-3 py-3 text-xs font-bold transition-colors sm:text-sm ${tab === id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><CharacterBadge name={mascot} tone="paper" size="sm" /> {text}</button>)}
        </nav>

        {(feedback || actionError) && <div role="status" className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-semibold"><span>{actionError || feedback}</span><button type="button" aria-label="Dismiss message" onClick={() => { setFeedback(''); onDismissActionError?.(); }} className="rounded-full p-1 hover:bg-muted"><X size={15} /></button></div>}
        <div className="grid items-start gap-5 lg:grid-cols-[315px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-[155px]">
                <div className="rounded-[25px] border border-border bg-card p-5 shadow-sm sm:p-6">
                    <h2 className="flex items-center gap-2 font-editorial text-xl"><CharacterBadge name="tala" tone="gold" size="sm" /> Intro</h2>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{hasBio ? profile.bio : 'A writer with a story to tell. The best letters are still ahead.'}</p>
                    <div className="mt-5 space-y-3 border-t border-border pt-4 text-xs text-muted-foreground">
                        {profile.location && <p className="flex items-center gap-2"><MapPin size={15} /> From {profile.location}</p>}
                        {friendlyDate(profile.createdAt) && <p className="flex items-center gap-2"><CalendarDays size={15} /> Joined {friendlyDate(profile.createdAt)}</p>}
                        <p className="flex items-center gap-2"><CharacterBadge name="lumi" tone="paper" size="xs" /> {publishedLetters.length} letters on public shelf</p>
                    </div>
                    {ownProfile ? <button type="button" onClick={onEditProfile} className="mt-5 w-full rounded-xl bg-muted px-4 py-3 text-xs font-bold hover:bg-muted/70">Edit my intro</button> : <button type="button" onClick={() => setTab('about')} className="mt-5 w-full rounded-xl bg-muted px-4 py-3 text-xs font-bold hover:bg-muted/70">Read more about {name}</button>}
                </div>
                <div className="rounded-[25px] border border-border bg-card p-5 shadow-sm sm:p-6">
                    <h2 className="flex items-center gap-2 font-editorial text-xl"><CharacterBadge name="piko" tone="sage" size="sm" /> Connections</h2>
                    <p className="mt-2 text-sm text-muted-foreground">A little community built around thoughtful words.</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setTab('connections')} className="rounded-xl bg-muted/70 px-3 py-4 text-left hover:bg-muted"><strong className="block font-editorial text-2xl">{profile.followerCount || 0}</strong><span className="text-[11px] text-muted-foreground">Followers</span></button>
                        <button type="button" onClick={() => setTab('connections')} className="rounded-xl bg-muted/70 px-3 py-4 text-left hover:bg-muted"><strong className="block font-editorial text-2xl">{profile.followingCount || 0}</strong><span className="text-[11px] text-muted-foreground">Following</span></button>
                    </div>
                </div>
                {ownProfile ? <div className="rounded-[25px] border border-[#d7d6c8] bg-[#e9eedf] p-5 text-[#364b3b] shadow-sm sm:p-6">
                    <p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-[#6f8067]">Only you can see these tools</p>
                    <h2 className="mt-2 font-editorial text-xl">Your writing studio</h2>
                    <p className="mt-2 text-xs leading-6 text-[#6d7b6c]">Private letters, drafts, and scheduled notes are managed in My Library—not on your public profile.</p>
                    <Link to="/dashboard/notes" className="mt-4 flex items-center justify-between rounded-xl bg-white/75 px-4 py-3 text-xs font-bold hover:bg-white"><span className="flex items-center gap-2"><CharacterBadge name="sely" tone="paper" size="xs" /> Open my private library</span><ArrowRight size={15} /></Link>
                    <Link to="/dashboard/settings" className="mt-2 flex items-center justify-between rounded-xl border border-[#cad4c0] px-4 py-3 text-xs font-bold hover:bg-white/40"><span className="flex items-center gap-2"><CharacterBadge name="tala" tone="paper" size="xs" /> Profile settings</span><ArrowRight size={15} /></Link>
                    <Link to={profileUrl} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold underline underline-offset-4"><CharacterBadge name="tala" tone="gold" size="xs" /> View as a visitor</Link>
                </div> : <Link to={signedIn ? "/dashboard/community" : "/"} className="block rounded-[25px] bg-[#344a3c] p-5 text-[#fff7ea] sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#d1e0ca]">From one writer to another</p><h2 className="mt-2 font-editorial text-xl">More letters await.</h2><p className="mt-2 text-xs leading-6 text-[#e7e7d8]">Find other voices and discover stories worth keeping.</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold">Explore community <ArrowRight size={15} /></span>
                </Link>}
            </aside>

            <main className="min-w-0 space-y-4">
                {ownProfile && tab === 'posts' && <button type="button" onClick={onWriteLetter} className="flex w-full items-center gap-3 rounded-[24px] border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40 sm:p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[hsl(var(--surface-gold))] font-serif text-xl font-bold text-[#4e5c45]">{name[0]?.toUpperCase()}</span>
                    <span className="flex-1 rounded-full bg-muted/65 px-4 py-3 text-sm text-muted-foreground">What would you like to write today?</span><span className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground sm:inline-flex"><CharacterBadge name="lumi" tone="paper" size="xs" /> Write</span>
                </button>}

                {(tab === 'posts' || tab === 'letters') && <>
                    <div className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[hsl(var(--accent))]">{tab === 'posts' ? 'Timeline' : 'Published writing'}</p><h2 className="mt-1 font-editorial text-2xl">{tab === 'posts' ? 'Latest from the desk' : 'Public letter collection'}</h2></div>
                            {onRefresh && <button type="button" onClick={onRefresh} className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline">Refresh</button>}
                        </div>
                        <div className="relative mt-4"><Search size={17} className="absolute left-4 top-3.5 text-muted-foreground" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search this writer's letters…" aria-label="Search profile posts" className="h-11 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm outline-none focus:border-primary" /></div>
                        {categoryOptions.length > 2 && <div aria-label="Filter by letter category" className="mt-4 flex gap-2 overflow-x-auto pb-1">
                            {categoryOptions.map(item => <button type="button" key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${category === item ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{item}</button>)}
                        </div>}
                    </div>
                    {loading ? <div className="rounded-[24px] border border-border bg-card p-12 text-center text-sm text-muted-foreground">Opening the writer's shelf…</div> : error ? <div role="alert" className="rounded-[24px] border border-border bg-card p-7 text-sm"><p>{error}</p><button type="button" onClick={onRetry} className="mt-4 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">Try again</button></div> : filtered.length ? filtered.map(({ note, isRepost, date }, index) => {
                        const state = likeStates[String(note.id)];
                        const liked = state?.liked ?? !!note.isLikedByUser;
                        const likes = state?.count ?? (Number(note.likeCount) || 0);
                        const cover = note.imageUrl || note.letterPages?.find(page => page.imageData)?.imageData;
                        return <article key={`${isRepost ? 'repost' : 'letter'}-${note.id}-${index}`} className="overflow-hidden rounded-[25px] border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                            <div className="flex items-start gap-3 px-5 pb-3 pt-5 sm:px-6">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e9ddc3] font-editorial text-lg font-semibold text-[#425546]">{profile.avatar ? <img src={getImageUrl(profile.avatar)} alt="" className="h-full w-full object-cover" /> : name[0]?.toUpperCase()}</span>
                                <div className="min-w-0 flex-1"><p className="text-sm font-bold">{name} {isRepost && <span className="ml-1 text-xs font-normal text-muted-foreground">shared a letter</span>}</p><p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">{relativeDate(date)} <span className="h-1 w-1 rounded-full bg-muted-foreground/50" /><CharacterBadge name="tala" tone="paper" size="xs" /> Public</p></div>
                                <span className="rounded-full bg-[hsl(var(--surface-gold))] px-3 py-1.5 text-[10px] font-bold text-[#5a4b38]">{note.category || note.type || 'Letter'}</span>
                            </div>
                            <button type="button" onClick={() => onOpenLetter(note)} aria-label={`Read ${note.title || 'letter'}`} className="block w-full px-5 pb-4 text-left sm:px-6">
                                {isRepost && <p className="mb-3 text-xs text-muted-foreground">Originally written by {note.isAnonymous ? 'Anonymous Writer' : (note.authorName || 'another writer')}</p>}
                                <h3 className="break-words font-editorial text-2xl font-semibold leading-tight text-foreground sm:text-[29px]">{note.title || 'A letter without a title'}</h3>
                                <p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words font-serif text-[15px] leading-7 text-muted-foreground">{note.content || 'Open this story to read the letter.'}</p>
                                {cover && <div className="mt-4 max-h-[320px] overflow-hidden rounded-2xl border border-border bg-muted"><img src={getImageUrl(cover)} loading="lazy" alt={`Illustration for ${note.title || 'this letter'}`} className="max-h-[320px] w-full object-cover" /></div>}
                                <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary">Open letter <ArrowRight size={15} /></span>
                            </button>
                            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-[11px] text-muted-foreground sm:px-6"><span>{likes} {likes === 1 ? 'love' : 'loves'}</span><span>{Number(note.commentCount) || 0} comments</span></div>
                            <div className="grid grid-cols-3 border-t border-border p-2">
                                {signedIn ? <button type="button" onClick={() => void toggleLike(note)} disabled={likingId === String(note.id)} aria-pressed={liked} className={`inline-flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold transition-colors hover:bg-muted disabled:opacity-50 ${liked ? 'text-rose-600' : 'text-muted-foreground'}`}><CharacterBadge name="sely" tone={liked ? "rose" : "paper"} size="xs" /> {liked ? 'Loved' : 'Love'}</button> : <Link to={`/login?returnTo=${encodeURIComponent(profileUrl)}`} className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold text-muted-foreground hover:bg-muted"><CharacterBadge name="sely" tone="paper" size="xs" /> Love</Link>}
                                <button type="button" onClick={() => onOpenLetter(note)} className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold text-muted-foreground hover:bg-muted"><CharacterBadge name="piko" tone="sage" size="xs" /> Comment</button>
                                <button type="button" onClick={() => void shareLetter(note)} className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold text-muted-foreground hover:bg-muted"><CharacterBadge name="piko" tone="paper" size="xs" /> Share</button>
                            </div>
                        </article>;
                    }) : <div className="flex flex-col items-center rounded-[25px] border border-dashed border-border bg-card px-6 py-14 text-center">
                        <CharacterBadge name="lumi" tone="sage" size="xl" /><h3 className="mt-4 font-editorial text-2xl">{query || category !== 'All' ? 'No matching stories' : 'The first chapter is still waiting'}</h3>
                        <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">{query || category !== 'All' ? 'Try another search or filter.' : ownProfile ? 'Publish a letter under your name and it will appear here for visitors to discover.' : 'This writer has no public letters under their name yet. Private and anonymous letters are not shown here.'}</p>
                        {ownProfile && onWriteLetter && <button type="button" onClick={onWriteLetter} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground"><CharacterBadge name="lumi" tone="paper" size="xs" /> Write your first post</button>}
                    </div>}
                </>}

                {tab === 'about' && <section className="rounded-[26px] border border-border bg-card p-6 shadow-sm sm:p-8">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-[hsl(var(--accent))]"><CharacterBadge name="tala" tone="gold" size="xs" /> Meet the writer</span>
                    <h2 className="mt-3 font-editorial text-3xl">Beyond the letters.</h2>
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-8 text-muted-foreground">{hasBio ? profile.bio : ownProfile ? 'Your bio is your introduction to other writers. Add a few sentences about yourself and the stories you love.' : 'This writer has not added a public introduction yet.'}</p>
                    <div className="mt-6 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
                        <div className="rounded-2xl bg-muted/70 p-5"><CharacterBadge name="tala" tone="sage" size="lg" /><p className="mt-3 text-xs font-bold">Public writing</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{publishedLetters.length} letters open to the community</p></div>
                        <div className="rounded-2xl bg-muted/70 p-5"><CharacterBadge name="piko" tone="rose" size="lg" /><p className="mt-3 text-xs font-bold">Community</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{profile.followerCount || 0} people following this writer</p></div>
                    </div>
                    {ownProfile && <button type="button" onClick={onEditProfile} className="mt-6 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground">Edit introduction</button>}
                </section>}

                {tab === 'connections' && <section className="rounded-[26px] border border-border bg-card p-6 shadow-sm sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--accent))]">A community of writers</p><h2 className="mt-2 font-editorial text-3xl">Connections</h2><p className="mt-2 text-sm text-muted-foreground">Discover people who follow this writer and the writers they follow.</p>
                    {connectionsLoading && <p className="mt-6 text-sm text-muted-foreground">Loading connections…</p>}
                    {connectionsError && <div role="alert" className="mt-5 rounded-xl bg-muted p-4 text-sm">{connectionsError}<button type="button" onClick={() => setConnectionsRefresh(n => n + 1)} className="ml-3 font-bold underline">Retry</button></div>}
                    {!connectionsLoading && !connectionsError && <div className="mt-6 grid gap-5 md:grid-cols-2">
                        {(['followers','following'] as const).map(kind => <div key={kind} className="rounded-[20px] border border-border p-4">
                            <h3 className="font-editorial text-xl capitalize">{kind}</h3><p className="mb-4 mt-1 text-xs text-muted-foreground">{people[kind].length} {kind === 'followers' ? 'following this writer' : 'writers followed'}</p>
                            {people[kind].length ? <div className="space-y-2">{people[kind].slice(0, 25).map(person => <Link key={person.id} to={`/writers/${encodeURIComponent(person.username)}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--surface-gold))] font-semibold">{person.avatar ? <img src={getImageUrl(person.avatar)} alt="" className="h-full w-full rounded-full object-cover" /> : shortName(person.username)[0]?.toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-xs font-bold">{shortName(person.username)}</span><ArrowRight size={14} className="text-muted-foreground" />
                            </Link>)}</div> : <p className="text-xs text-muted-foreground">No connections yet.</p>}
                        </div>)}
                    </div>}
                </section>}
            </main>
        </div>
    </div>;
}
