
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Send, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import socketService from '../services/socketService';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { cn, getImageUrl } from '../lib/utils'; // Keep getImageUrl if needed, or remove if unused

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    otherUser: {
        id: number;
        username: string;
        avatar?: string;
    } | null;
}

interface Message {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    isRead: boolean;
    createdAt: string;
    sender: {
        id: number;
        username: string;
        avatar?: string;
    };
}

const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose, otherUser }) => {
    const user = useAuthStore((state) => state.user);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && otherUser) {
            fetchMessages();
            scrollToBottom();
        }
    }, [isOpen, otherUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Listen for incoming messages
        const handleNewMessage = (message: Message) => {
            if (
                (message.senderId === otherUser?.id && message.receiverId === user?.id) ||
                (message.senderId === user?.id && message.receiverId === otherUser?.id)
            ) {
                setMessages((prev) => [...prev, message]);
            }
        };

        socketService.onNewMessage(handleNewMessage);

        return () => {
            socketService.offNewMessage();
        };
    }, [otherUser, user]);

    const fetchMessages = async () => {
        if (!otherUser) return;
        try {
            const response = await axios.get(`http://localhost:5000/api/messages/${otherUser.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !otherUser) return;

        try {
            await axios.post('http://localhost:5000/api/messages/send', {
                receiverId: otherUser.id,
                content: newMessage
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            // Optimistic update not strictly needed as socket will return the message,
            // but we can append it if we want instant feedback before server confirms.
            // For now rely on socket or re-fetch. 
            // Actually, let's append it manually to be "lively" immediately if socket delay.
            // But wait, the socket emits to the receiver. Does it emit to SENDER?
            // The controller: io.to(`user_${receiverId}`).emit...
            // It does NOT emit to sender. So we MUST append it manually or have controller emit to sender too.
            // Let's append manually here for now, or fetch the response.
            // The controller returns the message. 

            // Let's assume we get the message back from the POST request
            // const response = ...
            // Actually, let's fetch messages again or update state with response.

            // Revisiting handleSendMessage...
        } catch (error) {
            console.error('Error sending message:', error);
        }

        // Reset input immediately
        setNewMessage('');
    };

    // Better handleSendMessage
    const handleSendMessageImproved = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !otherUser) return;

        const content = newMessage;
        setNewMessage(''); // Clear input immediately

        try {
            const response = await axios.post('http://localhost:5000/api/messages/send', {
                receiverId: otherUser.id,
                content: content
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            // Append sent message to state
            setMessages((prev) => [...prev, response.data]);
        } catch (error) {
            console.error('Error sending message:', error);
            // Optionally restore input or show error
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-stone-100 flex-row items-center gap-3 space-y-0">
                    <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center">
                        {otherUser?.avatar ? (
                            <img src={getImageUrl(otherUser.avatar)} alt={otherUser.username} className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="text-stone-400" size={20} />
                        )}
                    </div>
                    <DialogTitle className="text-lg font-serif">{otherUser?.username}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fdfbf7]">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-50">
                            <Send size={48} className="mb-2" />
                            <p>Start a conversation</p>
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                <div
                                    className={cn(
                                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                        isMe
                                            ? "bg-stone-800 text-white rounded-tr-none"
                                            : "bg-white text-stone-800 border border-stone-100 rounded-tl-none"
                                    )}
                                >
                                    <p>{msg.content}</p>
                                    <p className={cn("text-[10px] mt-1 opacity-70", isMe ? "text-stone-300" : "text-stone-400")}>
                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-stone-100">
                    <form onSubmit={handleSendMessageImproved} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-stone-100 border-none rounded-full px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-full w-10 h-10 shrink-0"
                            disabled={!newMessage.trim()}
                        >
                            <Send size={18} />
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MessageModal;
