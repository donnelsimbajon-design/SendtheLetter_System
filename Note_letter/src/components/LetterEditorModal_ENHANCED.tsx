import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { X, Type, Image as ImageIcon, Music, Send, Globe, EyeOff, MapPin, Calendar, Clock, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import axios from 'axios';

interface LetterEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

// ... rest of constants (fonts, categories, backgroundGradients) stay the same

const LetterEditorModal: React.FC<LetterEditorModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const user = useAuthStore((state) => state.user);

    // Existing state
    const [font, setFont] = useState('font-serif');
    const [category, setCategory] = useState('Other');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState(backgroundGradients[0].value);
    const [imageUrl, setImageUrl] = useState('');

    // Form State
    const [title, setTitle] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [spotifyLink, setSpotifyLink] = useState('');
    const [content, setContent] = useState('');
    const [address, setAddress] = useState('');

    // New enhanced features state
    const [scheduledDate, setScheduledDate] = useState<string>('');
    const [isTimeCapsule, setIsTimeCapsule] = useState(false);
    const [openDate, setOpenDate] = useState<string>('');
    const [draftId, setDraftId] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Auto-save effect - saves draft every 10 seconds
    useEffect(() => {
        if (!isOpen || !title || !content) return;

        const saveDraft = async () => {
            setIsSaving(true);
            try {
                const draftData = {
                    title,
                    recipientName,
                    recipientAddress,
                    content,
                    font,
                    category,
                    spotifyLink,
                    isAnonymous,
                    isPublic,
                    backgroundImage,
                    imageUrl,
                    address,
                    scheduledDate,
                    isTimeCapsule,
                    openDate,
                    status: 'draft',
                    type: category,
                };

                if (draftId) {
                    // Update existing draft
                    await axios.put(`http://localhost:5000/api/letters/drafts/${draftId}`, draftData, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                } else {
                    // Create new draft
                    const response = await axios.post('http://localhost:5000/api/letters', draftData, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    setDraftId(response.data.letter.id);
                }

                setLastSaved(new Date().toLocaleTimeString());
            } catch (error) {
                console.error('Error saving draft:', error);
            } finally {
                setIsSaving(false);
            }
        };

        const timer = setTimeout(saveDraft, 10000); // 10 seconds
        return () => clearTimeout(timer);
    }, [isOpen, title, content, recipientName, font, category, scheduledDate, isTimeCapsule, openDate, draftId]);

    // Rest of your existing functions (handleImageUpload, handleSubmit, etc.)
    // ... 

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-screen-lg h-[95vh] p-0 border-none bg-transparent shadow-none overflow-hidden flex flex-col items-center justify-center">
                <DialogTitle className="sr-only">Write a Letter</DialogTitle>
                {/* Add this draft indicator at the top */}
                {lastSaved && (
                    <div className="absolute top-16 right-4 z-50 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-stone-600">
                        {isSaving ? 'Saving...' : `Saved ${lastSaved}`}
                    </div>
                )}

                {/* ... rest of your existing modal content ... */}

                {/* In the sidebar, add these new sections: */}
                {/* After the existing settings, add: */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                    <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                        Special Features
                    </Label>

                    {/* Schedule Letter */}
                    <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-2">
                            <Calendar size={12} />
                            Schedule for Later
                        </Label>
                        <Input
                            type="datetime-local"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="bg-white border-stone-200 text-stone-800 text-sm"
                        />
                    </div>

                    {/* Time Capsule */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs flex items-center gap-2">
                                <Lock size={12} />
                                Time Capsule
                            </Label>
                            <input
                                type="checkbox"
                                checked={isTimeCapsule}
                                onChange={(e) => setIsTimeCapsule(e.target.checked)}
                                className="rounded border-stone-300"
                            />
                        </div>
                        {isTimeCapsule && (
                            <Input
                                type="datetime-local"
                                value={openDate}
                                onChange={(e) => setOpenDate(e.target.value)}
                                placeholder="Open Date"
                                className="bg-white border-stone-200 text-stone-800 text-sm"
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LetterEditorModal;
