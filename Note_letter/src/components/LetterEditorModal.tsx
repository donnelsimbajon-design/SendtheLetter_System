import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import Mascot from './Mascot';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { X, Type, Image as ImageIcon, Music, Send, Globe, EyeOff, Calendar, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import { API_ENDPOINTS } from '../config/api';

interface LetterEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

const fonts = [
    { name: 'Serif (Formal)', value: 'font-serif' },
    { name: 'Sans (Modern)', value: 'font-sans' },
    { name: 'Mono (Typewriter)', value: 'font-mono' },
    { name: 'Cursive (Handwritten)', value: 'font-[cursive]' },
];

const categories = [
    'Love',
    'Friendship',
    'Gratitude',
    'Apology',
    'Reflection',
    'Celebration',
    'Other'
];

const letterTemplates = [
    { value: 'gratitude', label: 'A note of gratitude', category: 'Gratitude', title: 'Thank you for being you', content: 'Dear you,\n\nI wanted to take a moment to say thank you for...\n\nOne thing I appreciate about you is...\n\nIt means more than you know.\n\nWith gratitude,' },
    { value: 'apology', label: 'A gentle apology', category: 'Apology', title: 'I owe you an apology', content: 'Dear you,\n\nI have been thinking about what happened, and I want to acknowledge...\n\nI am sorry for...\n\nI hope we can find a way forward when you are ready.\n\nWith sincerity,' },
    { value: 'future-self', label: 'A note to my future self', category: 'Reflection', title: 'A note to my future self', content: 'Dear future me,\n\nRight now, life looks like...\n\nI hope you remember...\n\nPlease keep making time for...\n\nWhatever happens, I hope you are proud of how far we have come.\n\nWith care,' },
    { value: 'hello', label: 'A little hello', category: 'Friendship', title: 'Just wanted to say hello', content: 'Dear you,\n\nYou crossed my mind today, and I wanted to reach out.\n\nI hope you have been...\n\nHere is something I wanted you to know...\n\nTalk soon,' },
];

const API_URL = API_ENDPOINTS.letters;

const backgroundGradients = [
    { name: 'Classic Paper', value: '#fdfbf7', gradient: 'bg-[#fdfbf7]' },
    { name: 'Warm Sunset', value: 'linear-gradient(135deg, #fff5e6 0%, #ffe4cc 100%)', gradient: 'bg-gradient-to-br from-[#fff5e6] to-[#ffe4cc]' },
    { name: 'Ocean Breeze', value: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', gradient: 'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb]' },
    { name: 'Lavender Dream', value: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', gradient: 'bg-gradient-to-br from-[#f3e5f5] to-[#e1bee7]' },
    { name: 'Mint Fresh', value: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', gradient: 'bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9]' },
    { name: 'Rose Gold', value: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)', gradient: 'bg-gradient-to-br from-[#fce4ec] to-[#f8bbd0]' },
];

const toLocalDateTimeInput = (value?: string | Date | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const toUtcDateTime = (value: string) => value ? new Date(value).toISOString() : null;

const LetterEditorModal: React.FC<LetterEditorModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const user = useAuthStore((state) => state.user);
    const [font, setFont] = useState('font-serif');
    const [category, setCategory] = useState('Other');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState(backgroundGradients[0].value);
    const [imageUrl, setImageUrl] = useState('');
    const [imageUploadError, setImageUploadError] = useState('');

    // Form State
    const [title, setTitle] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [spotifyLink, setSpotifyLink] = useState('');
    const [content, setContent] = useState('');

    // Enhanced features state
    const [scheduledDate, setScheduledDate] = useState<string>('');
    const [isTimeCapsule, setIsTimeCapsule] = useState(false);
    const [openDate, setOpenDate] = useState<string>('');
    const [draftId, setDraftId] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Populate form if initialData is provided
    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title || '');
            setContent(initialData.content || '');
            setCategory(initialData.type || 'Other');
            setFont(initialData.font || 'font-serif');
            setIsPublic(initialData.isPublic || false);
            setIsAnonymous(initialData.isAnonymous || false);
            setBackgroundImage(initialData.backgroundImage || backgroundGradients[0].value);
            setImageUrl(initialData.imageUrl || '');
            setSpotifyLink(initialData.spotifyLink || '');
            setRecipientName(initialData.recipientName || '');
            setRecipientAddress(initialData.recipientAddress || '');
            setScheduledDate(toLocalDateTimeInput(initialData.scheduledDate));
            setIsTimeCapsule(initialData.isTimeCapsule || false);
            setOpenDate(toLocalDateTimeInput(initialData.openDate));
            // Stop draft auto-save if we are editing an existing letter
            if (initialData.status === 'published') {
                setDraftId('stop-autosave');
            } else if (initialData.id) {
                setDraftId(initialData.id);
            }
        } else if (isOpen && !initialData) {
            // Reset fields for new letter
            setTitle('');
            setContent('');
            setSelectedTemplate('');
            setCategory('Other');
            setFont('font-serif');
            setIsPublic(false);
            setIsAnonymous(false);
            setBackgroundImage(backgroundGradients[0].value);
            setImageUrl('');
            setImageUploadError('');
            setSpotifyLink('');
            setRecipientName('');
            setRecipientAddress('');
            setScheduledDate('');
            setIsTimeCapsule(false);
            setOpenDate('');
            setDraftId(null);
            setLastSaved('');
        }
    }, [isOpen, initialData]);

    // Auto-save effect - saves draft every 10 seconds
    useEffect(() => {
        if (!isOpen || !title || !content || draftId === 'stop-autosave') return;

        const saveDraft = async () => {
            setIsSaving(true);
            try {
                const token = localStorage.getItem('token');
                const draftData = {
                    title, recipientName, recipientAddress, content, font, category,
                    spotifyLink, isAnonymous, isPublic, backgroundImage,
                    imageUrl, scheduledDate, isTimeCapsule, openDate,
                    status: 'draft', type: category
                };

                if (draftId) {
                    const response = await fetch(`${API_URL}/drafts/${draftId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(draftData)
                    });
                    if (!response.ok) throw new Error('Could not update your draft.');
                } else {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(draftData)
                    });
                    if (!response.ok) throw new Error('Could not save your draft.');
                    const data = await response.json();
                    if (data.letter?.id) setDraftId(String(data.letter.id));
                }

                setLastSaved(new Date().toLocaleTimeString());
            } catch (error) {
                console.error('Error saving draft:', error);
            } finally {
                setIsSaving(false);
            }
        };

        const timer = setTimeout(saveDraft, 10000);
        return () => clearTimeout(timer);
    }, [isOpen, title, content, recipientName, recipientAddress, font, category, spotifyLink, isAnonymous, isPublic, backgroundImage, imageUrl, scheduledDate, isTimeCapsule, openDate, draftId]);

    const handleTemplateChange = (value: string) => {
        setSelectedTemplate(value);
        const template = letterTemplates.find((item) => item.value === value);
        if (!template) return;
        setTitle(template.title);
        setCategory(template.category);
        setContent(template.content);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setImageUploadError('Please choose an image file.');
                e.target.value = '';
                return;
            }
            if (file.size > 7 * 1024 * 1024) {
                setImageUploadError('Please choose an image smaller than 7 MB.');
                e.target.value = '';
                return;
            }
            setImageUploadError('');
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        onSubmit({
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
            scheduledDate: toUtcDateTime(scheduledDate),
            openDate: toUtcDateTime(openDate),
            isTimeCapsule,
            createdAt: new Date(),
        });
        onClose();
    };

    const backgroundClass = backgroundGradients.find(bg => bg.value === backgroundImage)?.gradient || 'bg-[#fdfbf7]';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-screen-lg h-[95vh] p-0 border-none bg-transparent shadow-none overflow-hidden flex flex-col items-center justify-center">
                <DialogTitle className="sr-only">Write a Letter</DialogTitle>
                <DialogDescription className="sr-only">Create or edit the content and settings of your letter.</DialogDescription>

                {/* Draft Saved Indicator */}
                {lastSaved && (
                    <div className="absolute top-16 right-4 z-50 bg-card/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-muted-foreground shadow-sm">
                        {isSaving ? '💾 Saving...' : `✓ Saved ${lastSaved}`}
                    </div>
                )}

                {/* Floating Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full backdrop-blur-sm transition-all"
                >
                    <X size={20} />
                </button>

                {/* Main Card Container */}
                <div className={cn(
                    "w-full h-full md:h-auto md:max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col md:flex-row bg-card",
                )}>

                    {/* Sidebar / Toolbar (Left Side on Desktop) */}
                    <div className="w-full md:w-80 bg-background border-r border-border p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        <div className="space-y-1">
                            <h2 className="text-xl font-serif font-medium text-foreground">Write a Letter</h2>
                            <p className="text-xs text-muted-foreground">Craft your thoughts with care.</p>
                        </div>

                        {/* Writing prompts */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start with a prompt</Label>
                            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                                <SelectTrigger className="bg-card border-border text-foreground">
                                    <SelectValue placeholder="Choose a starting point" />
                                </SelectTrigger>
                                <SelectContent>
                                    {letterTemplates.map((template) => (
                                        <SelectItem key={template.value} value={template.value}>{template.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Settings */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Style</Label>
                                <Select value={font} onValueChange={setFont}>
                                    <SelectTrigger className="bg-card border-border text-foreground">
                                        <div className="flex items-center gap-2">
                                            <Type size={14} className="text-muted-foreground" />
                                            <SelectValue placeholder="Select Font" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fonts.map((f) => (
                                            <SelectItem key={f.value} value={f.value} className={f.value}>
                                                {f.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-card border-border text-foreground">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Paper</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {backgroundGradients.map((bg) => (
                                        <button
                                            key={bg.name}
                                            type="button"
                                            onClick={() => setBackgroundImage(bg.value)}
                                            className={cn(
                                                "h-10 rounded-lg border-2 transition-all",
                                                bg.gradient,
                                                backgroundImage === bg.value ? "border-primary ring-1 ring-primary" : "border-border hover:border-stone-400"
                                            )}
                                            title={bg.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Globe size={14} className="text-muted-foreground" />
                                        <Label htmlFor="public" className="text-sm text-muted-foreground cursor-pointer">Public Post</Label>
                                    </div>
                                    <input
                                        type="checkbox"
                                        id="public"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="rounded border-border text-foreground focus:ring-stone-900"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <EyeOff size={14} className="text-muted-foreground" />
                                        <Label htmlFor="anonymous" className="text-sm text-muted-foreground cursor-pointer">Anonymous</Label>
                                    </div>
                                    <input
                                        type="checkbox"
                                        id="anonymous"
                                        checked={isAnonymous}
                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                        className="rounded border-border text-foreground focus:ring-stone-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="space-y-4 pt-4 border-t border-border">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attachments</Label>

                            <div className="space-y-3">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <Music size={14} />
                                    </div>
                                    <Input
                                        placeholder="Spotify Link..."
                                        value={spotifyLink}
                                        onChange={(e) => setSpotifyLink(e.target.value)}
                                        className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
                                    />
                                </div>

                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="flex items-center justify-center gap-2 w-full h-10 rounded-md border border-border bg-card text-muted-foreground hover:bg-background cursor-pointer transition-colors text-sm font-medium"
                                    >
                                        <ImageIcon size={16} />
                                        {imageUrl ? 'Change Image' : 'Add Image'}
                                    </label>
                                    {imageUploadError && <p role="alert" className="mt-1 text-xs text-destructive">{imageUploadError}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Features */}
                        <div className="space-y-4 pt-4 border-t border-border">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Special Features
                            </Label>

                            {/* Schedule Letter */}
                            <div className="space-y-2">
                                <Label htmlFor="schedule-date" className="text-xs flex items-center gap-2 text-muted-foreground">
                                    <Mascot name="tala" className="h-7 w-7" />
                                    Schedule for Later
                                </Label>
                                <Input
                                    id="schedule-date"
                                    type="datetime-local"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="bg-card border-border text-foreground text-sm"
                                />
                            </div>

                            {/* Time Capsule */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="time-capsule" className="text-xs flex items-center gap-2 text-muted-foreground cursor-pointer">
                                        <Lock size={12} />
                                        Time Capsule
                                    </Label>
                                    <input
                                        id="time-capsule"
                                        type="checkbox"
                                        checked={isTimeCapsule}
                                        onChange={(e) => setIsTimeCapsule(e.target.checked)}
                                        className="rounded border-border text-foreground focus:ring-stone-900"
                                    />
                                </div>
                                {isTimeCapsule && (
                                    <Input
                                        type="datetime-local"
                                        value={openDate}
                                        onChange={(e) => setOpenDate(e.target.value)}
                                        placeholder="Open Date"
                                        className="bg-card border-border text-foreground text-sm"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Editor Area (Right Side) */}
                    <div className={cn(
                        "flex-1 relative flex flex-col",
                        backgroundClass,
                        imageUrl ? "bg-cover bg-center" : ""
                    )}
                        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}}
                    >
                        {/* Overlay for readability if image is set */}
                        {imageUrl && <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />}

                        <div className="relative z-10 flex-1 flex flex-col p-8 md:p-12 overflow-y-auto custom-scrollbar">
                            {/* Header Inputs */}
                            <div className="space-y-6 mb-8">
                                <div className="border-b border-border pb-2">
                                    <Input
                                        placeholder="Title of your letter..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className={cn(
                                            "border-none bg-transparent text-3xl md:text-4xl font-bold placeholder:text-muted-foreground/40 focus-visible:ring-0 px-0 mb-4",
                                            font,
                                            imageUrl ? "text-white placeholder:text-white/40" : "text-foreground"
                                        )}
                                    />
                                    <Input
                                        placeholder="Dear..."
                                        value={recipientName}
                                        onChange={(e) => setRecipientName(e.target.value)}
                                        className={cn(
                                            "border-none bg-transparent text-2xl md:text-3xl font-bold placeholder:text-muted-foreground/40 focus-visible:ring-0 px-0",
                                            font,
                                            imageUrl ? "text-white placeholder:text-white/40" : "text-foreground"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Main Content */}
                            <Textarea
                                placeholder="Start writing your letter..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className={cn(
                                    "flex-1 min-h-[300px] border-none bg-transparent resize-none focus-visible:ring-0 px-0 text-lg leading-relaxed",
                                    font,
                                    imageUrl ? "text-white placeholder:text-white/40" : "text-foreground placeholder:text-muted-foreground"
                                )}
                            />

                            {/* Footer / Signature */}
                            <div className="mt-8 pt-8 border-t border-border flex justify-end">
                                <div className={cn(
                                    "text-right",
                                    imageUrl ? "text-white/80" : "text-muted-foreground"
                                )}>
                                    <p className={cn("text-sm italic", font)}>
                                        {isAnonymous ? "— Anonymous" : `— ${user?.username || 'Me'}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Send Button (Floating) */}
                        <div className="absolute bottom-6 right-6 z-20">
                            <Button
                                onClick={handleSubmit}
                                disabled={!content.trim() || !title.trim()}
                                className="h-14 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                            >
                                <span className="text-lg font-medium">Send Letter</span>
                                <Send size={18} />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LetterEditorModal;
