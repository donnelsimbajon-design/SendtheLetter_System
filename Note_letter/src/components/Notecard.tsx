import { Note } from '../types/note';
import { Trash2, Heart, Share2, Globe, Lock, Music } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useNoteStore } from '../store/noteStore';

interface NotecardProps {
    note: Note;
    onClick?: (note: Note) => void;
}

const Notecard = ({ note, onClick }: NotecardProps) => {
    const { deleteNote, toggleReaction } = useNoteStore();

    return (
        <div
            onClick={() => onClick?.(note)}
            className="group bg-card/50 p-6 rounded-xl border border-border/50 hover:border-primary/50 transition-all duration-300 flex flex-col h-[280px] cursor-pointer relative"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium uppercase tracking-wider">
                            {note.category || 'Letter'}
                        </span>
                        {note.spotifyLink && (
                            <Music size={14} className="text-primary/70" />
                        )}
                    </div>
                    <h3 className="text-lg font-bold line-clamp-1 mb-1 group-hover:text-primary transition-colors">{note.title || 'Untitled Letter'}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {note.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                        <span>{format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                    }}
                    className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete note"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <p className="text-muted-foreground mb-6 line-clamp-5 flex-1 leading-relaxed font-serif">
                {note.content}
            </p>

            <div className="flex justify-between items-center pt-4 border-t border-border/50">
                <div className="flex gap-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleReaction(note.id, 'heart');
                        }}
                        className={clsx(
                            "flex items-center gap-1.5 text-sm transition-colors px-2 py-1 rounded-md hover:bg-accent",
                            note.reactions['heart'] ? "text-red-500 font-medium" : "text-muted-foreground hover:text-red-500"
                        )}
                    >
                        <Heart size={16} fill={note.reactions['heart'] ? "currentColor" : "none"} />
                        <span>{note.reactions['heart'] || 0}</span>
                    </button>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // Share logic
                    }}
                    className="text-muted-foreground hover:text-primary p-2 rounded-md hover:bg-primary/10 transition-colors"
                >
                    <Share2 size={18} />
                </button>
            </div>
        </div>
    );
};

export default Notecard;
