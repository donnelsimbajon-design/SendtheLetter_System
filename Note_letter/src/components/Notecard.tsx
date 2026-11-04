import { Note } from '../types/note';
import CharacterBadge from './CharacterBadge';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useNoteStore } from '../store/noteStore';
import { useAuthStore } from '../store/authStore';
import { getImageUrl } from '../lib/utils';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmDialog from './DeleteConfirmDialog';

interface NotecardProps {
    note: Note;
    onClick?: (note: Note) => void;
    onAuthorClick?: (username: string) => void;
}

const backgroundGradients = [
    { name: 'Classic Paper', value: '#fdfbf7', gradient: 'bg-[#fdfbf7]' },
    { name: 'Warm Sunset', value: 'linear-gradient(135deg, #fff5e6 0%, #ffe4cc 100%)', gradient: 'bg-gradient-to-br from-[#fff5e6] to-[#ffe4cc]' },
    { name: 'Ocean Breeze', value: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', gradient: 'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb]' },
    { name: 'Lavender Dream', value: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', gradient: 'bg-gradient-to-br from-[#f3e5f5] to-[#e1bee7]' },
    { name: 'Mint Fresh', value: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', gradient: 'bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9]' },
    { name: 'Rose Gold', value: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)', gradient: 'bg-gradient-to-br from-[#fce4ec] to-[#f8bbd0]' },
];

const Notecard = ({ note, onClick, onAuthorClick }: NotecardProps) => {
    const { deleteNote, toggleLike, archiveNote } = useNoteStore();
    const user = useAuthStore((state) => state.user);
    const authenticated = useAuthStore((state) => state.isAuthenticated);
    const [liking, setLiking] = useState(false);
    const navigate = useNavigate();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Check if current user is the author
    const isAuthor = user?.id === (typeof note.authorId === 'string' ? parseInt(note.authorId) : note.authorId);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!authenticated) {
            navigate('/login?returnTo=%2Fdashboard%2Fcommunity');
            return;
        }
        if (liking) return;
        setLiking(true);
        try {
            await toggleLike(String(note.id));
        } catch (error) {
            console.error('Error toggling like:', error);
        } finally {
            setLiking(false);
        }
    };

    const handleAuthorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (note.isAnonymous || !note.authorName || note.authorName === 'A Writer' || note.authorName === 'Unknown') return;
        if (onAuthorClick) onAuthorClick(note.authorName);
        else navigate(`/writers/${encodeURIComponent(note.authorName)}`);
    };

    // Find the gradient class based on the stored value
    const backgroundClass = note.backgroundImage
        ? backgroundGradients.find(bg => bg.value === note.backgroundImage)?.gradient
        : null;

    // Determine text colors based on background (Image -> Light, Gradient -> Dark/Mixed, Default -> Light)
    const isImageBackground = !!note.imageUrl;
    const textColor = isImageBackground ? "text-white" : (backgroundClass ? "text-stone-900" : "text-foreground");
    const subTextColor = isImageBackground ? "text-white/70" : (backgroundClass ? "text-stone-600" : "text-muted-foreground");
    const metaColor = isImageBackground ? "text-white/60" : (backgroundClass ? "text-stone-500" : "text-muted-foreground/60");
    const iconColor = isImageBackground ? "text-white/80" : (backgroundClass ? "text-stone-500" : "text-muted-foreground/50");
    const hoverIconColor = isImageBackground ? "hover:text-white" : (backgroundClass ? "hover:text-stone-800" : "hover:text-primary");

    return (
        <article
            className={clsx(
                "stl-depth-card group p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden h-[280px] flex flex-col hover:-translate-y-1 focus-within:border-primary/40 focus-within:shadow-md",
                backgroundClass && !isImageBackground ? [backgroundClass, "border-stone-200/50 shadow-sm"] : "bg-card border-border shadow-sm hover:border-primary/30 hover:shadow-md"
            )}
        >
            <button type="button" className="absolute inset-0 z-[5] rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={`Read letter: ${note.title || 'Untitled letter'}`} onClick={() => onClick?.(note)} />
            {/* Background Image Cover */}
            {isImageBackground && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <img
                        src={getImageUrl(note.imageUrl)}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            // Optional: You could set a fallback image here or just hide it
                        }}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                </div>
            )}

            {/* Hover Effect for Default Cards (No Image, No Gradient) */}
            {!backgroundClass && !isImageBackground && (
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary/100 transition-all duration-500" />
            )}

            <div className="pointer-events-none flex justify-between items-start mb-4 relative z-10">
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={clsx("text-[10px] font-medium uppercase tracking-widest", metaColor)}>
                            {format(new Date(note.createdAt), 'MMM d, yyyy')}
                        </span>
                        <span className={clsx("text-[10px]", metaColor)}>•</span>
                        {note.isAnonymous ? (
                            <span className={clsx("text-[10px] font-medium uppercase tracking-widest", isImageBackground ? "text-white/90" : (backgroundClass ? "text-stone-800" : "text-primary/80"))}>
                                Anonymous
                            </span>
                        ) : (
                            <button
                                onClick={handleAuthorClick}
                                disabled={!note.authorName || note.authorName === 'Unknown' || note.authorName === 'A Writer'}
                                aria-label={`View ${note.authorName || 'writer'} profile`}
                                className={clsx(
                                    "pointer-events-auto relative z-20 text-[10px] font-medium uppercase tracking-widest hover:underline transition-all",
                                    isImageBackground ? "text-white/90 hover:text-white" : (backgroundClass ? "text-stone-800 hover:text-stone-900" : "text-primary/80 hover:text-primary")
                                )}
                            >
                                {note.authorName || 'Unknown'}
                            </button>
                        )}
                        {note.spotifyLink && (
                            <CharacterBadge name="tala" tone="gold" size="xs" className="ml-auto" />
                        )}
                    </div>
                    <h3 className={clsx("text-xl font-medium line-clamp-1 mb-2 transition-colors font-serif tracking-wide", textColor, !isImageBackground && !backgroundClass && "group-hover:text-primary")}>
                        {note.title || 'Untitled Letter'}
                    </h3>
                </div>

                {/* Only show delete button if user is author */}
                {isAuthor && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // Show dialog instead of immediate delete
                            setIsDeleteDialogOpen(true);
                        }}
                        className={clsx("pointer-events-auto relative z-20 min-h-9 rounded-full px-2 text-[11px] font-bold opacity-100 transition-all sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100", iconColor, "hover:text-red-500")}
                        title="Delete note"
                    >
                        Remove
                    </button>
                )}
            </div>

            <p className={clsx("mb-auto line-clamp-4 leading-relaxed font-light text-sm", subTextColor)}>
                {note.content}
            </p>

            <div className="pointer-events-none flex justify-between items-center relative z-10 mt-4">
                <div className="flex items-center gap-3">
                    <span className={clsx("text-[10px] uppercase tracking-wider px-2 py-1 rounded-md", isImageBackground ? "bg-white/10 text-white/80 backdrop-blur-sm" : (backgroundClass ? "text-stone-600 bg-stone-900/5" : "text-primary/80 bg-primary/5"))}>
                        {note.category || note.type || 'General'}
                    </span>
                </div>

                <div className="flex gap-3">
                    {/* Like Button */}
                    <button
                        onClick={handleLike}
                        disabled={liking}
                        aria-label={note.isLikedByUser ? "Unlike this letter" : "Like this letter"}
                        className={clsx(
                            "pointer-events-auto relative z-20 flex min-h-9 items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-full cursor-pointer",
                            note.isLikedByUser
                                ? "text-red-500 bg-red-500/10"
                                : clsx(iconColor, "hover:text-red-500")
                        )}
                    >
                        <CharacterBadge name="sely" tone={note.isLikedByUser ? "rose" : "paper"} size="xs" />
                        <span>{note.likeCount || 0}</span>
                    </button>

                    {/* Comment Count - Clicking opens modal */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.(note);
                        }}
                        aria-label="View comments"
                        className={clsx("pointer-events-auto relative z-20 flex min-h-9 items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors cursor-pointer", iconColor, hoverIconColor)}
                    >
                        <CharacterBadge name="piko" tone="paper" size="xs" />
                        <span>{note.commentCount || 0}</span>
                    </button>
                </div>
            </div>
            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onArchive={() => archiveNote(String(note.id))}
                onDelete={() => deleteNote(String(note.id))}
                title={`Delete "${note.title || 'Untitled'}"?`}
            />
        </article>
    );
};

export default Notecard;
