import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNoteStore } from '../../store/noteStore';
import Notecard from '../../components/Notecard';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import LetterEditorModal from '../../components/LetterEditorModal';
import LetterViewModal from '../../components/LetterViewModal';
import { Note } from '../../types/note';
import clsx from 'clsx';
import Mascot from '../../components/Mascot';
import CharacterBadge from '../../components/CharacterBadge';
import { API_ENDPOINTS } from '../../config/api';
import { LayoutGrid, BookOpenText } from 'lucide-react';
import MemoryShelf from '../../components/MemoryShelf';
import LetterOpeningDialog from '../../components/LetterOpeningDialog';
import TimeCapsuleCard from '../../components/TimeCapsuleCard';
import { readGuestLetter, clearGuestLetter } from '../../lib/guestLetterDraft';

const Notes = ({ initialTab = 'personal' }: { initialTab?: 'personal' | 'public' }) => {
    const isCommunity = initialTab === 'public';
    const { notes, drafts, archived, publicLetters, isLoadingPublic, publicError, addNote, fetchMyLetters, fetchPublicLetters, fetchDrafts, fetchArchivedLetters, restoreArchivedNote } = useNoteStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'popular'>('newest');
    const [libraryView, setLibraryView] = useState<'grid' | 'shelf'>('grid');
    const [openingNote, setOpeningNote] = useState<Note | null>(null);
    const [skipReaderOpening, setSkipReaderOpening] = useState(false);
    const [params, setParams] = useSearchParams();
    const navigate = useNavigate();
    const openWriterProfile = (username: string) => {
        if (!username.trim()) return;
        setIsViewModalOpen(false);
        setSelectedNote(null);
        navigate(`/dashboard/profile/${encodeURIComponent(username)}`);
    };
    const [activeTab, setActiveTab] = useState<'public' | 'personal' | 'drafts' | 'scheduled' | 'archived'>(initialTab);
    useEffect(() => { setActiveTab(initialTab); }, [initialTab]);
    useEffect(() => {
        if (isCommunity) return;
        const requested = params.get('tab');
        if (requested === 'drafts' || requested === 'personal' || requested === 'scheduled' || requested === 'archived') {
            setActiveTab(requested);
        }
    }, [isCommunity, params]);
    const [scheduledNotes, setScheduledNotes] = useState<Note[]>([]);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [restoreError, setRestoreError] = useState('');
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [starterTemplate, setStarterTemplate] = useState('');
    const [guestImportPending, setGuestImportPending] = useState(false);

    // A safe, shareable compose link opens an existing editor template.
    useEffect(() => {
        if (isCommunity || params.get('compose') !== '1') return;
        const template = params.get('template') || '';
        const fromGuest = !isCommunity && params.get('guest') === '1';
        const guestDraft = fromGuest ? readGuestLetter() : null;
        setGuestImportPending(Boolean(guestDraft));
        setStarterTemplate(fromGuest ? '' : (['gratitude', 'future-self', 'apology', 'hello'].includes(template) ? template : ''));
        setEditingNote(guestDraft ? ({ ...guestDraft, status: 'draft', isPublic: false, type: guestDraft.category } as unknown as Note) : null);
        setIsEditorOpen(true);
        const next = new URLSearchParams(params);
        next.delete('compose');
        next.delete('template');
        next.delete('guest');
        setParams(next, { replace: true });
    }, [isCommunity, params, setParams]);

    // View Modal State
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const fetchScheduledNotes = async () => {
        try {
            const token = localStorage.getItem('token');
            const result = await fetch(`${API_ENDPOINTS.letters}/scheduled`, { headers: { Authorization: `Bearer ${token}` } });
            if (result.ok) {
                const data = await result.json();
                setScheduledNotes(Array.isArray(data) ? data : []);
            }
        } catch (error) { console.error('Could not refresh scheduled letters:', error); }
    };

    useEffect(() => {
        if (isCommunity) {
            void fetchPublicLetters();
        } else {
            void Promise.all([fetchMyLetters(), fetchDrafts(), fetchArchivedLetters(), fetchScheduledNotes()]);
        }
    }, [isCommunity, fetchMyLetters, fetchPublicLetters, fetchDrafts, fetchArchivedLetters]);

    // Refresh the server release status when returning to the tab, and periodically
    // while it is open. Never unlock a capsule on the client clock alone.
    useEffect(() => {
        if (isCommunity || activeTab !== 'scheduled') return;
        const refresh = () => {
            if (!document.hidden) void Promise.all([fetchScheduledNotes(), fetchMyLetters()]);
        };
        const timer = window.setInterval(refresh, 60000);
        document.addEventListener('visibilitychange', refresh);
        return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
    }, [activeTab, isCommunity, fetchMyLetters]);

    const visibleNotes = isCommunity
        ? publicLetters.filter(note => note.isPublic && note.status === 'published' && !note.isArchived &&
            (!note.openDate || new Date(note.openDate).getTime() <= Date.now()) &&
            (!note.scheduledDate || new Date(note.scheduledDate).getTime() <= Date.now()))
        : activeTab === 'personal' ? notes.filter(note => note.status === 'published' && !note.isArchived)
        : activeTab === 'drafts' ? drafts : activeTab === 'archived' ? archived : scheduledNotes;
    const categories = useMemo(
        () => Array.from(new Set(visibleNotes.map(note => note.category || note.type || 'Other'))).sort(),
        [visibleNotes]
    );
    const filteredNotes = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return visibleNotes.filter(note => {
            const category = note.category || note.type || 'Other';
            return (categoryFilter === 'all' || category === categoryFilter) &&
                (!query || [note.title, note.content, note.authorName || '', category].some(value => value.toLowerCase().includes(query)));
        }).sort((a, b) => sortOrder === 'popular'
            ? ((b.likeCount || 0) + (b.commentCount || 0)) - ((a.likeCount || 0) + (a.commentCount || 0))
            : sortOrder === 'oldest'
                ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [visibleNotes, searchQuery, categoryFilter, sortOrder]);

    useEffect(() => {
        const id = params.get('letterId');
        if (!id) return;

        if (isCommunity) {
            const released = publicLetters.find(note => String(note.id) === id &&
                note.isPublic && note.status === 'published' && !note.isArchived &&
                (!note.openDate || new Date(note.openDate).getTime() <= Date.now()) &&
                (!note.scheduledDate || new Date(note.scheduledDate).getTime() <= Date.now()));
            if (!released) return;
            setSelectedNote(released);
            setIsViewModalOpen(true);
        } else {
            // A Library deep link may reference a draft, scheduled letter, or archive.
            // Look only in the current owner's lists, never in the public feed.
            const target = ([
                { tab: 'personal' as const, note: notes.find(note => String(note.id) === id) },
                { tab: 'drafts' as const, note: drafts.find(note => String(note.id) === id) },
                { tab: 'scheduled' as const, note: scheduledNotes.find(note => String(note.id) === id) },
                { tab: 'archived' as const, note: archived.find(note => String(note.id) === id) },
            ]).find(item => item.note);
            if (!target?.note) return;
            setActiveTab(target.tab);
            if (target.tab === 'drafts' || target.tab === 'scheduled') {
                setEditingNote(target.note);
                setIsEditorOpen(true);
            } else if (target.tab === 'personal') {
                setSelectedNote(target.note);
                setIsViewModalOpen(true);
            }
            // Archived letters are displayed in the Archive tab with a Restore action.
        }
        const next = new URLSearchParams(params);
        next.delete('letterId');
        setParams(next, { replace: true });
    }, [isCommunity, notes, drafts, scheduledNotes, archived, publicLetters, params, setParams]);

    const reloadLetters = async () => {
        await Promise.all([fetchMyLetters(), fetchPublicLetters(), fetchDrafts(), fetchArchivedLetters(), fetchScheduledNotes()]);
    };

    const restoreLetter = async (id: string) => {
        if (restoringId) return;
        setRestoringId(id);
        setRestoreError('');
        try {
            await restoreArchivedNote(id);
            await fetchScheduledNotes();
        } catch (error) {
            setRestoreError(error instanceof Error ? error.message : 'Could not restore this letter.');
        } finally {
            setRestoringId(null);
        }
    };

    const handleLetterCreate = async (data: any) => {
        await addNote({
            title: data.title || 'Untitled Letter',
            content: data.content,
            letterPages: data.letterPages,
            category: data.category || 'Other',
            isPublic: Boolean(data.isPublic),
            reactions: {},
            spotifyLink: data.spotifyLink,
            font: data.font,
            recipientName: data.recipientName,
            recipientAddress: data.recipientAddress,
            isAnonymous: data.isAnonymous,
            backgroundImage: data.backgroundImage,
            imageUrl: data.imageUrl,
            scheduledDate: data.scheduledDate,
            openDate: data.openDate,
            isTimeCapsule: data.isTimeCapsule,
            status: 'published',
        });
    };

    const handleNoteClick = (note: Note) => {
        setSkipReaderOpening(false);
        setSelectedNote(note);
        setIsViewModalOpen(true);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--accent))]"><CharacterBadge name={isCommunity ? "chika" : "basa"} tone="gold" size="xs" /> {isCommunity ? "Stories from the community" : "The letter collection"}</p>
                    <h2 className="font-editorial text-4xl tracking-tight text-foreground">{isCommunity ? 'Discover words that matter' : activeTab === 'personal' ? 'My letters' : activeTab === 'drafts' ? 'Saved drafts' : activeTab === 'archived' ? 'Archived letters' : 'Letters for later'}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{isCommunity ? 'Read published stories, find kindred voices, and share a little appreciation. Private writing stays in My library.' : activeTab === 'personal' ? 'Your finished letters, just as you wrote them.' : activeTab === 'drafts' ? 'Pick up where your thoughts left off.' : activeTab === 'archived' ? 'Letters you have set aside. Restore them whenever you are ready.' : 'Letters waiting for their special moment.'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border/70 bg-muted/60 p-1.5">
                    {(!isCommunity ? ([
                        { key: 'personal', label: 'My letters', mascot: 'basa' },
                        { key: 'drafts', label: 'Drafts', mascot: 'lumi' },
                        { key: 'scheduled', label: 'Scheduled', mascot: 'araw' },
                        { key: 'archived', label: 'Archived', mascot: 'susi' },
                    ] as const).map(({ key, label, mascot }) => (
                        <button type="button" key={key} onClick={() => { setActiveTab(key); setCategoryFilter('all'); }} aria-pressed={activeTab === key} className={clsx('inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors', activeTab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground')}>
                            <CharacterBadge name={mascot} tone="paper" size="xs" /> {label}
                        </button>
                    )) : <span className="px-3 py-2 text-xs font-semibold text-muted-foreground">Public letters only</span>)}
                </div>

                <Button onClick={() => { setStarterTemplate(''); setEditingNote(null); setIsEditorOpen(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-lg hover:shadow-xl transition-all">
                    <CharacterBadge name="lumi" tone="paper" size="sm" />
                    Write a Letter
                </Button>
            </div>

            {isCommunity && <section aria-label="Explore letter topics" className="rounded-[1.8rem] border border-border bg-[hsl(var(--surface-sage))]/45 p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <CharacterBadge name="basa" tone="paper" size="lg" />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[.15em] text-muted-foreground">Explore by feeling</p>
                            <h3 className="mt-1 font-editorial text-2xl">There is a story for everyone.</h3>
                        </div>
                    </div>
                    <p className="max-w-sm text-xs leading-6 text-muted-foreground">Choose a topic to discover public letters. Only categories represented in the current collection appear below.</p>
                </div>
                <div role="group" aria-label="Filter public letters by topic" className="mt-5 flex flex-wrap gap-2">
                    {['all', ...categories].map(topic => (
                        <button key={topic} type="button" onClick={() => setCategoryFilter(topic)} aria-pressed={categoryFilter === topic}
                            className={clsx('min-h-11 rounded-full border px-4 py-2.5 text-xs font-bold transition-colors', categoryFilter === topic ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted')}>
                            {topic === 'all' ? 'All stories' : topic}
                        </button>
                    ))}
                </div>
            </section>}

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-2 rounded-xl border border-border/50 shadow-sm">
                <div className="relative flex-1 w-full">
                    <CharacterBadge name="suri" tone="paper" size="xs" className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                        aria-label={isCommunity ? "Search public letters" : "Search your letters"}
                        placeholder={isCommunity ? "Search a story, feeling, or writer…" : "Search your letters…"} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-transparent border-none focus-visible:ring-0"
                    />
                </div>
                <label className="flex w-full items-center gap-2 text-xs font-semibold text-muted-foreground md:w-auto">
                    Category
                    <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="min-h-11 flex-1 rounded-xl border border-border bg-background px-3 text-foreground md:min-w-32">
                        <option value="all">All categories</option>
                        {categories.map(category => <option key={category} value={category}>{category}</option>)}
                    </select>
                </label>
                <label className="flex w-full items-center gap-2 text-xs font-semibold text-muted-foreground md:w-auto">
                    Sort
                    <select value={sortOrder} onChange={event => setSortOrder(event.target.value as 'newest' | 'oldest' | 'popular')} className="min-h-11 flex-1 rounded-xl border border-border bg-background px-3 text-foreground md:min-w-28">
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="popular">Most appreciated</option>
                    </select>
                </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p aria-live="polite" className="text-xs font-medium text-muted-foreground">Showing {filteredNotes.length} of {visibleNotes.length} {isCommunity ? 'public' : ''} letters</p>
                {(searchQuery || categoryFilter !== 'all' || sortOrder !== 'newest') && <button type="button" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setSortOrder('newest'); }} className="min-h-10 rounded-full border border-border bg-card px-4 text-xs font-bold text-primary hover:bg-muted">Clear filters</button>}
            </div>

            {isCommunity && publicError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <span>Community letters could not load: {publicError}</span>
                <button type="button" onClick={() => void fetchPublicLetters()} className="font-bold underline">Try again</button>
            </div>}
            {isCommunity && isLoadingPublic && publicLetters.length === 0 && <p role="status" className="text-sm text-muted-foreground">Loading community letters…</p>}
            {restoreError && <p role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{restoreError}</p>}

            {!isCommunity && activeTab === 'personal' && (
                <div role="group" aria-label="Library view mode" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-3">
                    <p className="px-2 text-xs text-muted-foreground">Choose how to browse your memories. Your normal library stays available.</p>
                    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1">
                        <button type="button" onClick={() => setLibraryView('grid')} aria-pressed={libraryView === 'grid'} className={clsx('inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold transition-colors', libraryView === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60')}><LayoutGrid size={16} /> Normal view</button>
                        <button type="button" onClick={() => setLibraryView('shelf')} aria-pressed={libraryView === 'shelf'} className={clsx('inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold transition-colors', libraryView === 'shelf' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60')}><BookOpenText size={16} /> 3D library</button>
                    </div>
                </div>
            )}

            {!isCommunity && activeTab === 'personal' && libraryView === 'shelf' && filteredNotes.length > 0 && (
                <MemoryShelf notes={filteredNotes} onOpen={setOpeningNote} />
            )}

            {/* Existing grid stays the default, including its edit/delete controls. */}
            {(isCommunity || activeTab !== 'personal' || libraryView === 'grid' || filteredNotes.length === 0) && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note) => !isCommunity && activeTab === 'scheduled' && note.isTimeCapsule ? (
                    <TimeCapsuleCard key={note.id} note={note}
                        onManage={capsule => { setStarterTemplate(''); setEditingNote(capsule); setIsEditorOpen(true); }}
                        onOpen={setOpeningNote} />
                ) : activeTab === 'archived' ? (
                    <article key={note.id} className="stl-depth-card flex min-h-[245px] flex-col rounded-[26px] border border-border bg-card p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Archived letter</span>
                        <h3 className="mt-5 line-clamp-2 font-editorial text-2xl">{note.title || 'Untitled letter'}</h3>
                        <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{note.content}</p>
                        <button type="button" disabled={restoringId !== null} onClick={() => void restoreLetter(String(note.id))}
                            className="mt-auto w-fit rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50">
                            {restoringId === String(note.id) ? 'Restoring…' : 'Restore to library'}
                        </button>
                    </article>
                ) : activeTab === 'drafts' || activeTab === 'scheduled' ? (
                    <button type="button" key={note.id} onClick={() => { setStarterTemplate(''); setEditingNote(note); setIsEditorOpen(true); }} className="stl-depth-card group flex h-[265px] flex-col rounded-[26px] border border-border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                        <span className="flex items-center justify-between text-xs font-bold uppercase tracking-[.14em] text-muted-foreground"><span className="inline-flex items-center gap-2"><CharacterBadge name={activeTab === 'drafts' ? 'lumi' : 'araw'} tone="paper" size="xs" />{activeTab === 'drafts' ? 'Unfinished thought' : 'Coming soon'}</span><span className="text-xs font-bold text-primary">Open</span></span>
                        <h3 className="mt-6 line-clamp-2 font-editorial text-2xl leading-tight">{note.title || 'Untitled letter'}</h3>
                        <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{note.content}</p>
                        <div className="mt-auto flex items-center justify-between border-t border-border/80 pt-4 text-xs font-semibold text-primary"><span>{activeTab === 'drafts' ? 'Continue writing' : 'Review scheduled letter'}</span><CharacterBadge name="lumi" tone="sage" size="xs" /></div>
                    </button>
                ) : <Notecard key={note.id} note={note} onClick={handleNoteClick} onAuthorClick={openWriterProfile} />)}

                {filteredNotes.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-3xl bg-muted/10">
                        <Mascot name={activeTab === 'personal' ? 'basa' : activeTab === 'scheduled' ? 'araw' : activeTab === 'drafts' ? 'lumi' : activeTab === 'archived' ? 'susi' : 'chika'} className="mb-3 h-28 w-28" />
                        <h3 className="text-xl font-semibold mb-2">{searchQuery || categoryFilter !== 'all' ? 'No matching letters' : 'No letters found'}</h3>
                        <p className="text-muted-foreground max-w-sm">
                            {searchQuery || categoryFilter !== 'all'
                                ? 'Try a different search term, choose another topic, or clear the filters.'
                                : activeTab === 'personal' ? 'No finished letters yet. Start by writing one.' : activeTab === 'drafts' ? 'No drafts yet. Save a letter draft and it will appear here.' : activeTab === 'scheduled' ? 'No scheduled letters. You can choose a future release date in the editor.' : activeTab === 'archived' ? 'Your archive is empty. Archived letters will appear here until you restore them.' : 'There are no public letters to display right now.'}
                        </p>
                        {searchQuery || categoryFilter !== 'all' ? (
                            <button type="button" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }} className="mt-5 min-h-11 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-primary hover:bg-muted">Show all letters</button>
                        ) : !isCommunity && activeTab === 'personal' ? (
                            <button type="button" onClick={() => { setStarterTemplate(''); setEditingNote(null); setIsEditorOpen(true); }} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">
                                <CharacterBadge name="lumi" tone="paper" size="xs" /> Write your first letter
                            </button>
                        ) : null}
                    </div>
                )}
            </div>}

            <LetterOpeningDialog note={openingNote} onClose={() => setOpeningNote(null)} onRead={note => { setOpeningNote(null); setSkipReaderOpening(true); setSelectedNote(note); setIsViewModalOpen(true); }} />

            <LetterEditorModal
                isOpen={isEditorOpen}
                onClose={() => { setIsEditorOpen(false); setGuestImportPending(false); }}
                onSubmit={handleLetterCreate}
                initialData={editingNote || undefined}
                starterTemplate={starterTemplate}
                onDraftSaved={async () => { await fetchDrafts(); if (guestImportPending) { clearGuestLetter(); setGuestImportPending(false); } }}
                onPublished={async (status, publicLetter) => { if (guestImportPending) { clearGuestLetter(); setGuestImportPending(false); } await reloadLetters(); if (isCommunity) { if (!publicLetter || status === 'scheduled') navigate('/dashboard/notes'); } else { setActiveTab(status === 'scheduled' ? 'scheduled' : 'personal'); } }}
            />

            <LetterViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                note={selectedNote}
                skipOpening={skipReaderOpening}
                onAuthorClick={openWriterProfile}
            />
        </div>
    );
};

export default Notes;
