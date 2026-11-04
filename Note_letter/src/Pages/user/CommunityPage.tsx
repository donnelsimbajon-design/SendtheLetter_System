import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import CharacterBadge from '../../components/CharacterBadge';
import Mascot from '../../components/Mascot';
import LetterViewModal from '../../components/LetterViewModal';
import { getImageUrl } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useNoteStore } from '../../store/noteStore';
import type { Note } from '../../types/note';

type SortOrder = 'newest' | 'oldest' | 'popular';
type Topic = { name: string; count: number };
type Writer = { name: string; avatar?: string; count: number; latest: number };

const PAGE_SIZE = 5;
const prompts = [
    'What is something you wish you had said sooner?',
    'Who made your day a little brighter recently?',
    'What would you tell your younger self?',
    'Which small memory do you never want to forget?',
    'What is one thing you are thankful for today?',
    'What would you like your future self to remember?',
    'Who deserves a thoughtful hello from you?',
];

const dateNumber = (value: Date | string) => {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
};

const isReleasedPublic = (note: Note) => {
    if (!note.isPublic || note.status !== 'published' || note.isArchived) return false;
    const now = Date.now();
    for (const value of [note.openDate, note.scheduledDate]) {
        if (!value) continue;
        const time = dateNumber(value);
        if (!time || time > now) return false;
    }
    return true;
};

const categoryOf = (note: Note) => note.category || note.type || 'Other';
const validWriter = (note: Note) => {
    if (note.isAnonymous) return null;
    const name = note.authorName?.trim();
    return name && name !== 'Unknown' && name !== 'A Writer' && name !== 'Anonymous' ? name : null;
};
const shortDate = (value: Date | string) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? formatDistanceToNow(date, { addSuffix: true }) : 'Recently';
};
const popularity = (note: Note) => (note.likeCount || 0) + (note.commentCount || 0);

export default function CommunityPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchInput = useRef<HTMLInputElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const user = useAuthStore(state => state.user);
    const { publicLetters, isLoadingPublic, publicError, fetchPublicLetters, toggleLike } = useNoteStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [openCommentsFirst, setOpenCommentsFirst] = useState(false);
    const [likingId, setLikingId] = useState<string | null>(null);
    const [interactionError, setInteractionError] = useState('');

    useEffect(() => { void fetchPublicLetters(); }, [fetchPublicLetters]);

    // Give the native Suri sidebar shortcut a real destination, including when
    // already on the Community page. No change to public data or search privacy.
    useEffect(() => {
        if (new URLSearchParams(location.search).get('focus') === 'search') {
            searchInput.current?.focus();
        }
    }, [location.search]);

    // All discovery sections derive from the same released, public API response.
    // Anonymous authors are intentionally excluded from writer recommendations.
    const letters = useMemo(() => publicLetters.filter(isReleasedPublic), [publicLetters]);

    const topics = useMemo<Topic[]>(() => {
        const counts = new Map<string, number>();
        letters.forEach(letter => {
            const name = categoryOf(letter);
            counts.set(name, (counts.get(name) || 0) + 1);
        });
        return Array.from(counts, ([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }, [letters]);

    const writers = useMemo<Writer[]>(() => {
        const authors = new Map<string, Writer>();
        letters.forEach(letter => {
            const name = validWriter(letter);
            if (!name) return;
            const key = name.toLocaleLowerCase();
            const existing = authors.get(key);
            const created = dateNumber(letter.createdAt);
            if (existing) {
                existing.count += 1;
                if (created > existing.latest) {
                    existing.latest = created;
                    existing.avatar = letter.authorAvatar || existing.avatar;
                }
            } else {
                authors.set(key, { name, avatar: letter.authorAvatar, count: 1, latest: created });
            }
        });
        return Array.from(authors.values())
            .sort((a, b) => b.count - a.count || b.latest - a.latest || a.name.localeCompare(b.name));
    }, [letters]);

    const filteredLetters = useMemo(() => {
        const query = searchQuery.trim().toLocaleLowerCase();
        return letters.filter(letter => {
            if (categoryFilter !== 'all' && categoryOf(letter) !== categoryFilter) return false;
            if (!query) return true;
            return [
                letter.title || '', letter.content || '', categoryOf(letter),
                validWriter(letter) || '',
            ].some(value => value.toLocaleLowerCase().includes(query));
        }).sort((a, b) => {
            if (sortOrder === 'popular') return popularity(b) - popularity(a) || dateNumber(b.createdAt) - dateNumber(a.createdAt);
            if (sortOrder === 'oldest') return dateNumber(a.createdAt) - dateNumber(b.createdAt);
            return dateNumber(b.createdAt) - dateNumber(a.createdAt);
        });
    }, [letters, categoryFilter, searchQuery, sortOrder]);

    const mostLoved = useMemo(() => filteredLetters
        .filter(letter => (letter.likeCount || 0) > 0)
        .slice()
        .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0) || dateNumber(b.createdAt) - dateNumber(a.createdAt))
        .slice(0, 3), [filteredLetters]);

    const shownLetters = filteredLetters.slice(0, visibleCount);
    const hasFilters = categoryFilter !== 'all' || searchQuery.trim() !== '' || sortOrder !== 'newest';

    // Load the next page automatically when the reader nears the end of the feed.
    // No manual “Show more” button and no backend data changes.
    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target || visibleCount >= filteredLetters.length || isLoadingPublic || publicError) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0]?.isIntersecting) {
                observer.disconnect();
                setVisibleCount(count => Math.min(count + PAGE_SIZE, filteredLetters.length));
            }
        }, { rootMargin: '0px 0px 400px 0px' });
        observer.observe(target);
        return () => observer.disconnect();
    }, [visibleCount, filteredLetters.length, isLoadingPublic, publicError]);
    // Date-based creative prompt, not a claim about site-wide writing activity.
    const todayPrompt = prompts[Math.floor(Date.now() / 86400000) % prompts.length];

    const chooseTopic = (name: string) => {
        setCategoryFilter(name);
        setVisibleCount(PAGE_SIZE);
    };
    const resetFilters = () => {
        setCategoryFilter('all');
        setSearchQuery('');
        setSortOrder('newest');
        setVisibleCount(PAGE_SIZE);
    };
    const openLetter = (letter: Note, comments = false) => { setOpenCommentsFirst(comments); setSelectedNote(letter); };
    const openWriter = (name: string) => {
        setSelectedNote(null);
        navigate('/dashboard/profile/' + encodeURIComponent(name));
    };
    const likeLetter = async (id: string) => {
        if (likingId) return;
        setLikingId(id);
        setInteractionError('');
        try {
            await toggleLike(id);
        } catch {
            setInteractionError('The reaction could not be saved. Please try again.');
        } finally {
            setLikingId(null);
        }
    };

    const writeLink = '/dashboard/notes?compose=1';

    return (
        <div className="mx-auto max-w-[1500px] space-y-5 pb-12 sm:space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-5">
                <div className="max-w-2xl">
                    <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.17em] text-[hsl(var(--accent))]">
                        <CharacterBadge name="chika" tone="gold" size="xs" /> Stories from the community
                    </p>
                    <h1 className="mt-2 font-editorial text-3xl leading-tight sm:text-4xl">Discover words that matter</h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Read stories, share a feeling, and find a little connection through letters.
                    </p>
                </div>
                <Link to={writeLink} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
                    <CharacterBadge name="lumi" tone="paper" size="xs" /> Write a letter
                </Link>
            </header>

            {/* The center is first on phones. Sidebars become two discovery cards below the feed. */}
            <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[minmax(185px,225px)_minmax(0,1fr)_minmax(200px,245px)] xl:items-start xl:gap-5 2xl:grid-cols-[minmax(205px,245px)_minmax(0,1fr)_minmax(230px,265px)]">
                <aside aria-label="Writer recommendations and community links" className="order-2 min-w-0 space-y-4 xl:order-1 xl:sticky xl:top-[92px]">
                    <section className="stl-depth-card rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center gap-2">
                            <CharacterBadge name="tala" tone="gold" size="sm" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">People to discover</p>
                                <h2 className="font-editorial text-xl">Meet the writers</h2>
                            </div>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-muted-foreground">
                            Meet people sharing public letters. Select a writer to explore their stories.
                        </p>
                        <div className="mt-4 space-y-1.5">
                            {writers.length ? writers.slice(0, 5).map(writer => (
                                <Link key={writer.name.toLocaleLowerCase()} to={'/dashboard/profile/' + encodeURIComponent(writer.name)}
                                    className="flex min-h-12 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--surface-sage))] font-editorial text-lg font-semibold">
                                        {writer.avatar ? <img src={getImageUrl(writer.avatar)} alt="" className="h-full w-full object-cover" /> : writer.name.slice(0, 1).toUpperCase()}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-bold">{writer.name}</span>
                                        <span className="block text-[11px] text-muted-foreground">{writer.count} public {writer.count === 1 ? 'letter' : 'letters'}</span>
                                    </span>
                                </Link>
                            )) : (
                                <p className="rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
                                    Writer recommendations appear when people publish non-anonymous letters.
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="stl-depth-card rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
                        <h2 className="inline-flex items-center gap-2 font-editorial text-xl">
                            <CharacterBadge name="basa" tone="sage" size="sm" /> Explore by feeling
                        </h2>
                        <div className="mt-4 space-y-1">
                            {topics.length ? topics.slice(0, 6).map(topic => (
                                <button key={topic.name} type="button" aria-label={'Browse ' + topic.name + ' letters'}
                                    onClick={() => chooseTopic(topic.name)}
                                    className="flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-xs font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
                                    <span className="min-w-0 truncate">{topic.name}</span>
                                    <span className="ml-2 rounded-full bg-muted px-2 py-1 text-[10px] tabular-nums text-muted-foreground">{topic.count}</span>
                                </button>
                            )) : <p className="text-xs leading-5 text-muted-foreground">Topics will appear as public stories are shared.</p>}
                        </div>
                    </section>

                    <section className="stl-depth-card rounded-[1.5rem] bg-[hsl(var(--surface-rose))] p-5 text-[#49363B]">
                        <CharacterBadge name="lumi" tone="paper" size="md" />
                        <h2 className="mt-4 font-editorial text-2xl leading-snug">Stir my feelings</h2>
                        <p className="mt-2 text-xs leading-6 opacity-80">Need a first thought? Try this gentle prompt: {todayPrompt}</p>
                        <Link to={writeLink} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#49363B] px-4 py-2.5 text-xs font-bold text-white">Write about it</Link>
                    </section>
                </aside>

                <section aria-label="Community letter feed" className="order-1 min-w-0 space-y-4 md:col-span-2 xl:order-2 xl:col-span-1">
                    <section className="stl-depth-card rounded-[1.65rem] border border-border bg-card p-4 shadow-sm sm:p-5">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--surface-gold))] font-editorial text-lg font-bold text-[#493D2A]">
                                {user?.avatar ? <img src={getImageUrl(user.avatar)} alt="" className="h-full w-full object-cover" /> : user?.username?.slice(0, 1).toUpperCase() || 'W'}
                            </span>
                            <Link to={writeLink} className="flex min-h-12 min-w-0 flex-1 items-center rounded-full bg-muted/70 px-4 text-left text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
                                What would you like to write today{user?.username ? ', ' + user.username.split('@')[0] : ''}?
                            </Link>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                            <Link to={writeLink} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold hover:bg-muted"><CharacterBadge name="piko" tone="paper" size="xs" /> Share a story</Link>
                            <Link to={writeLink} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold hover:bg-muted"><CharacterBadge name="susi" tone="paper" size="xs" /> Private note</Link>
                            <Link to="/dashboard/notes?compose=1&template=future-self" className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold hover:bg-muted"><CharacterBadge name="araw" tone="paper" size="xs" /> Future me</Link>
                        </div>
                        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Choose Private or Public inside the editor before finishing.</p>
                    </section>

                    <section id="community-topics" aria-label="Explore letter topics" className="stl-depth-card rounded-[1.5rem] border border-border bg-card p-4 shadow-sm sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="inline-flex items-center gap-2 font-editorial text-xl"><CharacterBadge name="basa" tone="sage" size="xs" /> Explore stories</h2>
                            <span className="text-[11px] text-muted-foreground">Public letters only</span>
                        </div>
                        <div role="group" aria-label="Filter public letters by topic" className="mt-4 flex gap-2 overflow-x-auto pb-2">
                            {['all', ...topics.map(topic => topic.name)].map(topic => (
                                <button key={topic} type="button" aria-pressed={categoryFilter === topic} onClick={() => chooseTopic(topic)}
                                    className={'min-h-10 shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
                                        (categoryFilter === topic ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted')}>
                                    {topic === 'all' ? 'All stories' : topic}
                                </button>
                            ))}
                        </div>
                        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row">
                            <label className="relative min-w-0 flex-1">
                                <span className="sr-only">Search public letters</span>
                                <CharacterBadge name="suri" tone="paper" size="xs" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
                                <input ref={searchInput} value={searchQuery} onChange={event => { setSearchQuery(event.target.value); setVisibleCount(PAGE_SIZE); }}
                                    aria-label="Search public letters" placeholder="Search a story, feeling, or writer..."
                                    className="h-11 w-full min-w-0 rounded-xl border border-border bg-background pl-12 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                            </label>
                            <label className="flex min-w-0 items-center gap-2 text-xs font-semibold text-muted-foreground">
                                Sort
                                <select aria-label="Sort community letters" value={sortOrder} onChange={event => { setSortOrder(event.target.value as SortOrder); setVisibleCount(PAGE_SIZE); }}
                                    className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-xs text-foreground sm:flex-none">
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="popular">Most appreciated</option>
                                </select>
                            </label>
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                        <p aria-live="polite" className="text-xs text-muted-foreground">
                            Showing {Math.min(visibleCount, filteredLetters.length)} of {letters.length} public letters
                        </p>
                        {hasFilters && <button type="button" onClick={resetFilters} className="min-h-10 rounded-full px-3 text-xs font-bold text-primary underline-offset-4 hover:underline">Clear filters</button>}
                    </div>

                    {interactionError && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{interactionError}</div>}
                    {publicError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
                        <span>Community letters could not load: {publicError}</span>
                        <button type="button" onClick={() => void fetchPublicLetters()} className="min-h-10 font-bold underline">Try again</button>
                    </div>}
                    {isLoadingPublic && !letters.length && !publicError && <p role="status" className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading community letters…</p>}

                    <div aria-label="Public letters" className="space-y-4">
                        {shownLetters.map(letter => {
                            const writer = validWriter(letter);
                            return (
                                <article key={letter.id} className="stl-depth-card overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                                    <div className="flex items-center gap-3 px-5 pb-3 pt-5 sm:px-6">
                                        {writer && letter.authorAvatar
                                            ? <img src={getImageUrl(letter.authorAvatar)} alt="" className="h-11 w-11 shrink-0 rounded-full bg-muted object-cover" />
                                            : <CharacterBadge name={writer ? 'lumi' : 'susi'} tone="paper" size="md" />}
                                        <div className="min-w-0 flex-1">
                                            {writer
                                                ? <button type="button" onClick={() => openWriter(writer)} className="max-w-full truncate text-left text-sm font-bold hover:underline">{writer}</button>
                                                : <p className="text-sm font-bold">Anonymous writer</p>}
                                            <p className="mt-0.5 text-[11px] text-muted-foreground">{shortDate(letter.createdAt)} · {categoryOf(letter)}</p>
                                        </div>
                                        <span className="hidden rounded-full bg-[hsl(var(--surface-sage))]/60 px-3 py-1.5 text-[10px] font-semibold text-foreground sm:inline-flex">Public letter</span>
                                    </div>

                                    <div className="px-5 pb-4 sm:px-6">
                                        <h3 className="font-editorial text-[1.55rem] leading-tight sm:text-[1.9rem]">{letter.title || 'Untitled letter'}</h3>
                                        {letter.imageUrl ? (
                                            <div className="mt-4 overflow-hidden rounded-[1.2rem] bg-muted">
                                                <img src={getImageUrl(letter.imageUrl)} alt={'Cover artwork for ' + (letter.title || 'a public letter')}
                                                    loading="lazy" className="max-h-[390px] w-full object-cover"
                                                    onError={event => { event.currentTarget.style.display = 'none'; }} />
                                            </div>
                                        ) : (
                                            <div className="paper-grain relative mt-4 rounded-[1.2rem] border border-border/70 bg-[hsl(var(--surface-sage))]/35 px-6 py-7 sm:px-8 sm:py-9">
                                                <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
                                                    <span className="text-[10px] font-bold uppercase tracking-[.17em] text-muted-foreground">A letter to read</span>
                                                    <CharacterBadge name="sely" tone="paper" size="xs" />
                                                </div>
                                                <p className="line-clamp-5 whitespace-pre-line font-editorial text-lg leading-8 text-foreground/85 sm:text-xl">{letter.content}</p>
                                            </div>
                                        )}
                                        {letter.imageUrl && <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{letter.content}</p>}
                                        <div className="mt-4 flex items-center justify-between gap-3">
                                            <span className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">{categoryOf(letter)}</span>
                                            <button type="button" onClick={() => openLetter(letter)} aria-label={'Read letter: ' + (letter.title || 'Untitled letter')}
                                                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">
                                                Read letter <CharacterBadge name="basa" tone="paper" size="xs" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 border-t border-border/80 px-3 py-2 sm:px-5">
                                        <button type="button" onClick={() => void likeLetter(String(letter.id))} disabled={likingId !== null}
                                            aria-label={(letter.isLikedByUser ? 'Unlike' : 'Like') + ' letter: ' + (letter.title || 'Untitled letter')}
                                            aria-pressed={Boolean(letter.isLikedByUser)}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">
                                            <CharacterBadge name="sely" tone={letter.isLikedByUser ? 'rose' : 'paper'} size="xs" />
                                            <span>{letter.likeCount || 0} <span className="hidden sm:inline">Appreciations</span></span>
                                        </button>
                                        <button type="button" onClick={() => openLetter(letter, true)} aria-label={'View comments for ' + (letter.title || 'Untitled letter')}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
                                            <CharacterBadge name="chika" tone="paper" size="xs" />{letter.commentCount || 0} <span className="hidden sm:inline">Comments</span>
                                        </button>
                                        <button type="button" onClick={() => openLetter(letter)} aria-label={'Open sharing options for ' + (letter.title || 'Untitled letter')}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
                                            <CharacterBadge name="piko" tone="paper" size="xs" />Share
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {!isLoadingPublic && !publicError && filteredLetters.length === 0 && (
                        <section className="stl-depth-card rounded-[1.6rem] border border-dashed border-border bg-card px-5 py-10 text-center">
                            <Mascot name="basa" className="mx-auto h-24 w-24" />
                            <h2 className="mt-3 font-editorial text-2xl">{hasFilters ? 'No stories match yet' : 'A story will find its way here.'}</h2>
                            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                                {hasFilters ? 'Try another topic or clear your search.' : 'When writers share public letters, you will find them here.'}
                            </p>
                            {hasFilters
                                ? <button type="button" onClick={resetFilters} className="mt-5 min-h-11 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">Clear filters</button>
                                : <Link to={writeLink} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">Write a letter</Link>}
                        </section>
                    )}

                    {shownLetters.length < filteredLetters.length && !publicError && (
                        <div ref={loadMoreRef} role="status" aria-label="More letters appear automatically as you scroll" className="flex min-h-12 items-center justify-center py-3 text-xs text-muted-foreground">
                            Keep scrolling to discover more stories…
                        </div>
                    )}
                </section>

                <aside aria-label="Community topics and spotlights" className="order-3 min-w-0 space-y-4 xl:sticky xl:top-[92px]">
                    <section className="stl-depth-card rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center gap-2">
                            <CharacterBadge name="araw" tone="gold" size="sm" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">In this collection</p>
                                <h2 className="font-editorial text-xl">Popular topics</h2>
                            </div>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-muted-foreground">Explore the topics that appear most often in published community letters.</p>
                        <div className="mt-4 space-y-2">
                            {topics.length ? topics.slice(0, 5).map((topic, index) => (
                                <button type="button" key={topic.name} onClick={() => chooseTopic(topic.name)}
                                    aria-label={'Explore topic ' + topic.name}
                                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left transition-colors hover:bg-muted">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--surface-gold))] font-editorial text-sm font-bold text-[#493D2A]">{index + 1}</span>
                                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">{topic.name}</span>
                                    <span className="text-[11px] tabular-nums text-muted-foreground">{topic.count}</span>
                                </button>
                            )) : <p className="text-xs leading-5 text-muted-foreground">Popular topics will appear when public letters are available.</p>}
                        </div>
                    </section>

                    <section className="stl-depth-card rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
                        <h2 className="flex items-center gap-2 font-editorial text-xl"><CharacterBadge name="sely" tone="rose" size="sm" /> Most appreciated</h2>
                        <p className="mt-3 text-xs leading-5 text-muted-foreground">Discover letters readers have appreciated most among the selected stories.</p>
                        <div className="mt-4 space-y-3">
                            {mostLoved.length ? mostLoved.map(letter => (
                                <button type="button" key={letter.id} onClick={() => openLetter(letter)}
                                    className="w-full rounded-xl border-b border-border/60 pb-3 text-left last:border-0 last:pb-0 focus-visible:outline-2 focus-visible:outline-primary">
                                    <span className="block line-clamp-2 font-editorial text-base font-semibold leading-snug hover:underline">{letter.title || 'Untitled letter'}</span>
                                    <span className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                                        <CharacterBadge name="sely" tone="paper" size="xs" />
                                        {letter.likeCount || 0} {letter.likeCount === 1 ? 'appreciation' : 'appreciations'}
                                    </span>
                                </button>
                            )) : <p className="rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">The first appreciations will be highlighted here.</p>}
                        </div>
                    </section>

                    <section className="stl-depth-card rounded-[1.5rem] bg-primary p-5 text-primary-foreground">
                        <CharacterBadge name="tala" tone="paper" size="md" />
                        <p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] opacity-70">Today's writing prompt</p>
                        <h2 className="mt-2 font-editorial text-2xl leading-snug">{todayPrompt}</h2>
                        <p className="mt-3 text-xs leading-6 opacity-80">One simple question can start a meaningful letter.</p>
                        <Link to={writeLink} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[hsl(var(--surface-gold))] px-4 py-2.5 text-xs font-bold text-[#493D2A]">Write your answer</Link>
                    </section>

                    <section className="stl-depth-card rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
                        <h2 className="font-editorial text-xl">A kinder place to write</h2>
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">
                            Share with care. Respect privacy, avoid personal attacks, and remember there is a person behind every letter.
                        </p>
                        <Link to="/dashboard/settings" className="mt-3 inline-flex min-h-10 items-center text-xs font-bold text-primary underline-offset-4 hover:underline">Privacy & writing settings</Link>
                    </section>
                </aside>
            </div>

            <LetterViewModal isOpen={selectedNote !== null} onClose={() => setSelectedNote(null)}
                note={selectedNote} initialComments={openCommentsFirst} onAuthorClick={openWriter} />
        </div>
    );
}
