import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
// VisuallyHidden removed
import { Button } from './ui/button';
import CharacterBadge from './CharacterBadge';
import CommentsPanel from './CommentsPanel';
import LetterBookReader from './LetterBookReader';
import SpotifyReadingPlayer from './SpotifyReadingPlayer';
import { parseSpotifyMedia } from '../lib/spotify';
import { Note } from '../types/note';
import { cn, getImageUrl } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useNoteStore } from '../store/noteStore';
import { formatDistanceToNow } from 'date-fns';
import socketService from '../services/socketService';
import ShareModal from './ShareModal';
import { API_ENDPOINTS } from '../config/api';
import { useNavigate } from 'react-router-dom';

interface LetterViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: Note | null;
    onAuthorClick?: (username: string) => void;
    onEdit?: (note: Note) => void;
}

const LetterViewModal: React.FC<LetterViewModalProps> = ({ isOpen, onClose, note, onAuthorClick, onEdit }) => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const { toggleLike } = useNoteStore();
    const [commentCount, setCommentCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isReposted, setIsReposted] = useState(false);
    const [repostCount, setRepostCount] = useState(0);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (note && isOpen) {
            setIsLiked(note.isLikedByUser || false);
            setLikeCount(note.likeCount || 0);
            setIsSidebarOpen(true); // Reset to open when opening a new letter

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
    }, [note, isOpen]);

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
    const spotifyMedia = parseSpotifyMedia(note.spotifyLink);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 bg-[#fdfbf7] overflow-hidden flex flex-col-reverse md:flex-row-reverse">
                    <DialogTitle className="sr-only">Letter from {note.isAnonymous ? 'A Friend' : note.authorName || 'Unknown'}</DialogTitle>
                    <DialogDescription className="sr-only">Read the selected letter and its details.</DialogDescription>

                    {/* Left Side: Letter Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar border-r border-stone-200 transition-all duration-300">
                        {/* Toolbar / Header */}
                        <div className="sticky top-0 z-10 bg-[#fdfbf7]/95 backdrop-blur border-b border-stone-200 p-4 pr-12 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-sm font-medium">
                                    {note.category || 'Letter'}
                                </div>
                                {spotifyMedia && (
                                    <a
                                        href={spotifyMedia.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-stone-600 hover:text-[#1DB954] transition-colors"
                                        title="Open in Spotify"
                                    >
                                        <CharacterBadge name="tala" tone="paper" size="xs" />
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Toggle Sidebar Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="flex text-stone-500 hover:text-stone-800"
                                    title={isSidebarOpen ? "Hide Comments" : "Show Comments"}
                                >
                                    {isSidebarOpen ? 'Hide comments' : 'Comments'}
                                </Button>

                                {/* Edit Button for Author */}
                                {user?.id === (typeof note.authorId === 'string' ? parseInt(note.authorId) : note.authorId) && onEdit && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            onClose();
                                            onEdit(note);
                                        }}
                                        className="text-stone-500 hover:text-stone-800"
                                    >
                                        <CharacterBadge name="lumi" tone="paper" size="sm" />
                                        <span className="sr-only">Edit Letter</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {isOpen && spotifyMedia && <div className="sticky top-[69px] z-10">
                            <SpotifyReadingPlayer key={`${note.id}:${spotifyMedia.uri}`} spotifyLink={spotifyMedia.url} title={note.title} />
                        </div>}
                        <div className={cn("p-6 md:p-10 space-y-8", note.font || 'font-serif')}>
                            {/* Header: Sender & Date */}
                            <div className="flex items-center gap-3 text-stone-600 text-sm">
                                {!note.isAnonymous && note.authorAvatar ? (
                                    <button type="button" className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 flex-shrink-0 focus-visible:outline-2 focus-visible:outline-primary" onClick={handleAuthorClick} aria-label={`View ${note.authorName} profile`}>
                                        <img src={getImageUrl(note.authorAvatar)} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ) : (
                                    <button type="button" onClick={handleAuthorClick}
                                        disabled={note.isAnonymous || !note.authorName || note.authorName === 'A Writer' || note.authorName === 'Unknown'}
                                        aria-label={note.isAnonymous ? 'Anonymous writer' : `View ${note.authorName || 'writer'} profile`}
                                        className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 flex items-center justify-center flex-shrink-0 disabled:cursor-default enabled:hover:ring-2 enabled:hover:ring-[#a98570] focus-visible:outline-2 focus-visible:outline-primary">
                                        <span className="text-stone-500 font-bold text-lg">
                                            {note.isAnonymous ? '?' : (note.authorName?.[0]?.toUpperCase() || 'U')}
                                        </span>
                                    </button>
                                )}
                                <div>
                                    <button
                                        onClick={handleAuthorClick}
                                        disabled={note.isAnonymous || !note.authorName || note.authorName === 'A Writer' || note.authorName === 'Unknown'}
                                        className={cn("font-bold text-stone-900 text-left block", !note.isAnonymous && "hover:underline cursor-pointer")}
                                    >
                                        {note.isAnonymous ? 'Anonymous Writer' : note.authorName || 'A Writer'}
                                    </button>
                                    <p className="text-xs text-stone-400">
                                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>

                            <LetterBookReader
                                key={String(note.id)}
                                title={note.title}
                                content={note.content}
                                letterPages={note.letterPages}
                                recipientName={note.recipientName}
                                authorName={note.authorName}
                                isAnonymous={note.isAnonymous}
                                category={note.type || note.category}
                                font={note.font}
                                backgroundImage={note.backgroundImage}
                                coverImage={note.imageUrl}
                                compact
                            />

                        </div>
                    </div>

                    {/* Comments drawer: visually left of the letter on desktop, top on mobile. */}
                    <aside className={cn(
                        "min-h-0 shrink-0 border-stone-200 transition-[width,height,opacity] duration-300 overflow-hidden",
                        isSidebarOpen ? "h-[45vh] w-full border-b opacity-100 md:h-full md:w-[380px] md:border-b-0 md:border-r" : "h-0 w-0 border-0 opacity-0 md:h-full"
                    )}>
                        {isSidebarOpen && <CommentsPanel
                            letterId={note.id}
                            shareToken={note.isPublic && note.status === 'published' && !note.isArchived ? note.shareToken : undefined}
                            onCollapse={() => setIsSidebarOpen(false)}
                            onCommentCountChange={setCommentCount}
                            actions={<>
                                <button type="button" onClick={handleRepost} disabled={!user} className={cn("inline-flex items-center gap-1 text-xs hover:text-green-600 disabled:opacity-40", isReposted && "text-green-600")} title="Repost"><CharacterBadge name="piko" tone="paper" size="xs" /><span>{repostCount}</span></button>
                                <button type="button" onClick={() => setIsShareModalOpen(true)} disabled={!user} className="text-stone-600 hover:text-blue-500 disabled:opacity-40" title="Share"><CharacterBadge name="piko" tone="paper" size="sm" /></button>
                                <button type="button" onClick={handleLike} disabled={!user} className={cn("inline-flex items-center gap-1 text-xs hover:text-rose-500 disabled:opacity-40", isLiked && "text-rose-500")} title="Like"><CharacterBadge name="sely" tone={isLiked ? "rose" : "paper"} size="sm" /><span>{likeCount}</span></button>
                                <span className="sr-only">{commentCount} comments</span>
                            </>}
                        />}
                    </aside>
                </DialogContent>
            </Dialog>
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                note={note}
            />
        </>
    );
};

export default LetterViewModal;
