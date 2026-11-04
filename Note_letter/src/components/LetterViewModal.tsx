import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
// VisuallyHidden removed
import CharacterBadge from './CharacterBadge';
import CommentsPanel from './CommentsPanel';
import LetterBookReader from './LetterBookReader';
import SpotifyReadingPlayer from './SpotifyReadingPlayer';
import { parseSpotifyMedia } from '../lib/spotify';
import { parseLetterMusicLink } from '../lib/letterMusicLink';
import { Note } from '../types/note';
import { cn, getImageUrl } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useNoteStore } from '../store/noteStore';
import { formatDistanceToNow } from 'date-fns';
import socketService from '../services/socketService';
import ShareModal from './ShareModal';
import { API_ENDPOINTS } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenText, Heart, MailOpen, MessageCircle, Pencil, Repeat2, Share2 } from 'lucide-react';
import LetterOpeningEnvelope from './LetterOpeningEnvelope';

interface LetterViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: Note | null;
    onAuthorClick?: (username: string) => void;
    onEdit?: (note: Note) => void;
    skipOpening?: boolean;
    initialComments?: boolean;
}

const LetterViewModal: React.FC<LetterViewModalProps> = ({ isOpen, onClose, note, onAuthorClick, onEdit, skipOpening = false, initialComments = false }) => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const { toggleLike } = useNoteStore();
    const [commentCount, setCommentCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isReposted, setIsReposted] = useState(false);
    const [repostCount, setRepostCount] = useState(0);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [showEnvelope, setShowEnvelope] = useState(true);
    const [envelopeOpened, setEnvelopeOpened] = useState(false);

    useEffect(() => {
        if (note && isOpen) {
            setCommentCount(Number(note.commentCount) || 0);
            setIsLiked(note.isLikedByUser || false);
            setLikeCount(note.likeCount || 0);
            // 3D envelope first, full-width reading second; comments only on demand.
            setIsCommentsOpen(initialComments);
            setShowEnvelope(!skipOpening && !initialComments);
            setEnvelopeOpened(skipOpening || initialComments);

            // Initialize repost count from note if available, or fetch
            setRepostCount(note.repostCount || 0);

            // Check if user has reposted
            const checkRepostStatus = async () => {
                if (!user) return;
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_ENDPOINTS.letters}/${note.id}/repost/status`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setIsReposted(data.reposted);
                        setRepostCount(data.count);
                    }
                } catch (error) {
                    console.error('Error checking repost status:', error);
                }
            };
            checkRepostStatus();

            // Join real-time room
            socketService.joinLetterRoom(String(note.id));

            // Listen for like updates
            const handleLikeUpdate = (data: { letterId: string; likeCount: number }) => {
                if (String(data.letterId) === String(note.id)) {
                    setLikeCount(data.likeCount);
                }
            };

            socketService.onLikeUpdate(handleLikeUpdate);

            return () => {
                socketService.leaveLetterRoom(String(note.id));
                socketService.offLikeUpdate();
            };
        }
    }, [note, isOpen, skipOpening, initialComments]);

    const handleRepost = async () => {
        if (!note || !user) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_ENDPOINTS.letters}/${note.id}/repost`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setIsReposted(data.reposted);
                setRepostCount(prev => data.reposted ? prev + 1 : prev - 1);
            }
        } catch (error) {
            console.error('Error toggling repost:', error);
        }
    };

    const handleLike = async () => {
        if (!note || !user) return;

        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            await toggleLike(String(note.id));
        } catch (error) {
            console.error('Error liking note:', error);
            // Revert on error
            setIsLiked(!newIsLiked);
            setLikeCount(prev => !newIsLiked ? prev + 1 : prev - 1);
        }
    };

    const handleAuthorClick = () => {
        if (!note || note.isAnonymous || !note.authorName || note.authorName === 'A Writer' || note.authorName === 'Unknown') return;
        const username = note.authorName.trim();
        if (!username) return;
        if (onAuthorClick) onAuthorClick(username);
        else navigate(user ? `/dashboard/profile/${encodeURIComponent(username)}` : `/writers/${encodeURIComponent(username)}`);
        onClose();
    };

    if (!note) return null;
    const music = parseLetterMusicLink(note.spotifyLink);
    const spotifyMedia = music?.platform === 'spotify' ? parseSpotifyMedia(note.spotifyLink) : null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
                <DialogContent
                    onEscapeKeyDown={(event) => { if (isCommentsOpen) { event.preventDefault(); setIsCommentsOpen(false); } }}
                    className="stl-full-letter-reader flex h-[min(94dvh,1000px)] w-[calc(100vw-1rem)] max-w-[1100px] min-w-0 flex-col gap-0 overflow-hidden rounded-[22px] border border-[#e7dbcc] bg-[#fcf9f4] p-0 shadow-2xl sm:h-[min(92dvh,1000px)] sm:rounded-[30px]"
                >
                    <DialogTitle className="sr-only">Letter from {note.isAnonymous ? 'A Friend' : note.authorName || 'Unknown'}</DialogTitle>
                    <DialogDescription className="sr-only">A paper envelope opening, followed by a full letter reader. Comments are separate and hidden until requested.</DialogDescription>

                    {/* Actions live OUTSIDE the reading paper on every viewport. */}
                    <header className="z-20 flex shrink-0 flex-col items-stretch gap-2 border-b border-[#e7dbcc] bg-[#fffdf9] px-3 py-3 pr-11 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4 sm:pr-14">
                        <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:flex-1">
                            <CharacterBadge name="basa" tone="paper" size="sm" />
                            <span className="min-w-0">
                                <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#a16f54]">SendTheLetter · Reader</span>
                                <span className="block max-w-full truncate font-editorial text-sm font-semibold text-[#30443a] sm:text-lg">{note.title || 'Your letter'}</span>
                            </span>
                        </div>
                        <div role="group" aria-label="Letter actions" className="scrollbar-hide flex w-full min-w-0 shrink-0 flex-nowrap items-center gap-1 overflow-x-auto sm:w-auto sm:max-w-full sm:flex-wrap sm:overflow-visible sm:gap-2">
                            {!showEnvelope && <button type="button" onClick={() => { setIsCommentsOpen(false); setEnvelopeOpened(false); setShowEnvelope(true); }} aria-label="3D envelope" title="See the 3D envelope again" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#e3d8cb] bg-white px-2.5 text-xs font-semibold text-[#345044] hover:bg-[#f4eee5] sm:px-3"><MailOpen size={16} aria-hidden="true" /><span className="hidden sm:inline">3D envelope</span></button>}
                            <button type="button" onClick={() => { setShowEnvelope(false); setIsCommentsOpen(open => !open); }} aria-label={isCommentsOpen ? 'Hide comments' : 'View comments'} aria-expanded={isCommentsOpen} aria-controls="stl-reader-comments" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#e3d8cb] bg-white px-3 text-xs font-bold text-[#30443a] hover:bg-[#f4eee5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#30443a]"><MessageCircle size={17} aria-hidden="true" /><span className="hidden min-[365px]:inline">Comments</span>{commentCount > 0 && <span className="rounded-full bg-[#edf0e8] px-1.5 tabular-nums">{commentCount}</span>}</button>
                            <button type="button" onClick={handleLike} disabled={!user} aria-label={isLiked ? 'Unlike letter' : 'Like letter'} aria-pressed={isLiked} title="Appreciate" className="inline-flex min-h-10 items-center gap-1 rounded-full px-2 text-xs font-semibold text-[#445b4e] hover:bg-[#f4eee5] disabled:opacity-40"><Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />{likeCount > 0 && likeCount}</button>
                            <button type="button" onClick={handleRepost} disabled={!user} aria-label="Repost letter" aria-pressed={isReposted} title="Repost" className="inline-flex min-h-10 items-center gap-1 rounded-full px-2 text-xs font-semibold text-[#445b4e] hover:bg-[#f4eee5] disabled:opacity-40"><Repeat2 size={18} />{repostCount > 0 && repostCount}</button>
                            <button type="button" onClick={() => setIsShareModalOpen(true)} aria-label="Share letter" title="Share" className="inline-flex min-h-10 items-center rounded-full px-2 text-[#445b4e] hover:bg-[#f4eee5]"><Share2 size={18} /></button>
                            {user?.id === (typeof note.authorId === 'string' ? parseInt(note.authorId) : note.authorId) && onEdit && <button type="button" onClick={() => { onClose(); onEdit(note); }} aria-label="Edit letter" title="Edit" className="inline-flex min-h-10 items-center rounded-full px-2 text-[#445b4e] hover:bg-[#f4eee5]"><Pencil size={18} /></button>}
                        </div>
                    </header>

                    <div className="relative min-h-0 min-w-0 flex-1">
                        {showEnvelope ? (
                            <section aria-label="Open the 3D letter" className="flex h-full min-h-0 w-full flex-col items-center justify-start gap-3 overflow-y-auto overscroll-contain px-4 pb-7 pt-5 text-center sm:justify-center sm:gap-4 sm:px-7">
                                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#a16f54]">A letter is waiting for you</p>
                                <h2 className="max-w-[680px] break-words font-editorial text-2xl leading-tight text-[#30443a] sm:text-4xl">{note.title || 'A note from the heart'}</h2>
                                <p className="max-w-xl text-sm leading-6 text-[#7a7165]">Unseal the envelope, then enjoy the letter without distractions.</p>
                                <LetterOpeningEnvelope opened={envelopeOpened} className="w-full max-w-[650px] shrink-0" />
                                <div className="flex w-full flex-wrap items-center justify-center gap-2">
                                    {!envelopeOpened && <button type="button" onClick={() => setEnvelopeOpened(true)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#304b3e] px-6 py-3 text-sm font-bold text-white hover:bg-[#426550]"><MailOpen size={19} /> Open envelope</button>}
                                    {envelopeOpened && <button type="button" onClick={() => setShowEnvelope(false)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#304b3e] px-6 py-3 text-sm font-bold text-white hover:bg-[#426550]"><BookOpenText size={19} /> Read full letter <ArrowRight size={17} /></button>}
                                    <button type="button" onClick={() => setShowEnvelope(false)} className="inline-flex min-h-12 items-center rounded-full border border-[#dcd0c2] bg-white px-5 py-3 text-sm font-semibold text-[#43574d] hover:bg-[#f5eee6]">Skip 3D &amp; read</button>
                                </div>
                            </section>
                        ) : (
                            <div data-testid="full-letter-scroll" className="h-full min-w-0 overflow-y-auto overscroll-contain">
                                <div className="mx-auto w-full min-w-0 max-w-[860px] px-3 pb-12 pt-5 sm:px-6 sm:pt-7 lg:px-9">
                                    <div className="mb-5 flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[#e6ddd0] pb-4">
                                        <div className="flex min-w-0 items-center gap-3 text-sm text-[#766657]">
                                            {!note.isAnonymous && note.authorAvatar ? <button type="button" onClick={handleAuthorClick} aria-label={'View ' + note.authorName + ' profile'} className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-stone-200"><img src={getImageUrl(note.authorAvatar)} alt="" className="h-full w-full object-cover" /></button> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1e8db] font-editorial text-xl text-[#6f685b]" aria-hidden="true">{note.isAnonymous ? '?' : (note.authorName?.[0]?.toUpperCase() || 'W')}</span>}
                                            <span className="min-w-0"><button type="button" onClick={handleAuthorClick} disabled={note.isAnonymous || !note.authorName || note.authorName === 'Unknown' || note.authorName === 'A Writer'} className="block max-w-full break-words text-left text-sm font-bold text-[#30443a] enabled:hover:underline">{note.isAnonymous ? 'Anonymous Writer' : note.authorName || 'A Writer'}</button><span className="text-xs text-[#897f73]">{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</span></span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full border border-[#eadfce] bg-[#fffaf3] px-3 py-2 text-xs font-semibold text-[#735f50]">{note.category || 'Letter'}</span>
                                            {music && <a href={music.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#eadfce] bg-[#fffaf3] px-3 text-xs font-semibold text-[#30443a] hover:bg-[#f5eee6]"><CharacterBadge name="tala" tone="paper" size="xs" /> {music.platform === 'spotify' ? 'Spotify' : 'Open YouTube'}</a>}
                                        </div>
                                    </div>
                                    {music?.platform === 'youtube' && <p className="mb-4 rounded-2xl border border-[#eadfce] bg-[#fff8ed] px-4 py-3 text-xs leading-5 text-[#786451]">YouTube soundtrack reference: open the link above to listen on YouTube. In-letter audio-only playback is available for Spotify links.</p>}
                                    {isOpen && spotifyMedia && <div className="relative z-10 mb-5"><SpotifyReadingPlayer key={String(note.id) + ':' + spotifyMedia.uri} spotifyLink={spotifyMedia.url} title={note.title} /></div>}
                                    <div className={cn('stl-full-letter-paper min-w-0', note.font || 'font-serif')}>
                                        <LetterBookReader key={String(note.id)} title={note.title} content={note.content} letterPages={note.letterPages} recipientName={note.recipientName} authorName={note.authorName} isAnonymous={note.isAnonymous} category={note.type || note.category} font={note.font} backgroundImage={note.backgroundImage} coverImage={note.imageUrl} compact />
                                    </div>
                                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-center">
                                        <p className="w-full text-sm text-[#776b5f]">Finished reading? Share a thought or send a little love.</p>
                                        <button type="button" onClick={() => setIsCommentsOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dcd0c2] bg-[#fffdf9] px-5 py-2.5 text-sm font-bold text-[#30443a] hover:bg-[#f5eee6]"><MessageCircle size={18} /> View comments &amp; gifts</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isCommentsOpen && <div data-testid="letter-comments-overlay" className="absolute inset-0 z-30 flex justify-end">
                            <button type="button" aria-label="Close comments overlay" onClick={() => setIsCommentsOpen(false)} className="absolute inset-0 bg-[#1a231c]/45 backdrop-blur-[2px]" />
                            <aside id="stl-reader-comments" aria-label="Letter comments drawer" className="relative h-full min-h-0 w-full max-w-[420px] overflow-hidden border-l border-[#e4d7c7] bg-white shadow-[-18px_0_50px_rgba(34,48,39,.18)] sm:w-[min(420px,92vw)]">
                                <CommentsPanel letterId={note.id} shareToken={note.isPublic && note.status === 'published' && !note.isArchived ? note.shareToken : undefined} onCollapse={() => setIsCommentsOpen(false)} onCommentCountChange={setCommentCount} />
                            </aside>
                        </div>}
                    </div>
                </DialogContent>
            </Dialog>
            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} note={note} />
        </>
    );
};

export default LetterViewModal;
