import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/authStore';
import { useNoteStore } from '../../store/noteStore';
import WriterProfileScreen, { type WriterFeedNote, type WriterPublicProfile } from '../../components/WriterProfileScreen';
import LetterEditorModal from '../../components/LetterEditorModal';
import LetterViewModal from '../../components/LetterViewModal';
import EditProfileModal from '../../components/EditProfileModal';
import type { Note } from '../../types/note';

export default function Profile() {
    const user = useAuthStore(state => state.user);
    const addNote = useNoteStore(state => state.addNote);
    const fetchMyLetters = useNoteStore(state => state.fetchMyLetters);
    const fetchDrafts = useNoteStore(state => state.fetchDrafts);
    const fetchPublicLetters = useNoteStore(state => state.fetchPublicLetters);
    const [profileData, setProfileData] = useState<WriterPublicProfile | null>(null);
    const [posts, setPosts] = useState<Note[]>([]);
    const [reposts, setReposts] = useState<WriterFeedNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingLetter, setEditingLetter] = useState<Note | null>(null);
    const [reading, setReading] = useState<Note | null>(null);

    const load = useCallback(async () => {
        if (!user?.username) return;
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const username = encodeURIComponent(user.username);
        try {
            const [profileResponse, lettersResponse, repostResponse] = await Promise.all([
                fetch(`${API_ENDPOINTS.users}/profile/${username}`, { headers }),
                fetch(`${API_ENDPOINTS.letters}/user/${username}`, { headers }),
                fetch(`${API_ENDPOINTS.letters}/user/${username}/reposts`, { headers }),
            ]);
            if (!profileResponse.ok || !lettersResponse.ok || !repostResponse.ok) throw new Error('Could not refresh your public writer profile.');
            const [fetchedProfile, fetchedPosts, fetchedReposts] = await Promise.all([
                profileResponse.json(), lettersResponse.json(), repostResponse.json()
            ]);
            setProfileData(fetchedProfile);
            setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []);
            setReposts(Array.isArray(fetchedReposts) ? fetchedReposts : []);
        } catch (err: any) {
            setError(err?.message || 'Your public feed could not be loaded. Your private library is still safe.');
        } finally {
            setLoading(false);
        }
    }, [user?.username]);

    useEffect(() => { void load(); }, [load]);

    // Render current account details immediately; refresh public stats from the API.
    const profile = useMemo<WriterPublicProfile | null>(() => user ? ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        coverImage: user.coverImage,
        bio: user.bio,
        location: user.location,
        createdAt: profileData?.id === user.id ? profileData.createdAt : undefined,
        followerCount: profileData?.id === user.id ? profileData.followerCount || 0 : 0,
        followingCount: profileData?.id === user.id ? profileData.followingCount || 0 : 0,
        isFollowing: false
    }) : null, [user, profileData]);

    const openWriter = (note?: Note) => {
        setEditingLetter(note || null);
        setEditorOpen(true);
    };

    const submit = async (data: any) => {
        await addNote({
            title: data.title || 'Untitled letter',
            content: data.content,
            letterPages: data.letterPages,
            type: data.type || data.category || 'Other',
            category: data.category || 'Other',
            isPublic: Boolean(data.isPublic),
            reactions: {},
            spotifyLink: data.spotifyLink,
            font: data.font,
            recipientName: data.recipientName,
            recipientAddress: data.recipientAddress,
            isAnonymous: Boolean(data.isAnonymous),
            backgroundImage: data.backgroundImage,
            imageUrl: data.imageUrl,
            scheduledDate: data.scheduledDate,
            openDate: data.openDate,
            isTimeCapsule: data.isTimeCapsule,
            status: 'published',
        });
    };

    if (!profile) return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">Sign in to open your writer profile.</div>;

    return <>
        <WriterProfileScreen
            profile={profile}
            ownProfile
            letters={posts}
            reposts={reposts}
            loading={loading}
            error={error}
            onRetry={() => void load()}
            onRefresh={() => void load()}
            onOpenLetter={note => setReading(note)}
            onEditProfile={() => setEditProfileOpen(true)}
            onWriteLetter={() => openWriter()}
        />
        <EditProfileModal isOpen={editProfileOpen} onClose={() => { setEditProfileOpen(false); void load(); }} />
        <LetterEditorModal
            isOpen={editorOpen}
            initialData={editingLetter || undefined}
            onClose={() => { setEditorOpen(false); setEditingLetter(null); }}
            onSubmit={submit}
            onDraftSaved={fetchDrafts}
            onPublished={async () => { await Promise.all([load(), fetchMyLetters(), fetchPublicLetters()]); }}
        />
        <LetterViewModal
            isOpen={!!reading}
            note={reading}
            onClose={() => setReading(null)}
            onEdit={note => { setReading(null); openWriter(note); }}
        />
    </>;
}
