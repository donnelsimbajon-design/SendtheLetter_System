import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNoteStore } from '../../store/noteStore';
import { User as UserIcon, MapPin, Link as LinkIcon, Calendar, Camera, PenLine, Search, FileText, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import LetterEditorModal from '../../components/LetterEditorModal';
import LetterViewModal from '../../components/LetterViewModal';
import Notecard from '../../components/Notecard';
import { Note } from '../../types/note';

const Profile = () => {
    const user = useAuthStore((state) => state.user);
    const { notes, addNote } = useNoteStore();
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // View Modal State
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const tabs = ['Letters', 'About', 'Pen Pals', 'Saved', 'Drafts'];

    const userNotes = notes.filter((note) => note.authorId === user?.id);

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
        <div className="max-w-5xl mx-auto -mt-6">
            {/* Cover Photo Section */}
            <div className="bg-card rounded-b-xl shadow-sm border-x border-b border-border/50">
                <div className="h-[300px] w-full bg-gradient-to-r from-primary/20 to-secondary/20 relative rounded-b-xl group cursor-pointer overflow-hidden">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                    <button className="absolute bottom-4 right-8 bg-background/80 hover:bg-background text-foreground px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                        <Camera size={16} />
                        Change Cover
                    </button>
                </div>

                <div className="px-8 pb-4">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 mb-6 relative z-10">
                        <div className="relative">
                            <div className="w-32 h-32 md:w-40 md:h-40 bg-muted rounded-full border-[4px] border-background flex items-center justify-center text-muted-foreground overflow-hidden relative group cursor-pointer shadow-md">
                                <UserIcon size={64} strokeWidth={1} />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 mb-2">
                            <h1 className="text-3xl font-serif font-bold text-foreground">{user?.name || 'Guest User'}</h1>
                            <p className="text-muted-foreground font-light">Writing from <span className="text-foreground font-medium">San Francisco</span></p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><FileText size={14} /> {userNotes.length} Letters</span>
                                <span className="flex items-center gap-1"><UserIcon size={14} /> 1.2k Pen Pals</span>
                            </div>
                        </div>

                        <div className="flex gap-3 mb-4 md:mb-2 w-full md:w-auto">
                            <Button onClick={() => setIsEditorOpen(true)} className="flex-1 md:flex-none gap-2 rounded-full px-6">
                                <PenLine size={16} />
                                Write Letter
                            </Button>
                            <Button variant="outline" className="flex-1 md:flex-none gap-2 rounded-full">
                                Edit Profile
                            </Button>
                        </div>
                    </div>

                    <div className="border-t border-border/50 pt-1">
                        <nav className="flex items-center gap-6 overflow-x-auto pb-2 md:pb-0">
                            {tabs.map((tab, i) => (
                                <button
                                    key={tab}
                                    className={`py-3 font-medium text-sm transition-colors whitespace-nowrap border-b-2 ${i === 0 ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 px-4 md:px-0">
                {/* Left Column: Intro */}
                <div className="space-y-6">
                    <Card className="p-6 space-y-4 shadow-sm border-border/50">
                        <h2 className="text-lg font-serif font-bold">About</h2>
                        <div className="space-y-4 text-sm font-light">
                            <p className="text-muted-foreground leading-relaxed">
                                "I write to discover what I know." <br />
                                Lover of vintage stationery and meaningful conversations.
                            </p>
                            <div className="pt-4 space-y-3 border-t border-border/50">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <MapPin size={18} />
                                    <span>Lives in <strong className="text-foreground font-medium">San Francisco, CA</strong></span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Calendar size={18} />
                                    <span>Joined March 2024</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <LinkIcon size={18} />
                                    <a href="#" className="text-primary hover:underline">senttheletter.com</a>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 shadow-sm border-border/50">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-serif font-bold">Pen Pals</h2>
                            <a href="#" className="text-primary text-xs hover:underline uppercase tracking-wider">See all</a>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="space-y-2 text-center">
                                    <div className="aspect-square bg-muted rounded-full flex items-center justify-center text-muted-foreground/30 mx-auto w-full max-w-[60px]">
                                        <UserIcon size={24} />
                                    </div>
                                    <p className="text-xs font-medium truncate">Writer {i}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Letters Feed */}
                <div className="md:col-span-2 space-y-6">
                    {/* Create Letter */}
                    <Card className="p-4 shadow-sm border-border/50">
                        <div className="flex gap-4 mb-4">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                                <UserIcon size={20} />
                            </div>
                            <Input
                                className="bg-muted/30 border-transparent rounded-full hover:bg-muted/50 transition-colors cursor-pointer h-10"
                                placeholder={`Write a letter to the world...`}
                                onClick={() => setIsEditorOpen(true)}
                            />
                        </div>
                        <div className="border-t border-border/50 pt-3 flex justify-between px-2">
                            <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground text-xs uppercase tracking-wide">
                                <PenLine size={16} />
                                Draft
                            </Button>
                            <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground text-xs uppercase tracking-wide">
                                <Mail size={16} />
                                Public Letter
                            </Button>
                        </div>
                    </Card>

                    {/* Letters Filter */}
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-serif font-bold text-lg">Recent Letters</h3>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                            <Search size={16} />
                            <span className="text-xs uppercase tracking-wider">Search</span>
                        </Button>
                    </div>

                    {/* User Letters */}
                    <div className="space-y-6">
                        {userNotes.length > 0 ? (
                            userNotes.map((note) => (
                                <Notecard key={note.id} note={note} onClick={handleNoteClick} />
                            ))
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                                <p className="text-muted-foreground">You haven't written any letters yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
