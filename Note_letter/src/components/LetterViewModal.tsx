import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
// VisuallyHidden removed
import { Button } from './ui/button';
import { Music, X, Heart, MessageCircle, Send, Repeat, PenLine, Share2, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Note } from '../types/note';
import { cn, getImageUrl } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useNoteStore } from '../store/noteStore';
import { formatDistanceToNow } from 'date-fns';
import socketService from '../services/socketService';
import ShareModal from './ShareModal';

interface LetterViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: Note | null;
    onAuthorClick?: (username: string) => void;
    onEdit?: (note: Note) => void;
}

const LetterViewModal: React.FC<LetterViewModalProps> = ({ isOpen, onClose, note, onAuthorClick, onEdit }) => {
    const user = useAuthStore((state) => state.user);
    const { toggleLike, addComment } = useNoteStore();
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<any[]>([]);
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
                    const response = await fetch(`http://localhost:5000/api/letters/${note.id}/repost/status`, {
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

            // Fetch comments
            const fetchComments = async () => {
                try {
                    const response = await fetch(`http://localhost:5000/api/letters/${note.id}/comments`);
                    if (response.ok) {
                        const data = await response.json();
                        setComments(data);
                    }
                } catch (error) {
                    console.error('Error fetching comments:', error);
                }
            };
            fetchComments();

            // Listen for new comments
            const handleNewComment = (newComment: any) => {

                if (String(newComment.letterId) === String(note.id)) {
                    setComments(prev => {
                        // Avoid duplicates if we optimistically added it
                        if (prev.some(c => c.id === newComment.id)) return prev;
                        return [newComment, ...prev];
                    });
                }
            };

            // Listen for like updates
            const handleLikeUpdate = (data: { letterId: string; likeCount: number }) => {
                if (String(data.letterId) === String(note.id)) {
                    setLikeCount(data.likeCount);
                }
            };

            socketService.onNewComment(handleNewComment);
            socketService.onLikeUpdate(handleLikeUpdate);

            return () => {
                socketService.leaveLetterRoom(String(note.id));
                socketService.offNewComment();
                socketService.offLikeUpdate();
            };
        }
    }, [note, isOpen]);

    const handleRepost = async () => {
        if (!note || !user) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/letters/${note.id}/repost`, {
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

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note || !user || !commentText.trim()) return;

        try {
            await addComment(String(note.id), commentText);
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
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
                <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 bg-[#fdfbf7] overflow-hidden flex flex-col md:flex-row">
                    <DialogTitle className="sr-only">Letter from {note.isAnonymous ? 'A Friend' : note.authorName || 'Unknown'}</DialogTitle>

                    {/* Left Side: Letter Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar border-r border-stone-200 transition-all duration-300">
                        {/* Toolbar / Header */}
                        <div className="sticky top-0 z-10 bg-[#fdfbf7]/95 backdrop-blur border-b border-stone-200 p-4 flex justify-between items-center">
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
                                    className="hidden md:flex text-stone-500 hover:text-stone-800"
                                    title={isSidebarOpen ? "Hide Comments" : "Show Comments"}
                                >
                                    {isSidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
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
                                <Button variant="ghost" onClick={onClose} className="md:hidden text-stone-500">
                                    <X size={20} />
                                </Button>
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

                            {/* Salutation */}
                            <div className="font-bold text-stone-900 text-lg">
                                Dear {note.recipientName ? note.recipientName.split(' ')[0] : 'Friend'},
                            </div>

                            {/* Body */}
                            <div className="min-h-[200px] text-stone-900 leading-relaxed text-lg whitespace-pre-wrap">
                                {note.content}
                            </div>

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

                            {/* Closing */}
                            <div className="space-y-2 pt-8">
                                <p className="text-stone-800">Kind regards,</p>
                                <p className="font-bold text-xl signature text-stone-900">
                                    {note.isAnonymous ? 'A Friend' : note.authorName || 'Me'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Interactions & Comments */}
                    <div className={cn(
                        "bg-white flex flex-col h-[40vh] md:h-full border-t md:border-t-0 md:border-l border-stone-200 transition-all duration-300 ease-in-out overflow-hidden",
                        isSidebarOpen ? "w-full md:w-96 opacity-100" : "w-0 opacity-0 border-none"
                    )}>
                        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                            <h3 className="font-semibold text-stone-800">Comments</h3>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleRepost}
                                    className={cn("hidden md:flex items-center gap-1.5 transition-colors", isReposted ? "text-green-500" : "text-stone-600 hover:text-green-500")}
                                    title="Quick Repost"
                                >
                                    <Repeat size={20} className={cn(isReposted && "fill-green-500 text-green-500")} />
                                    <span className="text-sm font-medium">{repostCount}</span>
                                </button>
                                <button
                                    onClick={() => setIsShareModalOpen(true)}
                                    className="flex items-center gap-1.5 text-stone-600 hover:text-blue-500 transition-colors"
                                    title="Share"
                                >
                                    <Share2 size={20} />
                                </button>
                                <button
                                    onClick={handleLike}
                                    className="flex items-center gap-1.5 text-stone-600 hover:text-rose-500 transition-colors"
                                >
                                    <Heart size={20} className={cn(isLiked && "fill-rose-500 text-rose-500")} />
                                    <span className="text-sm font-medium">{likeCount}</span>
                                </button>
                                <div className="flex items-center gap-1.5 text-stone-600">
                                    <MessageCircle size={20} />
                                    <span className="text-sm font-medium">{comments.length}</span>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={onClose} className="hidden md:flex text-stone-500 hover:text-stone-800">
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/30">
                            {comments.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center p-4">
                                    <MessageCircle size={32} className="mb-2 opacity-20" />
                                    <p className="text-sm">No comments yet.</p>
                                    <p className="text-xs">Be the first to share your thoughts!</p>
                                </div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3 group">
                                        <div className="w-8 h-8 rounded-full bg-stone-200 flex-shrink-0 overflow-hidden">
                                            {comment.user?.avatar ? (
                                                <img
                                                    src={getImageUrl(comment.user.avatar)}
                                                    alt={comment.user.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-blue-500 to-purple-600">
                                                    {comment.user?.username?.[0]?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-stone-100 shadow-sm">
                                                <p className="text-xs font-bold text-stone-900 mb-0.5">
                                                    {comment.user?.username || 'User'}
                                                </p>
                                                <p className="text-sm text-stone-700 leading-relaxed">
                                                    {comment.content}
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-stone-400 pl-2">
                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Comment Input */}
                        <div className="p-4 bg-white border-t border-stone-100">
                            <form onSubmit={handleComment} className="flex gap-2">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="flex-1 bg-stone-100 border-none rounded-full px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!commentText.trim()}
                                    className="p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                note={note}
                onRepost={handleRepost}
                isReposted={isReposted}
            />
        </>
    );
};

export default LetterViewModal;
