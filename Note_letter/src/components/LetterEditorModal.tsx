import React, { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { X, Type, Image as ImageIcon, Music, Send, Globe, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

interface LetterEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
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

const backgroundGradients = [
    { name: 'Classic Paper', value: '#fdfbf7', gradient: 'bg-[#fdfbf7]' },
    { name: 'Warm Sunset', value: 'linear-gradient(135deg, #fff5e6 0%, #ffe4cc 100%)', gradient: 'bg-gradient-to-br from-[#fff5e6] to-[#ffe4cc]' },
    { name: 'Ocean Breeze', value: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', gradient: 'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb]' },
    { name: 'Lavender Dream', value: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', gradient: 'bg-gradient-to-br from-[#f3e5f5] to-[#e1bee7]' },
    { name: 'Mint Fresh', value: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', gradient: 'bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9]' },
    { name: 'Rose Gold', value: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)', gradient: 'bg-gradient-to-br from-[#fce4ec] to-[#f8bbd0]' },
];

const LetterEditorModal: React.FC<LetterEditorModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const user = useAuthStore((state) => state.user);
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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
            createdAt: new Date(),
        });
        onClose();
    };

    const backgroundClass = backgroundGradients.find(bg => bg.value === backgroundImage)?.gradient || 'bg-[#fdfbf7]';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-screen-lg h-[95vh] p-0 border-none bg-transparent shadow-none overflow-hidden flex flex-col items-center justify-center">

                {/* Floating Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full backdrop-blur-sm transition-all"
                >
                    <X size={20} />
                </button>

                {/* Main Card Container */}
                <div className={cn(
                    "w-full h-full md:h-auto md:max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col md:flex-row bg-white",
                )}>

                    {/* Sidebar / Toolbar (Left Side on Desktop) */}
                    <div className="w-full md:w-80 bg-stone-50 border-r border-stone-100 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        <div className="space-y-1">
                            <h2 className="text-xl font-serif font-medium text-stone-900">Write a Letter</h2>
                            <p className="text-xs text-stone-500">Craft your thoughts with care.</p>
                        </div>

                        {/* Settings */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Style</Label>
                                <Select value={font} onValueChange={setFont}>
                                    <SelectTrigger className="bg-white border-stone-200 text-stone-800">
                                        <div className="flex items-center gap-2">
                                            <Type size={14} className="text-stone-400" />
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
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-white border-stone-200 text-stone-800">
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
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Paper</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {backgroundGradients.map((bg) => (
                                        <button
                                            key={bg.name}
                                            type="button"
                                            onClick={() => setBackgroundImage(bg.value)}
                                            className={cn(
                                                "h-10 rounded-lg border-2 transition-all",
                                                bg.gradient,
                                                backgroundImage === bg.value ? "border-stone-800 ring-1 ring-stone-800" : "border-stone-200 hover:border-stone-400"
                                            )}
                                            title={bg.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Globe size={14} className="text-stone-400" />
                                        <Label htmlFor="public" className="text-sm text-stone-600 cursor-pointer">Public Post</Label>
                                    </div>
                                    <input
                                        type="checkbox"
                                        id="public"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <EyeOff size={14} className="text-stone-400" />
                                        <Label htmlFor="anonymous" className="text-sm text-stone-600 cursor-pointer">Anonymous</Label>
                                    </div>
                                    <input
                                        type="checkbox"
                                        id="anonymous"
                                        checked={isAnonymous}
                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                        className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="space-y-4 pt-4 border-t border-stone-100">
                            <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Attachments</Label>

                            <div className="space-y-3">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                                        <Music size={14} />
                                    </div>
                                    <Input
                                        placeholder="Spotify Link..."
                                        value={spotifyLink}
                                        onChange={(e) => setSpotifyLink(e.target.value)}
                                        className="pl-9 bg-white border-stone-200 text-stone-800 placeholder:text-stone-400"
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
                                        className="flex items-center justify-center gap-2 w-full h-10 rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors text-sm font-medium"
                                    >
                                        <ImageIcon size={16} />
                                        {imageUrl ? 'Change Image' : 'Add Image'}
                                    </label>
                                </div>
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
                                <div className="border-b border-black/10 pb-2">
                                    <Input
                                        placeholder="Title of your letter..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className={cn(
                                            "border-none bg-transparent text-3xl md:text-4xl font-bold placeholder:text-black/20 focus-visible:ring-0 px-0 mb-4",
                                            font,
                                            imageUrl ? "text-white placeholder:text-white/40" : "text-stone-800"
                                        )}
                                    />
                                    <Input
                                        placeholder="Dear..."
                                        value={recipientName}
                                        onChange={(e) => setRecipientName(e.target.value)}
                                        className={cn(
                                            "border-none bg-transparent text-2xl md:text-3xl font-bold placeholder:text-black/20 focus-visible:ring-0 px-0",
                                            font,
                                            imageUrl ? "text-white placeholder:text-white/40" : "text-stone-800"
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
                                    imageUrl ? "text-white placeholder:text-white/40" : "text-stone-800 placeholder:text-stone-400"
                                )}
                            />

                            {/* Footer / Signature */}
                            <div className="mt-8 pt-8 border-t border-black/10 flex justify-end">
                                <div className={cn(
                                    "text-right",
                                    imageUrl ? "text-white/80" : "text-stone-500"
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
                                className="h-14 px-8 rounded-full bg-stone-900 hover:bg-black text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
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
