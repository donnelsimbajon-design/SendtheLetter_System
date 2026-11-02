import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
// VisuallyHidden removed
import { Button } from './ui/button';
import { Music, Heart, Repeat, PenLine, Share2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import CommentsPanel from './CommentsPanel';
import LetterBookReader from './LetterBookReader';
import { Note } from '../types/note';
import { cn, getImageUrl } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useNoteStore } from '../store/noteStore';
import { formatDistanceToNow } from 'date-fns';
import socketService from '../services/socketService';
import ShareModal from './ShareModal';
import { API_ENDPOINTS } from '../config/api';

interface LetterViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: Note | null;
    onAuthorClick?: (username: string) => void;
    onEdit?: (note: Note) => void;
}

const LetterViewModal: React.FC<LetterViewModalProps> = ({ isOpen, onClose, note, onAuthorClick, onEdit }) => {
    const user = useAuthStore((state) => state.user);
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
        if (note && !note.isAnonymous && note.authorName && onAuthorClick) {
            onClose();
            onAuthorClick(note.authorName);
        }
    };

    if (!note) return null;

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
                                {note.spotifyLink && (
                                    <a
                                        href={note.spotifyLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-stone-600 hover:text-[#1DB954] transition-colors"
                                        title="Open in Spotify"
                                    >
                                        <Music size={18} />
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
                                    {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
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
                                        <PenLine size={18} />
                                        <span className="sr-only">Edit Letter</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className={cn("p-8 md:p-12 space-y-8", note.font || 'font-serif')}>
                            {/* Header: Sender & Date */}
                            <div className="flex items-center gap-3 text-stone-600 text-sm">
                                {!note.isAnonymous && note.authorAvatar ? (
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 flex-shrink-0 cursor-pointer" onClick={handleAuthorClick}>
                                        <img src={getImageUrl(note.authorAvatar)} alt={note.authorName} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 flex items-center justify-center flex-shrink-0">
                                        <span className="text-stone-500 font-bold text-lg">
                                            {note.isAnonymous ? '?' : (note.authorName?.[0]?.toUpperCase() || 'U')}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <button
                                        onClick={handleAuthorClick}
                                        disabled={note.isAnonymous}
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

                            {/* Spotify Player - Show if letter has music */}
                            {note.spotifyLink && (
                                <div className="mt-8 pt-6 border-t border-stone-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Music size={18} className="text-stone-600" />
                                        <span className="text-sm font-medium text-stone-700">Letter Soundtrack</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* Spinning Vinyl Record */}
                                        <div className="relative w-24 h-24 flex-shrink-0">
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 shadow-xl animate-spin-slow">
                                                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-stone-700 to-stone-900">
                                                    <div className="absolute inset-2 rounded-full bg-stone-950 flex items-center justify-center">
                                                        <div className="w-3 h-3 rounded-full bg-stone-800"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Spotify Embed */}
                                        <div className="flex-1">
                                            <iframe
                                                src={note.spotifyLink.replace('open.spotify.com', 'open.spotify.com/embed')}
                                                width="100%"
                                                height="80"
                                                frameBorder="0"
                                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                loading="lazy"
                                                className="rounded-xl"
                                            ></iframe>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                <button type="button" onClick={handleRepost} disabled={!user} className={cn("inline-flex items-center gap-1 text-xs hover:text-green-600 disabled:opacity-40", isReposted && "text-green-600")} title="Repost"><Repeat size={17} /><span>{repostCount}</span></button>
                                <button type="button" onClick={() => setIsShareModalOpen(true)} disabled={!user} className="text-stone-600 hover:text-blue-500 disabled:opacity-40" title="Share"><Share2 size={17} /></button>
                                <button type="button" onClick={handleLike} disabled={!user} className={cn("inline-flex items-center gap-1 text-xs hover:text-rose-500 disabled:opacity-40", isLiked && "text-rose-500")} title="Like"><Heart size={17} className={cn(isLiked && "fill-rose-500")} /><span>{likeCount}</span></button>
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
