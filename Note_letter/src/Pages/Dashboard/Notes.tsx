import { useState } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useAuthStore } from '../../store/authStore';
import Notecard from '../../components/Notecard';
import { Search, Filter, PenLine, Lock, Globe } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import LetterEditorModal from '../../components/LetterEditorModal';
import LetterViewModal from '../../components/LetterViewModal';
import { Note } from '../../types/note';
import clsx from 'clsx';

const Notes = () => {
    const { notes, addNote } = useNoteStore();
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'public' | 'personal'>('public');
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // View Modal State
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const filteredNotes = notes.filter((note) => {
        const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'public' ? note.isPublic : note.authorId === user?.id;
        return matchesSearch && matchesTab;
    });

    const handleLetterCreate = (data: any) => {
        addNote({
            id: crypto.randomUUID(),
            title: data.subject || 'Untitled Letter',
            content: data.content,
            category: data.category || 'Other',
            isPublic: true,
            authorId: user?.id || 'anonymous',
            createdAt: new Date(),
            reactions: {},
            spotifyLink: data.spotifyLink,
            font: data.font,
            recipientName: data.recipientName,
            recipientAddress: data.recipientAddress,
            isAnonymous: data.isAnonymous,
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
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        {activeTab === 'personal' ? 'My Letters' : 'Community Letters'}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        {activeTab === 'personal'
                            ? 'Manage your personal correspondence.'
                            : 'Read letters shared by the community.'}
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-muted/50 p-1.5 rounded-xl border border-border/50">
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            activeTab === 'personal'
                                ? "bg-background shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <Lock size={16} />
                        <span>Private</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('public')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            activeTab === 'public'
                                ? "bg-background shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <Globe size={16} />
                        <span>Public</span>
                    </button>
                </div>

                <Button onClick={() => setIsEditorOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-lg hover:shadow-xl transition-all">
                    <PenLine size={18} />
                    Write a Letter
                </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-2 rounded-xl border border-border/50 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                        placeholder="Search letters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-transparent border-none focus-visible:ring-0"
                    />
                </div>
                <Button variant="outline" size="icon" className="shrink-0">
                    <Filter size={18} />
                </Button>
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note) => (
                    <Notecard key={note.id} note={note} onClick={handleNoteClick} />
                ))}

                {filteredNotes.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-3xl bg-muted/10">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                            {activeTab === 'personal' ? <Lock size={32} /> : <Globe size={32} />}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No letters found</h3>
                        <p className="text-muted-foreground max-w-sm">
                            {activeTab === 'personal'
                                ? "You haven't written any letters yet. Click 'Write a Letter' to start!"
                                : "There are no public letters to display right now."}
                        </p>
                    </div>
                )}
            </div>

            <LetterEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSubmit={handleLetterCreate}
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
