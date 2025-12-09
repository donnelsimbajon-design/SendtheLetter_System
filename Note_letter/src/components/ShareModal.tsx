import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Search, Send, Repeat, Check, User as UserIcon, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getImageUrl } from '../lib/utils';
import axios from 'axios';
import { Note } from '../types/note';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: Note;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, note }) => {
    const user = useAuthStore((state) => state.user);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [sentTo, setSentTo] = useState<number[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchFriends();
        }
    }, [isOpen]);

    const fetchFriends = async () => {
        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/friends', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Filter results based on search query
    const filteredResults = searchResults.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSendMessage = async (receiverId: number) => {
        try {
            const token = localStorage.getItem('token');
            const content = `Shared a letter: "${note.title || 'A Letter'}"\n\n${note.content.substring(0, 100)}...`;

            await axios.post('http://localhost:5000/api/messages/send', {
                receiverId,
                content
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSentTo(prev => [...prev, receiverId]);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background border border-border shadow-2xl">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        <Send size={18} className="text-primary" /> Share Letter
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Search for friends and share this letter with them.
                    </DialogDescription>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 min-h-[300px] flex flex-col">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search friends..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-muted/50 rounded-lg border border-transparent focus:border-primary/20 focus:bg-background focus:outline-none transition-all text-sm"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        {isSearching ? (
                            <div className="text-center py-8 text-muted-foreground animate-pulse">Loading friends...</div>
                        ) : filteredResults.length > 0 ? (
                            filteredResults.map((resultUser) => (
                                <div key={resultUser.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-all group border border-transparent hover:border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border">
                                            {resultUser.avatar ? (
                                                <img src={getImageUrl(resultUser.avatar)} alt={resultUser.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                                    {resultUser.username?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-foreground">{resultUser.username}</p>
                                            <p className="text-xs text-muted-foreground">{resultUser.location || 'Friend'}</p>
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant={sentTo.includes(resultUser.id) ? "outline" : "default"}
                                        disabled={sentTo.includes(resultUser.id)}
                                        onClick={() => handleSendMessage(resultUser.id)}
                                        className={`h-8 px-4 rounded-full transition-all ${sentTo.includes(resultUser.id) ? 'border-primary/20 text-primary bg-primary/5' : 'hover:scale-105'}`}
                                    >
                                        {sentTo.includes(resultUser.id) ? (
                                            <>Sent <Check size={14} className="ml-1" /></>
                                        ) : (
                                            <>Send</>
                                        )}
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground space-y-2 opacity-60">
                                <UserIcon size={32} strokeWidth={1.5} />
                                <p className="text-sm font-medium">No friends found.</p>
                                <p className="text-xs">Add friends from their profile to share!</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ShareModal;
