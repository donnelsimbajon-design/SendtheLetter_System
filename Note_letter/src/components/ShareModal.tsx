import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Search, Check, User as UserIcon, Copy, Mail, Facebook, Instagram, Lock } from 'lucide-react';
import CharacterBadge from './CharacterBadge';
import { useAuthStore } from '../store/authStore';
import { getImageUrl } from '../lib/utils';
import axios from 'axios';
import { Note } from '../types/note';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import Mascot from './Mascot';

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
    const [shareFeedback, setShareFeedback] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const isPubliclyShareable = note.isPublic && note.status === 'published' && !!note.shareToken && !note.isArchived;
    const noteOwnerId = note.authorId ?? (note as Note & { userId?: string | number }).userId;
    const canEmail = String(noteOwnerId) === String(user?.id) && note.status === 'published';

    const shareUrl = useMemo(() => {
        if (typeof window === 'undefined') return '';
        const appBaseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        return new URL(`/?s=${encodeURIComponent(String(note.shareToken || ''))}`, appBaseUrl).toString();
    }, [note.shareToken]);

    // Social crawlers need server-rendered Open Graph metadata; human-facing links
    // should always point to the deployed frontend route.
    const socialPreviewUrl = useMemo(() => {
        return new URL(`/api/letters/public/${encodeURIComponent(String(note.shareToken || ''))}/share`, API_BASE_URL).toString();
    }, [note.id]);

    useEffect(() => {
        if (isOpen) fetchFriends();
    }, [isOpen]);

    const fetchFriends = async () => {
        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResults(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching friends:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const filteredResults = searchResults.filter(friend =>
        String(friend.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSendMessage = async (receiverId: number) => {
        if (!isPubliclyShareable) return;
        try {
            const token = localStorage.getItem('token');
            const content = isPubliclyShareable
                ? `Shared a letter: "${note.title || 'A Letter'}"\n${shareUrl}`
                : `Shared a private letter: "${note.title || 'A Letter'}"`;

            await axios.post(`${API_ENDPOINTS.messages}/send`, { receiverId, content }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSentTo(prev => [...prev, receiverId]);
        } catch (error) {
            console.error('Error sending letter message:', error);
            setShareFeedback('Could not send the in-app message. Please try again.');
        }
    };

    const sendEmail = async () => {
        if (!canEmail || !emailAddress.trim()) return;
        setIsSendingEmail(true);
        setShareFeedback('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_ENDPOINTS.letters}/${encodeURIComponent(String(note.id))}/email`, { recipientEmail: emailAddress.trim() }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShareFeedback('Your letter was accepted by the email delivery provider.');
            setEmailAddress('');
        } catch (error: any) {
            setShareFeedback(error?.response?.data?.message || 'Email delivery is unavailable. Check the server email configuration.');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const copyLink = async () => {
        if (!isPubliclyShareable) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareFeedback('Public letter link copied.');
        } catch {
            setShareFeedback('Copy is unavailable in this browser. Try the device share option.');
        }
    };

    const shareNative = async (platform: string) => {
        if (!isPubliclyShareable) return;
        if (navigator.share) {
            try {
                await navigator.share({ title: note.title || 'A letter from SendTheLetter', text: 'I wanted to share this letter with you.', url: shareUrl });
                setShareFeedback(`Share sheet opened for ${platform}.`);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') setShareFeedback('Sharing was not completed. You can copy the link instead.');
            }
        } else {
            setShareFeedback('This browser does not support the device share sheet. Copy the public link instead.');
        }
    };

    const shareFacebook = () => {
        if (!isPubliclyShareable) return;
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(socialPreviewUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const shareEmail = () => {
        if (!isPubliclyShareable) return;
        const subject = encodeURIComponent(note.title || 'A letter from SendTheLetter');
        const body = encodeURIComponent(`I wanted to share this letter with you:\n\n${shareUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background border border-border shadow-2xl">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        <Mascot name="piko" className="h-9 w-9" /> Share Letter
                    </DialogTitle>
                    <DialogDescription className="sr-only">Share a public letter externally or send it to a friend inside SendTheLetter.</DialogDescription>
                </div>

                <div className="p-4 space-y-5 max-h-[75vh] overflow-y-auto">
                    {canEmail && (
                        <section className="space-y-2">
                            <h3 className="font-semibold text-sm">Send this letter by email</h3>
                            <div className="flex gap-2">
                                <input type="email" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} placeholder="recipient@example.com" aria-label="Recipient email address" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <Button type="button" onClick={sendEmail} disabled={!emailAddress.trim() || isSendingEmail} className="gap-2"><Mail size={16} /> {isSendingEmail ? 'Sending…' : 'Send email'}</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">The server sends the letter using its configured email provider. Private letters are sent only after your explicit action as the author.</p>
                        </section>
                    )}

                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">Share outside SendTheLetter</h3>
                            {!isPubliclyShareable && <span className="text-xs text-amber-700 flex items-center gap-1"><Lock size={12} /> Private</span>}
                        </div>
                        {isPubliclyShareable ? (
                            <>
                                <p className="text-xs text-muted-foreground">Only published public letters can be shared with an open link.</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    <Button type="button" variant="outline" onClick={shareEmail} className="justify-start gap-2"><Mail size={16} /> Email</Button>
                                    <Button type="button" variant="outline" onClick={shareFacebook} className="justify-start gap-2"><Facebook size={16} /> Facebook</Button>
                                    <Button type="button" variant="outline" onClick={() => shareNative('Messenger')} className="justify-start gap-2"><CharacterBadge name="chika" tone="paper" size="sm" /> Messenger</Button>
                                    <Button type="button" variant="outline" onClick={() => shareNative('Instagram')} className="justify-start gap-2"><Instagram size={16} /> Instagram</Button>
                                    <Button type="button" variant="outline" onClick={() => shareNative('your device')} className="justify-start gap-2"><CharacterBadge name="piko" tone="paper" size="sm" /> More options</Button>
                                    <Button type="button" variant="outline" onClick={copyLink} className="justify-start gap-2"><Copy size={16} /> Copy link</Button>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">Only published public letters with a secure share token can be shared. Save or refresh the letter if its link is not ready. You can still send an in-app message to a friend.</p>
                        )}
                        {shareFeedback && <p role="status" className="text-xs text-primary">{shareFeedback}</p>}
                    </section>

                    <section className="space-y-3">
                        <div>
                            <h3 className="font-semibold text-sm">Send to a SendTheLetter friend</h3>
                            <p className="text-xs text-muted-foreground">Choose a friend to send an in-app message.</p>
                        </div>
                        <div className="relative">
                            <CharacterBadge name="suri" tone="paper" size="xs" className="absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" placeholder="Search friends..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-muted/50 rounded-lg border border-transparent focus:border-primary/20 focus:bg-background focus:outline-none transition-all text-sm" />
                        </div>
                        <div className="space-y-2">
                            {isSearching ? (
                                <div className="text-center py-6 text-muted-foreground">Loading friends...</div>
                            ) : filteredResults.length > 0 ? (
                                filteredResults.map((resultUser) => (
                                    <div key={resultUser.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl border border-transparent hover:border-border/50">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-muted border border-border">
                                                {resultUser.avatar ? <img src={getImageUrl(resultUser.avatar)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">{resultUser.username?.[0]?.toUpperCase()}</div>}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{resultUser.username}</p>
                                                <p className="text-xs text-muted-foreground truncate">{resultUser.location || 'Friend'}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant={sentTo.includes(resultUser.id) ? 'outline' : 'default'} disabled={!isPubliclyShareable || sentTo.includes(resultUser.id)} onClick={() => handleSendMessage(resultUser.id)} className="h-8 px-4 rounded-full">
                                            {sentTo.includes(resultUser.id) ? <>Sent <Check size={14} className="ml-1" /></> : <>Send</>}
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground space-y-2">
                                    <UserIcon size={28} strokeWidth={1.5} />
                                    <p className="text-sm font-medium">No friends found.</p>
                                    <p className="text-xs">Add friends from their profile to share.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ShareModal;
