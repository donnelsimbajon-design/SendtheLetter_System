import React, { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { AlertCircle, Send, Music } from 'lucide-react';
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

const LetterEditorModal: React.FC<LetterEditorModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const user = useAuthStore((state) => state.user);
    const [font, setFont] = useState('font-serif');
    const [category, setCategory] = useState('Other');
    const [isAnonymous, setIsAnonymous] = useState(false);

    // Form State
    const [recipientName, setRecipientName] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [spotifyLink, setSpotifyLink] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = () => {
        onSubmit({
            recipientName,
            recipientAddress,
            content,
            font,
            category,
            spotifyLink,
            isAnonymous,
            createdAt: new Date(),
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[90vh] overflow-y-auto bg-[#fdfbf7] border-none shadow-2xl sm:rounded-xl p-0 gap-0">
                {/* Toolbar */}
                <div className="sticky top-0 z-10 bg-[#fdfbf7]/95 backdrop-blur supports-[backdrop-filter]:bg-[#fdfbf7]/60 border-b border-stone-200 p-4 flex flex-col gap-4">

                    {/* Top Row: Controls */}
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-4">
                            {/* Font Selector */}
                            <Select value={font} onValueChange={setFont}>
                                <SelectTrigger className="w-[160px] bg-white border-stone-200 text-stone-800">
                                    <SelectValue placeholder="Select Font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fonts.map((f) => (
                                        <SelectItem key={f.value} value={f.value} className={f.value}>
                                            {f.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Category Selector */}
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-[160px] bg-white border-stone-200 text-stone-800">
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

                            <div className="flex items-center gap-2 ml-2">
                                <input
                                    type="checkbox"
                                    id="anonymous"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                    className="rounded border-stone-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="anonymous" className="text-stone-600 cursor-pointer">Anonymous</Label>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={onClose} className="text-stone-500 hover:text-stone-800">Cancel</Button>
                            <Button onClick={handleSubmit} className="bg-stone-800 text-stone-50 hover:bg-stone-700 gap-2">
                                <Send size={16} /> Send
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Row: Spotify Input */}
                    <div className="w-full relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                            <Music size={16} />
                        </div>
                        <Input
                            placeholder="Paste a Spotify song link to set the mood..."
                            value={spotifyLink}
                            onChange={(e) => setSpotifyLink(e.target.value)}
                            className="pl-10 bg-white border-stone-200 text-stone-800 placeholder:text-stone-400 w-full"
                        />
                    </div>
                </div>

                {/* Letter Content */}
                <div className={cn("p-8 md:p-12 max-w-2xl mx-auto w-full space-y-8", font)}>

                    {/* Anonymous Hint */}
                    {isAnonymous && (
                        <div className="bg-stone-100 border border-stone-200 rounded-lg p-4 flex gap-3 text-stone-600 text-sm font-sans mb-8">
                            <AlertCircle size={20} className="shrink-0" />
                            <p>You are writing anonymously. Your name will be hidden, but your words will still be felt. Please write with kindness.</p>
                        </div>
                    )}

                    {/* Header: Sender & Date */}
                    <div className="space-y-1 text-stone-600 text-sm">
                        <p className="font-bold text-stone-800">{isAnonymous ? 'Anonymous Writer' : (user?.name || 'Your Name')}</p>
                        <p>123 Letter Lane</p>
                        <p>City of Writers, WL 99999</p>
                        <p className="pt-4">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {/* Recipient Info */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="Recipient Name (e.g. Dr. Patricia Brown)"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                className="border-none bg-transparent p-0 h-auto text-stone-900 placeholder:text-stone-400 focus-visible:ring-0 text-base font-bold rounded-none"
                            />
                            <Textarea
                                placeholder="Recipient Address..."
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                className="border-none bg-transparent p-0 min-h-[60px] text-stone-800 placeholder:text-stone-400 focus-visible:ring-0 resize-none text-sm rounded-none"
                            />
                        </div>
                    </div>

                    {/* Salutation */}
                    <div className="flex items-center gap-2">
                        <span className="text-stone-800">Dear</span>
                        <Input
                            placeholder="Name"
                            value={recipientName.split(' ')[0]}
                            readOnly
                            className="border-none bg-transparent p-0 h-auto w-full focus-visible:ring-0 font-bold text-stone-900 pointer-events-none placeholder:text-stone-400"
                        />
                        <span className="text-stone-800">,</span>
                    </div>

                    {/* Body */}
                    <Textarea
                        placeholder="Start writing your letter here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[300px] border-none bg-transparent p-0 focus-visible:ring-0 resize-none text-stone-900 leading-relaxed text-lg placeholder:text-stone-400 rounded-none"
                    />

                    {/* Closing */}
                    <div className="space-y-4 pt-8">
                        <p>Kind regards,</p>
                        <p className="font-bold text-xl signature">{isAnonymous ? 'A Friend' : (user?.name || 'Me')}</p>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LetterEditorModal;
