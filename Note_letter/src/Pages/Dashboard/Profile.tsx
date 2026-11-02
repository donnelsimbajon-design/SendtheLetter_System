import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/authStore';
import { useNoteStore } from '../../store/noteStore';
import { ArrowRight, BookHeart, BookOpen, Camera, Clock3, FileText, Globe2, Heart, LockKeyhole, MapPin, PenLine, Search, Settings2, Sparkles, UserRound, Archive, Repeat2 } from 'lucide-react';
import LetterEditorModal from '../../components/LetterEditorModal';
import LetterViewModal from '../../components/LetterViewModal';
import EditProfileModal from '../../components/EditProfileModal';
import Notecard from '../../components/Notecard';
import type { Note } from '../../types/note';
import { getImageUrl } from '../../lib/utils';

type Tab = 'all' | 'public' | 'private' | 'drafts' | 'scheduled' | 'archived' | 'reposts' | 'about';
const sections: { id: Tab; title: string; icon: typeof FileText }[] = [
    { id: 'all', title: 'My letters', icon: BookOpen },
    { id: 'public', title: 'Public', icon: Globe2 },
    { id: 'private', title: 'Private', icon: LockKeyhole },
    { id: 'drafts', title: 'Drafts', icon: PenLine },
    { id: 'scheduled', title: 'Scheduled', icon: Clock3 },
    { id: 'archived', title: 'Archived', icon: Archive },
    { id: 'reposts', title: 'Reposts', icon: Repeat2 },
    { id: 'about', title: 'About me', icon: UserRound },
];

export default function Profile() {
    const user = useAuthStore(state => state.user);
    const { notes, drafts, archived, addNote, fetchMyLetters, fetchDrafts, fetchArchivedLetters, fetchPublicLetters } = useNoteStore();
    const [active, setActive] = useState<Tab>('all');
    const [query, setQuery] = useState('');
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [reposts, setReposts] = useState<Note[]>([]);
    const [scheduled, setScheduled] = useState<Note[]>([]);
    const [selected, setSelected] = useState<Note | null>(null);
    const [editing, setEditing] = useState<Note | null>(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editProfileOpen, setEditProfileOpen] = useState(false);

    const refresh = async () => {
        await Promise.all([fetchMyLetters(), fetchDrafts(), fetchArchivedLetters(), fetchPublicLetters()]);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const [stats, scheduledResponse, repostResponse] = await Promise.all([
                fetch(`${API_ENDPOINTS.users}/${user?.id}/profile`, { headers }),
                fetch(`${API_ENDPOINTS.letters}/scheduled`, { headers }),
                fetch(`${API_ENDPOINTS.letters}/reposts`, { headers }),
            ]);
            if (stats.ok) {
                const data = await stats.json();
                setFollowerCount(Number(data.followerCount) || 0);
                setFollowingCount(Number(data.followingCount) || 0);
            }
            if (scheduledResponse.ok) {
                const data = await scheduledResponse.json();
                setScheduled(Array.isArray(data) ? data : []);
            }
            if (repostResponse.ok) {
                const data = await repostResponse.json();
                setReposts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Could not refresh profile collection:', error);
        }
    };

    useEffect(() => { if (user?.id) void refresh(); }, [user?.id, fetchMyLetters, fetchDrafts, fetchArchivedLetters, fetchPublicLetters]);

    const ownedNotes = useMemo(() => notes.map(note => ({
        ...note,
        authorId: user?.id || note.authorId,
        authorName: user?.username || note.authorName,
        authorAvatar: user?.avatar || note.authorAvatar,
    })), [notes, user?.id, user?.username, user?.avatar]);

    const list = active === 'all' ? ownedNotes
        : active === 'public' ? ownedNotes.filter(n => n.isPublic)
        : active === 'private' ? ownedNotes.filter(n => !n.isPublic)
        : active === 'drafts' ? drafts
        : active === 'scheduled' ? scheduled
        : active === 'archived' ? archived
        : active === 'reposts' ? reposts : [];
    const filtered = list.filter(note => `${note.title} ${note.content}`.toLowerCase().includes(query.trim().toLowerCase()));

    const openComposer = (note?: Note) => {
        setEditing(note || null);
        setEditorOpen(true);
    };

    const createLetter = async (data: any) => {
        await addNote({
            title: data.title || 'Untitled letter',
            content: data.content,
            letterPages: data.letterPages,
            category: data.category || 'Other',
            type: data.type || data.category || 'Other',
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

    const publicCount = ownedNotes.filter(n => n.isPublic).length;
    const privateCount = ownedNotes.length - publicCount;
    const tabDescription: Record<Tab, string> = {
        all: 'Every finished letter you have written.',
        public: 'Your writing shared with the community.',
        private: 'Personal letters that stay just yours.',
        drafts: 'Your unfinished chapters, ready whenever you are.',
        scheduled: 'Letters waiting for the right moment.',
        archived: 'Your tucked-away memories. Nothing has been deleted.',
        reposts: 'Words from other writers you chose to share.',
        about: 'The writer behind the letters.',
    };

    return <div className="mx-auto max-w-7xl space-y-6 pb-14">
        <section className="relative overflow-hidden rounded-[30px] border border-border bg-card shadow-sm">
            <div className="relative h-36 overflow-hidden bg-gradient-to-r from-[#344a3c] via-[#586952] to-[#ad9b7b] sm:h-52">
                {user?.coverImage && <img src={getImageUrl(user.coverImage)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/35 to-transparent" />
                <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-2 text-xs font-bold uppercase tracking-[.16em] text-white backdrop-blur-md"><Sparkles size={15} /> The writer's corner</div>
                <button type="button" onClick={() => setEditProfileOpen(true)} className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/25 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm hover:bg-black/40"><Camera size={15} /> Edit cover</button>
            </div>
            <div className="relative flex flex-col gap-5 px-6 pb-7 pt-16 sm:flex-row sm:items-end sm:justify-between sm:px-9 sm:pt-12">
                <div className="absolute -top-10 left-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border-[5px] border-card bg-[hsl(var(--surface-gold))] text-3xl font-bold shadow-xl sm:-top-14 sm:left-9 sm:h-28 sm:w-28">
                    {user?.avatar ? <img src={getImageUrl(user.avatar)} alt="" className="h-full w-full object-cover" /> : user?.username?.[0]?.toUpperCase() || 'W'}
                </div>
                <div className="min-w-0 sm:pl-32">
                    <p className="mb-1 text-xs font-bold uppercase tracking-[.17em] text-[hsl(var(--accent))]">My personal space</p>
                    <h1 className="break-words font-editorial text-3xl sm:text-4xl">{user?.username || 'Writer'}</h1>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{user?.email}</p>
                    {user?.location && <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={13} />{user.location}</p>}
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{user?.bio || 'Every meaningful story begins with a few honest words. Add a short bio to introduce yourself.'}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" onClick={() => setEditProfileOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-xs font-bold hover:bg-muted"><PenLine size={15} /> Edit profile</button>
                    <Link to="/dashboard/settings" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-xs font-bold hover:bg-muted"><Settings2 size={15} /> Settings</Link>
                </div>
            </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
                { title: 'My letters', value: ownedNotes.length, icon: BookHeart },
                { title: 'Public', value: publicCount, icon: Globe2 },
                { title: 'Followers', value: followerCount, icon: Heart },
                { title: 'Following', value: followingCount, icon: UserRound },
            ].map(({ title, value, icon: Icon }) => <div key={title} className="flex items-center justify-between gap-2 rounded-[22px] border border-border bg-card p-4 shadow-sm sm:p-5"><div><p className="text-xs text-muted-foreground">{title}</p><p className="mt-2 font-editorial text-3xl font-semibold">{value}</p></div><span className="rounded-2xl bg-[hsl(var(--surface-gold))] p-3 text-[#5b4932]"><Icon size={19} /></span></div>)}
        </section>

        <section className="rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
                <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[hsl(var(--accent))]">Your private library</p><h2 className="mt-1 font-editorial text-3xl">My collection</h2></div>
                <button type="button" onClick={() => openComposer()} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground hover:opacity-90"><PenLine size={16} /> Write a letter <ArrowRight size={15} /></button>
            </div>
            <nav aria-label="My letter sections" className="mt-5 flex flex-wrap gap-1.5">
                {sections.map(({ id, title, icon: Icon }) => <button key={id} type="button" aria-current={active === id ? 'page' : undefined} onClick={() => { setActive(id); setQuery(''); }} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-xs font-semibold transition-colors ${active === id ? 'bg-primary text-primary-foreground' : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon size={15} /> {title}</button>)}
            </nav>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="font-editorial text-xl">{sections.find(s => s.id === active)?.title}</h3><p className="mt-1 text-xs text-muted-foreground">{tabDescription[active]}</p></div>
                {active !== 'about' && <label className="relative block w-full max-w-[260px]"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a letter…" className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary" /></label>}
            </div>

            {active === 'about' ? <div className="mt-6 rounded-[22px] bg-background px-6 py-9"><Sparkles size={23} className="text-[hsl(var(--accent))]" /><h4 className="mt-4 font-editorial text-2xl">A little about me</h4><p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{user?.bio || 'Your story is yours to tell. Click Edit profile to add a bio.'}</p><button type="button" onClick={() => setEditProfileOpen(true)} className="mt-5 rounded-full border border-border px-5 py-2.5 text-xs font-bold hover:bg-muted">Edit my story</button></div> : filtered.length ? (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map(note => (active === 'drafts' || active === 'scheduled' ?
                        <button type="button" key={note.id} onClick={() => openComposer(note)} className="group flex h-[270px] flex-col rounded-[25px] border border-border bg-background p-6 text-left transition-all hover:-translate-y-1 hover:shadow-lg">
                            <span className="inline-flex items-center justify-between text-xs font-bold uppercase tracking-[.13em] text-muted-foreground">{active === 'drafts' ? 'Saved draft' : 'Scheduled letter'}<PenLine size={17} /></span>
                            <h4 className="mt-6 line-clamp-2 font-editorial text-2xl">{note.title || 'Untitled letter'}</h4><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{note.content}</p>
                            <span className="mt-auto inline-flex items-center gap-2 border-t border-border pt-4 text-xs font-bold text-primary">{active === 'drafts' ? 'Continue writing' : 'Review letter'} <ArrowRight size={15} /></span>
                        </button> :
                        <Notecard key={note.id} note={note.authorId ? note : { ...note, authorId: user?.id || 0, authorName: user?.username }} onClick={item => { setSelected(item); setViewOpen(true); }} />
                    ))}
                </div>
            ) : <div className="mt-7 flex flex-col items-center rounded-[24px] border border-dashed border-border bg-background/60 px-5 py-14 text-center"><BookHeart size={37} className="text-[hsl(var(--accent))]" /><h4 className="mt-4 font-editorial text-2xl">{query ? 'No matching letters' : 'A quiet shelf for now'}</h4><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{query ? 'Try another search term.' : active === 'public' ? 'Your public letters will appear here. You can discover everyone else’s letters in the Community section.' : active === 'private' ? `You have ${privateCount} private letters. Begin a new private story whenever you like.` : 'Your letters will show here when you save, publish or archive them.'}</p><button type="button" onClick={() => openComposer()} className="mt-5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">Start writing</button></div>}
            {active === 'public' && <Link to="/dashboard/community" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline">Explore Community letters <ArrowRight size={15} /></Link>}
        </section>

        <EditProfileModal isOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)} />
        <LetterEditorModal
            isOpen={editorOpen}
            onClose={() => { setEditorOpen(false); setEditing(null); }}
            initialData={editing || undefined}
            onSubmit={createLetter}
            onDraftSaved={fetchDrafts}
            onPublished={async (status, publicLetter) => { await refresh(); setActive(status === 'scheduled' ? 'scheduled' : publicLetter ? 'public' : 'private'); }}
        />
        <LetterViewModal isOpen={viewOpen} onClose={() => setViewOpen(false)} note={selected} onEdit={note => { setViewOpen(false); openComposer(note); }} />
    </div>;
}
