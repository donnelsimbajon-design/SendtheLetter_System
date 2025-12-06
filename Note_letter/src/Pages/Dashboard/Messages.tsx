
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, User, Search, Phone, Video, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import socketService from '../../services/socketService';
import axios from 'axios';
import { getImageUrl } from '../../lib/utils';
import { cn } from '../../lib/utils'; // Try to import cn if available, or just use template literals

// Fallback cn if not available
const classNames = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

interface Conversation {
    user: {
        id: number;
        username: string;
        avatar?: string;
        location?: string;
    };
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    isOnline?: boolean;
}

interface Message {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    isRead: boolean;
    createdAt: string;
    sender?: {
        id: number;
        username: string;
        avatar?: string;
    };
}

const Messages = () => {
    const user = useAuthStore((state) => state.user);
    const [searchParams] = useSearchParams();
    const initialUserId = searchParams.get('userId');

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedUser, setSelectedUser] = useState<Conversation['user'] | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingConvos, setIsLoadingConvos] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch conversations on mount
    useEffect(() => {
        fetchConversations();

        // Listen for new messages globally to update conversation list
        const handleNewMessage = (message: any) => {
            // Update conversation list logic would go here
            // For now, simplest is to refetch, or optimistically update
            fetchConversations();

            // If message belongs to current chat, append it
            if (selectedUser && (message.senderId === selectedUser.id || message.receiverId === selectedUser.id)) {
                setMessages((prev) => {
                    // dedupe just in case
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            }
        };

        socketService.onNewMessage(handleNewMessage);

        return () => {
            socketService.offNewMessage();
        };
    }, [selectedUser]); // Dependency on selectedUser to know if we should append

    const fetchConversations = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/messages/conversations', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setConversations(response.data);
            setIsLoadingConvos(false);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            setIsLoadingConvos(false);
        }
    };

    // Handle initial user selection from URL
    // Handle initial user selection from URL
    useEffect(() => {
        const initChat = async () => {
            if (initialUserId && !selectedUser) {
                // Check if user is already in conversations
                const existingConvo = conversations.find(c => c.user.id === parseInt(initialUserId));
                if (existingConvo) {
                    setSelectedUser(existingConvo.user);
                } else {
                    // Fetch user details if not in convos (new chat)
                    try {
                        const response = await axios.get(`http://localhost:5000/api/users/id/${initialUserId}`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        });

                        if (response.data) {
                            setSelectedUser(response.data);
                        }
                    } catch (e) {
                        console.error("User not found by ID", e);
                    }
                }
            }
        };

        if (!isLoadingConvos) {
            initChat();
        }
    }, [initialUserId, conversations, isLoadingConvos]);

    // Fetch messages when a user is selected
    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id);
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async (otherUserId: number) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/messages/${otherUserId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setMessages(response.data);

            // Mark as read (optional, can be separate call)
            await axios.post('http://localhost:5000/api/messages/read', {
                senderId: otherUserId
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            // Update convos unread count locally
            setConversations(prev => prev.map(c =>
                c.user.id === otherUserId ? { ...c, unreadCount: 0 } : c
            ));

        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        const content = newMessage;
        setNewMessage('');

        try {
            const response = await axios.post('http://localhost:5000/api/messages/send', {
                receiverId: selectedUser.id,
                content
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setMessages((prev) => [...prev, response.data]);

            // Re-fetch conversations to update last message snippet
            fetchConversations();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-4rem)] flex gap-0 md:gap-4 md:p-4 bg-background">
            {/* Contacts Sidebar */}
            <div className={classNames(
                "w-full md:w-80 bg-card/50 backdrop-blur-sm md:rounded-2xl border-r md:border border-border/50 flex flex-col overflow-hidden",
                selectedUser ? "hidden md:flex" : "flex"
            )}>
                {/* Search Header */}
                <div className="p-4 border-b border-border/50">
                    <h2 className="text-xl font-bold mb-4 px-1">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-muted/50 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                    </div>
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 && !isLoadingConvos && (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            <p>No conversations found.</p>
                        </div>
                    )}
                    {filteredConversations.map((convo) => (
                        <button
                            key={convo.user.id}
                            onClick={() => setSelectedUser(convo.user)}
                            className={classNames(
                                "w-full p-4 flex items-center gap-3 border-b border-border/40 transition-colors hover:bg-muted/50",
                                selectedUser?.id === convo.user.id ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                            )}
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-border">
                                    {convo.user.avatar ? (
                                        <img src={getImageUrl(convo.user.avatar)} alt={convo.user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-muted-foreground" />
                                    )}
                                </div>
                                {convo.isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-sm truncate">{convo.user.username}</h4>
                                    <span className="text-xs text-muted-foreground/70">
                                        {convo.lastMessageTime ? format(new Date(convo.lastMessageTime), 'HH:mm') : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <p className={classNames(
                                        "text-xs truncate flex-1",
                                        convo.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                                    )}>
                                        {convo.lastMessage || 'Sent an attachment'}
                                    </p>
                                    {convo.unreadCount > 0 && (
                                        <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                                            {convo.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            {selectedUser ? (
                <div className="flex-1 flex flex-col bg-card/30 backdrop-blur-sm md:rounded-2xl md:border border-border/50 overflow-hidden h-full">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <button className="md:hidden" onClick={() => setSelectedUser(null)}>
                                <span className="text-xl">←</span>
                            </button>
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                    {selectedUser.avatar ? (
                                        <img src={getImageUrl(selectedUser.avatar)} alt={selectedUser.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-muted-foreground" />
                                    )}
                                </div>
                                {selectedUser.isOnline && (
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold">{selectedUser.username}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {selectedUser.location || 'Online'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Actions (Phone/Video) could go here */}
                            <button className="p-2 hover:bg-muted rounded-full transition-colors">
                                <MoreVertical size={20} className="text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <Send size={48} className="mb-4" />
                                <p>Start the conversation!</p>
                            </div>
                        )}
                        {messages.map((msg, index) => {
                            const isMe = msg.senderId === user?.id;
                            const showAvatar = !isMe && (index === 0 || messages[index - 1].senderId !== msg.senderId);

                            return (
                                <motion.div
                                    key={msg.id || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!isMe && (
                                        <div className="w-8 h-8 shrink-0 pb-1">
                                            {showAvatar && (
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border border-border">
                                                    {msg.sender?.avatar ? (
                                                        <img src={getImageUrl(msg.sender.avatar)} alt="avatar" className="w-full h-full object-cover" />
                                                    ) : selectedUser.avatar ? ( // Fallback to selected user avatar if message sender info missing
                                                        <img src={getImageUrl(selectedUser.avatar)} alt="avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><User size={12} /></div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div
                                        className={classNames(
                                            "max-w-[75%] px-4 py-2.5 shadow-sm text-sm relative group",
                                            isMe
                                                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                                : "bg-card border border-border/50 text-foreground rounded-2xl rounded-tl-sm"
                                        )}
                                    >
                                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        <p className={classNames(
                                            "text-[10px] mt-1 text-right opacity-70",
                                            isMe ? "text-primary-foreground" : "text-muted-foreground"
                                        )}>
                                            {format(new Date(msg.createdAt), 'HH:mm')}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 border-t border-border/50 bg-card/50">
                        <div className="flex items-center gap-3">
                            <button type="button" className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                                <Paperclip size={20} />
                            </button>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-muted/50 px-4 py-3 pr-10 rounded-full border-none focus:outline-none focus:ring-1 focus:ring-primary/30 text-sm text-foreground placeholder:text-muted-foreground"
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <Smile size={20} />
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-3 bg-primary text-primary-foreground rounded-full hover:shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                <Send size={20} className="ml-0.5" />
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50 text-muted-foreground">
                    <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                        <Send size={40} className="text-muted-foreground/50 ml-2" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
                    <p>Select a contact to start chatting</p>
                </div>
            )
            }
        </div >
    );
};

export default Messages;
