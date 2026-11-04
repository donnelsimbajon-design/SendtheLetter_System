import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
    blockAction?: { blocked: boolean; canInteract: boolean; busy: boolean; onClick: () => void };
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
    { id: 'letters', text: 'Letters', mascot: 'basa' },
    { id: 'about', text: 'About', mascot: 'tala' },
    { id: 'connections', text: 'Connections', mascot: 'chika' },
];

export default function WriterProfileScreen({
    profile, ownProfile = false, letters, reposts, loading = false, error = '', onRetry,
    onOpenLetter, onEditProfile, onWriteLetter, onFollow, followBusy, onMessage, friendAction, blockAction,
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

    return <div className="mx-auto w-full max-w-[1080px] space-y-5 pb-12 text-foreground">
        <section aria-label="Writer profile header" className="overflow-hidden rounded-[24px] border border-[#d9d4c6] bg-card shadow-[0_8px_30px_rgba(36,54,43,.045)]">
            <div className="relative h-28 overflow-hidden bg-[#d7e2d9] sm:h-36">
                {profile.coverImage
                    ? <img src={getImageUrl(profile.coverImage)} alt="Writer cover" className="absolute inset-0 h-full w-full object-cover" />
                    : <>
                        <div aria-hidden="true" className="absolute -right-10 -top-24 h-56 w-72 rotate-12 rounded-[55%] border border-[#a3b6a5]/50 bg-[#c8d6c9]/65" />
                        <div aria-hidden="true" className="absolute -bottom-24 left-[30%] h-40 w-64 -rotate-12 rounded-[55%] border border-[#e8d8bc]/70 bg-[#ebdfca]/60" />
                        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[#b8cbb9]/70" />
                    </>}
                <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/75 bg-[#fffaf2]/90 px-3 py-1.5 text-[11px] font-semibold text-[#385345] shadow-sm backdrop-blur sm:left-7">
                    Writer profile
                </span>
                {ownProfile && onEditProfile && <button type="button" onClick={onEditProfile} className="absolute right-4 top-4 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/80 bg-[#fffaf2]/95 px-3 py-1.5 text-xs font-semibold text-[#304d3e] shadow-sm hover:bg-white sm:right-7">Edit cover</button>}
            </div>
            <div className="px-5 pb-5 sm:px-7 sm:pb-6">
                <div className="-mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 sm:-mt-11">
                    <div className="relative flex h-[82px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-[21px] border-[4px] border-card bg-[#e4d7b9] font-editorial text-3xl font-semibold text-[#425746] shadow-[0_4px_16px_rgba(40,52,38,.12)] sm:h-[94px] sm:w-[94px]">
                        {profile.avatar ? <img src={getImageUrl(profile.avatar)} alt={name} className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-[160px] flex-1 pt-9 sm:pt-11">
                        <p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#9a765c]">{ownProfile ? 'Your space, your stories' : 'Meet the writer'}</p>
                        <h1 className="mt-1 break-words font-editorial text-[clamp(1.8rem,3.2vw,2.55rem)] font-semibold leading-tight tracking-tight text-[#283f35]">{name}</h1>
                        <p className="mt-1.5 max-w-xl break-words text-sm leading-6 text-[#66756b]">{profile.bio?.trim() || (ownProfile ? 'Add a little introduction so other writers can get to know you.' : 'Sharing stories one letter at a time.')}</p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#738074]">
                            {profile.location && <span>{profile.location}</span>}
                            {friendlyDate(profile.createdAt) && <span>Joined {friendlyDate(profile.createdAt)}</span>}
                            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#7f9b81]" /> Public writer profile</span>
                        </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end lg:self-end">
                        {ownProfile ? <>
                            <button type="button" onClick={onEditProfile} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white/90 px-4 py-2.5 text-xs font-bold hover:bg-muted"><CharacterBadge name="lumi" tone="paper" size="xs" /> Edit profile</button>
                            <button type="button" onClick={onWriteLetter} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"><CharacterBadge name="lumi" tone="paper" size="xs" /> Write a letter</button>
                        </> : isSelfVisitor ? <Link to="/dashboard/profile" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"><CharacterBadge name="lumi" tone="paper" size="xs" /> Manage my profile</Link> : <>
                            {blockAction && !blockAction.canInteract ? <span className="rounded-full border border-border bg-muted px-4 py-2.5 text-xs text-muted-foreground">Interactions unavailable</span> : <>
                            {signedIn ? <button type="button" onClick={onFollow} disabled={followBusy} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold disabled:opacity-50 ${profile.isFollowing ? 'border border-border bg-background hover:bg-muted' : 'bg-primary text-primary-foreground hover:opacity-90'}`}>{profile.isFollowing ? <><CharacterBadge name="sely" tone="rose" size="xs" /> Following</> : <><CharacterBadge name="piko" tone="sage" size="xs" /> Follow</>}</button> : <Link to={`/login?returnTo=${encodeURIComponent(profileUrl)}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"><CharacterBadge name="piko" tone="sage" size="xs" /> Follow</Link>}
                            {friendAction && signedIn && <button type="button" onClick={friendAction.onClick} disabled={friendAction.disabled || !friendAction.onClick} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-bold hover:bg-muted disabled:opacity-50"><CharacterBadge name="sely" tone="sage" size="xs" /> {friendAction.label}</button>}
                            {friendAction?.secondaryLabel && friendAction.secondaryClick && signedIn && <button type="button" onClick={friendAction.secondaryClick} disabled={friendAction.disabled} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-50">{friendAction.secondaryLabel}</button>}
                            {signedIn ? <button type="button" onClick={onMessage} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-bold hover:bg-muted"><CharacterBadge name="chika" tone="sage" size="xs" /> Message</button> : <Link to={`/login?returnTo=${encodeURIComponent(profileUrl)}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-bold"><CharacterBadge name="chika" tone="sage" size="xs" /> Message</Link>}
                            </>}
                            {signedIn && blockAction && <button type="button" onClick={blockAction.onClick} disabled={blockAction.busy}
                                className="inline-flex min-h-10 items-center rounded-full border border-border bg-background px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-50">
                                {blockAction.blocked ? 'Unblock writer' : 'Block writer'}
                            </button>}
                        </>}
                        <button type="button" onClick={() => void shareProfile()} aria-label="Copy public profile link" title="Copy public profile link" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/90 hover:bg-muted"><CharacterBadge name="piko" tone="paper" size="sm" /></button>
                    </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#e5dfd5] pt-4 text-xs text-muted-foreground sm:gap-x-8">
                    <div><strong className="mr-1.5 font-editorial text-xl text-foreground">{publishedLetters.length}</strong> public letters</div>
                    <button type="button" onClick={() => setTab('connections')} className="rounded-sm text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"><strong className="mr-1.5 font-editorial text-xl text-foreground">{profile.followerCount || 0}</strong> followers</button>
                    <button type="button" onClick={() => setTab('connections')} className="rounded-sm text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"><strong className="mr-1.5 font-editorial text-xl text-foreground">{profile.followingCount || 0}</strong> following</button>
                </div>
            </div>
        </section>

        <nav aria-label="Writer profile sections" className="sticky top-16 z-20 flex gap-1 overflow-x-auto rounded-2xl border border-border/60 bg-background/70 px-2 py-1.5 backdrop-blur-lg lg:top-3">
            {topTabs.map(({ id, text }) => <button key={id} type="button" onClick={() => { setTab(id); setFeedback(''); setCategory('All'); }}
                aria-current={tab === id ? 'page' : undefined}
                aria-pressed={tab === id}
                className={`min-w-[76px] flex-1 whitespace-nowrap rounded-xl border border-transparent bg-transparent px-3 py-3 text-[13px] font-semibold transition-[transform,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:opacity-80 active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none sm:text-sm ${tab === id ? 'text-foreground opacity-100' : 'text-muted-foreground opacity-75'}`}>
                {text}
            </button>)}
        </nav>

        {(feedback || actionError) && <div role="status" className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-semibold"><span>{actionError || feedback}</span><button type="button" aria-label="Dismiss message" onClick={() => { setFeedback(''); onDismissActionError?.(); }} className="rounded-full p-1 hover:bg-muted">Dismiss</button></div>}
        <div className={tab === 'posts' || tab === 'letters' ? 'grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_265px]' : 'min-w-0'}>
            <main className="min-w-0 space-y-4">
                {(tab === 'posts' || tab === 'letters') && <>
                    <div className="rounded-[21px] border border-border bg-card p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[hsl(var(--accent))]">{tab === 'posts' ? 'Timeline' : 'Published writing'}</p><h2 className="mt-1 font-editorial text-2xl">{tab === 'posts' ? 'Latest from the desk' : 'Public letter collection'}</h2></div>
                            {onRefresh && <button type="button" onClick={onRefresh} className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline">Refresh</button>}
                        </div>
                        {feed.length > 0 && <>
                        <div className="relative mt-3"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search this writer's letters…" aria-label="Search profile posts" className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" /></div>
                        {categoryOptions.length > 2 && <div aria-label="Filter by letter category" className="mt-4 flex gap-2 overflow-x-auto pb-1">
                            {categoryOptions.map(item => <button type="button" key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${category === item ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{item}</button>)}
                        </div>}
                        </>}
                    </div>
                    {loading ? <div className="rounded-[24px] border border-border bg-card p-12 text-center text-sm text-muted-foreground">Opening the writer's shelf…</div> : error ? <div role="alert" className="rounded-[24px] border border-border bg-card p-7 text-sm"><p>{error}</p><button type="button" onClick={onRetry} className="mt-4 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">Try again</button></div> : filtered.length ? filtered.map(({ note, isRepost, date }, index) => {
                        const state = likeStates[String(note.id)];
                        const liked = state?.liked ?? !!note.isLikedByUser;
                        const likes = state?.count ?? (Number(note.likeCount) || 0);
                        const cover = note.imageUrl || note.letterPages?.find(page => page.imageData)?.imageData;
                        return <article key={`${isRepost ? 'repost' : 'letter'}-${note.id}-${index}`} className="overflow-hidden rounded-[21px] border border-border bg-card transition-shadow hover:shadow-sm">
                            <div className="flex items-start gap-3 px-5 pb-3 pt-5 sm:px-6">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e9ddc3] font-editorial text-lg font-semibold text-[#425546]">{profile.avatar ? <img src={getImageUrl(profile.avatar)} alt="" className="h-full w-full object-cover" /> : name[0]?.toUpperCase()}</span>
                                <div className="min-w-0 flex-1"><p className="text-sm font-bold">{name} {isRepost && <span className="ml-1 text-xs font-normal text-muted-foreground">shared a letter</span>}</p><p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">{relativeDate(date)} <span className="h-1 w-1 rounded-full bg-muted-foreground/50" /><CharacterBadge name="tala" tone="paper" size="xs" /> Public</p></div>
                                <span className="rounded-full bg-[hsl(var(--surface-gold))] px-3 py-1.5 text-[10px] font-bold text-[#5a4b38]">{note.category || note.type || 'Letter'}</span>
                            </div>
                            {isRepost && <p className="mb-2 px-5 text-xs text-muted-foreground sm:px-6">
                                Originally written by {note.isAnonymous || !note.authorName || note.authorName === 'A Writer'
                                    ? 'Anonymous Writer'
                                    : <Link to={`/writers/${encodeURIComponent(note.authorName)}`} className="font-bold text-primary hover:underline">{note.authorName}</Link>}
                            </p>}
                            <button type="button" onClick={() => onOpenLetter(note)} aria-label={`Read ${note.title || 'letter'}`} className="block w-full px-5 pb-4 text-left sm:px-6">
                                <h3 className="break-words font-editorial text-2xl font-semibold leading-tight text-foreground sm:text-[29px]">{note.title || 'A letter without a title'}</h3>
                                <p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words font-serif text-[15px] leading-7 text-muted-foreground">{note.content || 'Open this story to read the letter.'}</p>
                                {cover && <div className="mt-4 max-h-[320px] overflow-hidden rounded-2xl border border-border bg-muted"><img src={getImageUrl(cover)} loading="lazy" alt={`Illustration for ${note.title || 'this letter'}`} className="max-h-[320px] w-full object-cover" /></div>}
                                <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary">Open letter </span>
                            </button>
                            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-[11px] text-muted-foreground sm:px-6"><span>{likes} {likes === 1 ? 'love' : 'loves'}</span><span>{Number(note.commentCount) || 0} comments</span></div>
                            <div className="grid grid-cols-3 border-t border-border p-2">
                                {signedIn ? <button type="button" onClick={() => void toggleLike(note)} disabled={likingId === String(note.id)} aria-pressed={liked} className={`inline-flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold transition-colors hover:bg-muted disabled:opacity-50 ${liked ? 'text-rose-600' : 'text-muted-foreground'}`}><CharacterBadge name="sely" tone={liked ? "rose" : "paper"} size="xs" /> {liked ? 'Loved' : 'Love'}</button> : <Link to={`/login?returnTo=${encodeURIComponent(profileUrl)}`} className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold text-muted-foreground hover:bg-muted"><CharacterBadge name="sely" tone="paper" size="xs" /> Love</Link>}
                                <button type="button" onClick={() => onOpenLetter(note)} className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold text-muted-foreground hover:bg-muted"><CharacterBadge name="chika" tone="sage" size="xs" /> Comment</button>
                                <button type="button" onClick={() => void shareLetter(note)} className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold text-muted-foreground hover:bg-muted"><CharacterBadge name="piko" tone="paper" size="xs" /> Share</button>
                            </div>
                        </article>;
                    }) : <div className="flex flex-col items-center rounded-[21px] border border-dashed border-border bg-card px-6 py-10 text-center">
                        <CharacterBadge name="basa" tone="sage" size="xl" /><h3 className="mt-4 font-editorial text-2xl">{query || category !== 'All' ? 'No matching stories' : 'The first chapter is still waiting'}</h3>
                        <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">{query || category !== 'All' ? 'Try another search or filter.' : ownProfile ? 'Publish a letter under your name and it will appear here for visitors to discover.' : 'This writer has no public letters under their name yet. Private and anonymous letters are not shown here.'}</p>
                        {ownProfile && onWriteLetter && <button type="button" onClick={onWriteLetter} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground"><CharacterBadge name="lumi" tone="paper" size="xs" /> Write your first post</button>}
                    </div>}
                </>}

                {tab === 'about' && <section className="rounded-[26px] border border-border bg-card p-6 shadow-sm sm:p-8">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-[hsl(var(--accent))]"><CharacterBadge name="tala" tone="gold" size="xs" /> Meet the writer</span>
                    <h2 className="mt-3 font-editorial text-3xl">Beyond the letters.</h2>
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-8 text-muted-foreground">{hasBio ? profile.bio : ownProfile ? 'Your bio is your introduction to other writers. Add a few sentences about yourself and the stories you love.' : 'This writer has not added a public introduction yet.'}</p>
                    <div className="mt-6 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
                        <div className="rounded-2xl bg-muted/70 p-5"><CharacterBadge name="basa" tone="sage" size="lg" /><p className="mt-3 text-xs font-bold">Public writing</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{publishedLetters.length} letters open to the community</p></div>
                        <div className="rounded-2xl bg-muted/70 p-5"><CharacterBadge name="chika" tone="rose" size="lg" /><p className="mt-3 text-xs font-bold">Community</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{profile.followerCount || 0} people following this writer</p></div>
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
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--surface-gold))] font-semibold">{person.avatar ? <img src={getImageUrl(person.avatar)} alt="" className="h-full w-full rounded-full object-cover" /> : shortName(person.username)[0]?.toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-xs font-bold">{shortName(person.username)}</span>
                            </Link>)}</div> : <p className="text-xs text-muted-foreground">No connections yet.</p>}
                        </div>)}
                    </div>}
                </section>}
            </main>
            {(tab === 'posts' || tab === 'letters') && <aside aria-label="Writer shortcuts" className="space-y-4">
                <section className="rounded-[21px] border border-border bg-card p-5">
                    <h2 className="font-editorial text-xl text-[#304b3e]">About {name}</h2>
                    <p className="mt-2 line-clamp-4 break-words text-[13px] leading-6 text-muted-foreground">{hasBio ? profile.bio : 'A space for meaningful letters, little memories, and stories worth keeping.'}</p>
                    <button type="button" onClick={() => setTab('about')} className="mt-4 rounded-lg text-xs font-semibold text-[#315d47] underline underline-offset-4 hover:text-[#233e30]">Read more about this writer</button>
                </section>
                {ownProfile
                    ? <section className="rounded-[21px] border border-[#d9e0d0] bg-[#eaf0e6] p-5">
                        <h2 className="font-editorial text-xl text-[#304b3e]">Your writing space</h2>
                        <p className="mt-2 text-xs leading-5 text-[#697c6d]">Keep drafts and private letters in your library.</p>
                        <Link to="/dashboard/notes" className="mt-4 flex min-h-10 items-center justify-between rounded-xl bg-card px-3 py-2.5 text-xs font-semibold text-[#2f4b3a] hover:bg-white">My library <span aria-hidden="true">→</span></Link>
                        <Link to="/dashboard/settings" className="mt-2 flex min-h-10 items-center justify-between rounded-xl border border-[#c9d7c6] px-3 py-2.5 text-xs font-semibold text-[#2f4b3a] hover:bg-white/70">Profile settings <span aria-hidden="true">→</span></Link>
                        <Link to={profileUrl} className="mt-3 inline-block text-xs font-medium text-[#536a57] underline underline-offset-4 hover:text-[#2f4b3a]">View public profile</Link>
                    </section>
                    : <Link to={signedIn ? '/dashboard/community' : '/'} className="block rounded-[21px] border border-[#d9e0d0] bg-[#eaf0e6] p-5 text-[#34543f] hover:bg-[#e1eadd]">
                        <h2 className="font-editorial text-xl">Discover more letters</h2>
                        <p className="mt-2 text-xs leading-5">Explore thoughtful stories from other writers.</p>
                        <span className="mt-3 inline-block text-xs font-bold">Explore community →</span>
                    </Link>}
            </aside>}
        </div>
    </div>;
}
