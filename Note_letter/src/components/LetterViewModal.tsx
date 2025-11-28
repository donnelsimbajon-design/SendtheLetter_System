import React from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Music, X } from 'lucide-react';
import { Note } from '../types/note';
import { cn } from '../lib/utils';

interface LetterViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: Note | null;
}

const LetterViewModal: React.FC<LetterViewModalProps> = ({ isOpen, onClose, note }) => {
    if (!note) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[90vh] overflow-y-auto bg-[#fdfbf7] border-none shadow-2xl sm:rounded-xl p-0 gap-0">
                {/* Toolbar / Header */}
                <div className="sticky top-0 z-10 bg-[#fdfbf7]/95 backdrop-blur supports-[backdrop-filter]:bg-[#fdfbf7]/60 border-b border-stone-200 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {/* Category Badge */}
                        <div className="px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-sm font-medium">
                            {note.category || 'Letter'}
                        </div>

                        {/* Spotify Link Display */}
                        {note.spotifyLink && (
                            <a
                                href={note.spotifyLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-stone-600 hover:text-[#1DB954] transition-colors"
                                title="Open in Spotify"
                            >
                                <Music size={18} />
                                <span className="text-sm truncate max-w-[200px] hidden sm:block">
                                    {note.spotifyLink}
                                </span>
                            </a>
                        )}
                    </div>

                    <Button variant="ghost" onClick={onClose} className="text-stone-500 hover:text-stone-800">
                        <X size={20} />
                    </Button>
                </div>

                {/* Letter Content */}
                <div className={cn("p-8 md:p-12 max-w-2xl mx-auto w-full space-y-8", note.font || 'font-serif')}>

                    {/* Header: Sender & Date */}
                    <div className="space-y-1 text-stone-600 text-sm">
                        <p className="font-bold text-stone-900">
                            {note.isAnonymous ? 'Anonymous Writer' : 'A Writer'}
                        </p>
                        <p>123 Letter Lane</p>
                        <p>City of Writers, WL 99999</p>
                        <p className="pt-4">
                            {new Date(note.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Recipient Info */}
                    {(note.recipientName || note.recipientAddress) && (
                        <div className="space-y-4">
                            <div className="space-y-2 text-stone-800">
                                {note.recipientName && <p className="font-bold text-base">{note.recipientName}</p>}
                                {note.recipientAddress && <p className="text-sm whitespace-pre-wrap">{note.recipientAddress}</p>}
                            </div>
                        </div>
                    )}

                    {/* Salutation */}
                    <div className="flex items-center gap-2 text-stone-900 font-bold">
                        <span>Dear {note.recipientName ? note.recipientName.split(' ')[0] : 'Friend'},</span>
                    </div>

                    {/* Body */}
                    <div className="min-h-[200px] text-stone-900 leading-relaxed text-lg whitespace-pre-wrap">
                        {note.content}
                    </div>

                    {/* Closing */}
                    <div className="space-y-4 pt-8">
                        <p className="text-stone-800">Kind regards,</p>
                        <p className="font-bold text-xl signature text-stone-900">
                            {note.isAnonymous ? 'A Friend' : 'Me'}
                        </p>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LetterViewModal;
