import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/authStore';
import WriterProfileScreen, { type WriterFeedNote, type WriterPublicProfile } from '../../components/WriterProfileScreen';
import LetterViewModal from '../../components/LetterViewModal';
import type { Note } from '../../types/note';

type FriendState = 'none' | 'sent' | 'received' | 'friends';
type FriendStatus = { status: FriendState; requestId: number | null };
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

export default function UserProfilePage() {
    const { username = '' } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const currentUser = useAuthStore(state => state.user);
    const [profile, setProfile] = useState<WriterPublicProfile | null>(null);
    const [posts, setPosts] = useState<Note[]>([]);
    const [reposts, setReposts] = useState<WriterFeedNote[]>([]);
    const [selected, setSelected] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [actionBusy, setActionBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [blockState, setBlockState] = useState<{ blocked: boolean; canInteract: boolean } | null>(null);
    const [friendState, setFriendState] = useState<FriendStatus>({ status: 'none', requestId: null });
    const [reload, setReload] = useState(0);

    useEffect(() => {
        if (!username) return;
        let active = true;
        setLoading(true);
        setError('');
        setProfile(null);
        setPosts([]);
        setReposts([]);
        setSelected(null);
        setActionError('');
        const load = async () => {
            const token = localStorage.getItem('token');
            const headers = token ? authHeader() : {};
            const name = encodeURIComponent(username);
            try {
                const profileRes = await fetch(`${API_ENDPOINTS.users}/profile/${name}`, { headers });
                if (profileRes.status === 404) throw new Error('This writer profile was not found.');
                if (!profileRes.ok) throw new Error('This profile is temporarily unavailable. Please try again.');
                const profileInfo = await profileRes.json();
                if (!active) return;
                setProfile(profileInfo);
                // A failure in the repost/feed endpoints must not hide a valid writer profile.
                const [letterResult, repostResult] = await Promise.allSettled([
                    fetch(`${API_ENDPOINTS.letters}/user/${name}`, { headers }),
                    fetch(`${API_ENDPOINTS.letters}/user/${name}/reposts`, { headers }),
                ]);
                const readList = async (result: PromiseSettledResult<Response>): Promise<Note[]> => {
                    if (result.status !== 'fulfilled' || !result.value.ok) return [];
                    const data = await result.value.json().catch(() => []);
                    return Array.isArray(data) ? data : [];
                };
                const [publicPosts, sharedPosts] = await Promise.all([readList(letterResult), readList(repostResult)]);
                if (!active) return;
                setPosts(publicPosts);
                setReposts(sharedPosts as WriterFeedNote[]);
                if (letterResult.status !== 'fulfilled' || !letterResult.value.ok ||
                    repostResult.status !== 'fulfilled' || !repostResult.value.ok) {
                    setError('Some published letters or reposts could not load. You can still view this writer’s profile.');
                }
            } catch (err: any) {
                if (active) setError(err?.message || 'This profile is not available.');
            } finally {
                if (active) setLoading(false);
            }
        };
        void load();
        return () => { active = false; };
    }, [username, reload]);

    useEffect(() => {
        if (!profile?.id || !currentUser?.id || Number(profile.id) === Number(currentUser.id)) {
            setFriendState({ status: 'none', requestId: null });
            return;
        }
        let active = true;
        const fetchStatus = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/friends/status/${profile.id}`, { headers: authHeader() });
                if (!response.ok) return;
                const data = await response.json();
                if (!active) return;
                setFriendState({
                    status: data.status === 'friends' ? 'friends' : data.status === 'pending' ? (data.isSender ? 'sent' : 'received') : 'none',
                    requestId: Number(data.requestId) || null,
                });
            } catch {
                if (active) setActionError('Pen pal connection status is temporarily unavailable.');
            }
        };
        void fetchStatus();
        return () => { active = false; };
    }, [profile?.id, currentUser?.id]);

    useEffect(() => {
        if (!profile?.id || !currentUser?.id || Number(profile.id) === Number(currentUser.id)) {
            setBlockState(null);
            return;
        }
        let active = true;
        setBlockState({ blocked: false, canInteract: false });
        (async () => {
            try {
                const response = await fetch(`${API_ENDPOINTS.users}/${profile.id}/block-status`, { headers: authHeader() });
                if (!response.ok) throw new Error('Could not check connection permissions.');
                const data = await response.json();
                if (active) setBlockState({ blocked: data.blocked === true, canInteract: data.canInteract === true });
            } catch {
                if (active) setActionError('Connection permissions are temporarily unavailable.');
            }
        })();
        return () => { active = false; };
    }, [profile?.id, currentUser?.id]);

    const toggleBlock = async () => {
        if (!profile || !currentUser || !blockState || blockBusy) return;
        if (!blockState.blocked && !window.confirm('Block this writer? Existing Follow and Pen Pal connections will be removed.')) return;
        setBlockBusy(true);
        setActionError('');
        try {
            const response = await fetch(`${API_ENDPOINTS.users}/${profile.id}/block`, {
                method: blockState.blocked ? 'DELETE' : 'POST', headers: authHeader(),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || 'Could not update block status.');
            setBlockState({ blocked: result.blocked === true, canInteract: result.canInteract === true });
            if (result.blocked) {
                setFriendState({ status: 'none', requestId: null });
                setProfile(previous => previous ? {
                    ...previous, isFollowing: false,
                    followerCount: Math.max(0, (previous.followerCount || 0) - (previous.isFollowing ? 1 : 0)),
                } : null);
            }
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Could not update block status.');
        } finally {
            setBlockBusy(false);
        }
    };

    const toggleFollow = async () => {
        if (!profile || actionBusy) return;
        setActionBusy(true);
        setActionError('');
        try {
            const response = await fetch(`${API_ENDPOINTS.users}/${profile.id}/toggle`, { method: 'POST', headers: authHeader() });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || 'Could not update your follow.');
            setProfile(previous => previous ? {
                ...previous,
                isFollowing: Boolean(result.isFollowing),
                followerCount: Math.max(0, (previous.followerCount || 0) + (result.isFollowing ? 1 : -1))
            } : null);
        } catch (err: any) {
            setActionError(err?.message || 'Could not follow this writer.');
        } finally { setActionBusy(false); }
    };

    const changeFriend = async () => {
        if (!profile || !currentUser || actionBusy || friendState.status === 'friends') return;
        setActionBusy(true);
        setActionError('');
        try {
            const operation = friendState.status === 'none' ? 'request' : friendState.status === 'sent' ? 'cancel' : 'accept';
            const body = operation === 'request' ? { recipientId: profile.id } : { requestId: friendState.requestId };
            const response = await fetch(`${API_BASE_URL}/api/friends/${operation}`, {
                method: 'POST', headers: { ...authHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || 'Could not update your pen pal request.');
            setFriendState({
                status: operation === 'request' ? 'sent' : operation === 'cancel' ? 'none' : 'friends',
                requestId: operation === 'request' ? Number(result.id) || null : null,
            });
        } catch (err: any) {
            setActionError(err?.message || 'Could not complete this action.');
        } finally { setActionBusy(false); }
    };

    const declineRequest = async () => {
        if (!friendState.requestId || actionBusy) return;
        setActionBusy(true);
        setActionError('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/friends/decline`, {
                method: 'POST',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: friendState.requestId })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || 'Could not decline this request.');
            setFriendState({ status: 'none', requestId: null });
        } catch (err: any) {
            setActionError(err?.message || 'Could not decline this pen pal request.');
        } finally { setActionBusy(false); }
    };

    const isSelf = !!currentUser && Number(currentUser.id) === Number(profile?.id);
    const friendLabel: Record<FriendState, string> = {
        none: 'Add pen pal',
        sent: 'Cancel request',
        received: 'Accept request',
        friends: 'Pen pals ✓'
    };

    if (loading && !profile) return <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 rounded-[30px] border border-border bg-card"><div className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" /><p className="text-sm text-muted-foreground">Opening this writer's profile…</p></div>;

    if (!profile) return <div className="mx-auto max-w-xl rounded-[30px] border border-border bg-card p-8 text-center shadow-sm sm:p-12">
        <LockKeyhole size={36} className="mx-auto text-muted-foreground" /><h1 className="mt-5 font-editorial text-3xl">Profile unavailable</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{error || 'This writer could not be found.'}</p>
        <div className="mt-6 flex justify-center gap-3"><button onClick={() => setReload(n => n + 1)} className="rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground">Retry</button><Link to="/dashboard/community" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-xs font-bold"><ArrowLeft size={15} /> Community</Link></div>
    </div>;

    return <>
        {isSelf && <div className="mx-auto mb-4 flex max-w-[1190px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-3 text-xs"><span className="text-muted-foreground">This is how visitors see your public profile. Your private letters are hidden.</span><Link to="/dashboard/profile" className="font-bold text-primary underline underline-offset-4">Manage my profile</Link></div>}
        <WriterProfileScreen
            profile={profile}
            letters={posts}
            reposts={reposts}
            loading={loading}
            error={error}
            onRetry={() => setReload(n => n + 1)}
            onRefresh={() => setReload(n => n + 1)}
            onOpenLetter={setSelected}
            onFollow={isSelf ? undefined : () => void toggleFollow()}
            followBusy={actionBusy}
            blockAction={!isSelf && currentUser && blockState ? { ...blockState, busy: blockBusy, onClick: () => void toggleBlock() } : undefined}
            onMessage={isSelf ? undefined : () => navigate(`/dashboard/messages?userId=${profile.id}`)}
            friendAction={isSelf ? undefined : {
                label: friendLabel[friendState.status],
                onClick: friendState.status === 'friends' ? undefined : () => void changeFriend(),
                disabled: actionBusy || friendState.status === 'friends',
                secondaryLabel: friendState.status === 'received' ? 'Decline' : undefined,
                secondaryClick: friendState.status === 'received' ? () => void declineRequest() : undefined,
            }}
            actionError={actionError}
            onDismissActionError={() => setActionError('')}
        />
        <LetterViewModal isOpen={!!selected} onClose={() => setSelected(null)} note={selected} onAuthorClick={(name) => navigate(`/writers/${encodeURIComponent(name)}`)} />
    </>;
}
