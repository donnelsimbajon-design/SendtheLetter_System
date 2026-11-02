import { useEffect, useState } from 'react';
import { useNoteStore } from '../../store/noteStore';
import Notecard from '../../components/Notecard';
import { ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import LetterEditorModal from '../../components/LetterEditorModal';
import LetterViewModal from '../../components/LetterViewModal';
import { Note } from '../../types/note';
import clsx from 'clsx';
import Mascot from '../../components/Mascot';
import CharacterBadge from '../../components/CharacterBadge';
import { API_ENDPOINTS } from '../../config/api';

const Notes = ({ initialTab = 'personal' }: { initialTab?: 'personal' | 'public' }) => {
    const { notes, drafts, archived, publicLetters, addNote, fetchMyLetters, fetchPublicLetters, fetchDrafts, fetchArchivedLetters, restoreArchivedNote } = useNoteStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'public' | 'personal' | 'drafts' | 'scheduled' | 'archived'>(initialTab);
    useEffect(() => { setActiveTab(initialTab); }, [initialTab]);
    const [scheduledNotes, setScheduledNotes] = useState<Note[]>([]);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [restoreError, setRestoreError] = useState('');
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

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
        void Promise.all([fetchMyLetters(), fetchPublicLetters(), fetchDrafts(), fetchArchivedLetters(), fetchScheduledNotes()]);
    }, [fetchMyLetters, fetchPublicLetters, fetchDrafts, fetchArchivedLetters]);

    const visibleNotes = activeTab === 'public' ? publicLetters : activeTab === 'personal' ? notes : activeTab === 'drafts' ? drafts : activeTab === 'archived' ? archived : scheduledNotes;
    const filteredNotes = visibleNotes.filter((note) =>
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        setSelectedNote(note);
        setIsViewModalOpen(true);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--accent))]"><CharacterBadge name="basa" tone="gold" size="xs" /> The letter collection</p>
                    <h2 className="font-editorial text-4xl tracking-tight text-foreground">{activeTab === 'public' ? 'Community letters' : activeTab === 'personal' ? 'My letters' : activeTab === 'drafts' ? 'Saved drafts' : activeTab === 'archived' ? 'Archived letters' : 'Letters for later'}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{activeTab === 'public' ? 'Discover words worth sharing.' : activeTab === 'personal' ? 'Your finished letters, just as you wrote them.' : activeTab === 'drafts' ? 'Pick up where your thoughts left off.' : activeTab === 'archived' ? 'Letters you have set aside. Restore them whenever you are ready.' : 'Letters waiting for their special moment.'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border/70 bg-muted/60 p-1.5">
                    {([
                        { key: 'public', label: 'Community', mascot: 'chika' },
                        { key: 'personal', label: 'My letters', mascot: 'basa' },
                        { key: 'drafts', label: 'Drafts', mascot: 'lumi' },
                        { key: 'scheduled', label: 'Scheduled', mascot: 'araw' },
                        { key: 'archived', label: 'Archived', mascot: 'susi' },
                    ] as const).map(({ key, label, mascot }) => (
                        <button type="button" key={key} onClick={() => setActiveTab(key)} className={clsx('inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors', activeTab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground')}>
                            <CharacterBadge name={mascot} tone="paper" size="xs" /> {label}
                        </button>
                    ))}
                </div>

                <Button onClick={() => { setEditingNote(null); setIsEditorOpen(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-lg hover:shadow-xl transition-all">
                    <CharacterBadge name="lumi" tone="paper" size="sm" />
                    Write a Letter
                </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-2 rounded-xl border border-border/50 shadow-sm">
                <div className="relative flex-1 w-full">
                    <CharacterBadge name="suri" tone="paper" size="xs" className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                        placeholder="Search letters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-transparent border-none focus-visible:ring-0"
                    />
                </div>

            </div>

            {restoreError && <p role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{restoreError}</p>}

            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note) => activeTab === 'archived' ? (
                    <article key={note.id} className="flex min-h-[245px] flex-col rounded-[26px] border border-border bg-card p-6 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Archived letter</span>
                        <h3 className="mt-5 line-clamp-2 font-editorial text-2xl">{note.title || 'Untitled letter'}</h3>
                        <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{note.content}</p>
                        <button type="button" disabled={restoringId !== null} onClick={() => void restoreLetter(String(note.id))}
                            className="mt-auto w-fit rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50">
                            {restoringId === String(note.id) ? 'Restoring…' : 'Restore to library'}
                        </button>
                    </article>
                ) : activeTab === 'drafts' || activeTab === 'scheduled' ? (
                    <button type="button" key={note.id} onClick={() => { setEditingNote(note); setIsEditorOpen(true); }} className="group flex h-[265px] flex-col rounded-[26px] border border-border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                        <span className="flex items-center justify-between text-xs font-bold uppercase tracking-[.14em] text-muted-foreground"><span className="inline-flex items-center gap-2"><CharacterBadge name={activeTab === 'drafts' ? 'lumi' : 'araw'} tone="paper" size="xs" />{activeTab === 'drafts' ? 'Unfinished thought' : 'Coming soon'}</span><ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
                        <h3 className="mt-6 line-clamp-2 font-editorial text-2xl leading-tight">{note.title || 'Untitled letter'}</h3>
                        <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{note.content}</p>
                        <div className="mt-auto flex items-center justify-between border-t border-border/80 pt-4 text-xs font-semibold text-primary"><span>{activeTab === 'drafts' ? 'Continue writing' : 'Review scheduled letter'}</span><CharacterBadge name="lumi" tone="sage" size="xs" /></div>
                    </button>
                ) : <Notecard key={note.id} note={note} onClick={handleNoteClick} />)}

                {filteredNotes.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-3xl bg-muted/10">
                        <Mascot name={activeTab === 'personal' ? 'basa' : activeTab === 'scheduled' ? 'araw' : activeTab === 'drafts' ? 'lumi' : activeTab === 'archived' ? 'susi' : 'chika'} className="mb-3 h-28 w-28" />
                        <h3 className="text-xl font-semibold mb-2">{searchQuery ? 'No matching letters' : 'No letters found'}</h3>
                        <p className="text-muted-foreground max-w-sm">
                            {searchQuery
                                ? 'Try a different search term.'
                                : activeTab === 'personal' ? 'No finished letters yet. Start by writing one.' : activeTab === 'drafts' ? 'No drafts yet. Save a letter draft and it will appear here.' : activeTab === 'scheduled' ? 'No scheduled letters. You can choose a future release date in the editor.' : activeTab === 'archived' ? 'Your archive is empty. Archived letters will appear here until you restore them.' : 'There are no public letters to display right now.'}
                        </p>
                    </div>
                )}
            </div>

            <LetterEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSubmit={handleLetterCreate}
                initialData={editingNote || undefined}
                onDraftSaved={fetchDrafts}
                onPublished={async (status, publicLetter) => { await reloadLetters(); setActiveTab(status === 'scheduled' ? 'scheduled' : publicLetter ? 'public' : 'personal'); }}
            />

            <LetterViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                note={selectedNote}
            />
        </div>
    );
};

export default Notes;
