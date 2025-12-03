import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { Send, User, Search, MoreVertical, Phone, Video, Smile, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Mock contacts data
const mockContacts = [
    { id: '1', name: 'John Doe', lastMessage: 'Hey, how are you?', timestamp: new Date(), avatar: null, online: true },
    { id: '2', name: 'Jane Smith', lastMessage: 'See you tomorrow!', timestamp: new Date(Date.now() - 3600000), avatar: null, online: false },
    { id: '3', name: 'Mike Johnson', lastMessage: 'Thanks for the help', timestamp: new Date(Date.now() - 7200000), avatar: null, online: true },
];

const Messages = () => {
    const { messages, sendMessage } = useChatStore();
    const [newMessage, setNewMessage] = useState('');
    const [selectedContact, setSelectedContact] = useState(mockContacts[0]);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        sendMessage({
            id: crypto.randomUUID(),
            senderId: 'current-user',
            receiverId: selectedContact.id,
            content: newMessage,
            timestamp: new Date(),
        });
        setNewMessage('');
    };

    const filteredContacts = mockContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-4">
            {/* Contacts Sidebar */}
            <div className="w-80 bg-card/50 backdrop-blur-sm rounded-2xl border border-white/5 flex flex-col overflow-hidden">
                {/* Search Header */}
                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background/50 rounded-lg border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredContacts.map((contact) => (
                        <motion.button
                            key={contact.id}
                            onClick={() => setSelectedContact(contact)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full p-4 flex items-center gap-3 border-b border-white/5 transition-colors ${selectedContact.id === contact.id
                                    ? 'bg-primary/10 border-l-4 border-l-primary'
                                    : 'hover:bg-white/5'
                                }`}
                        >
                            <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center">
                                    <User size={24} className="text-primary" />
                                </div>
                                {contact.online && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-sm truncate">{contact.name}</h4>
                                    <span className="text-xs text-muted-foreground">
                                        {format(contact.timestamp, 'HH:mm')}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-card/30 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-card/50">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center">
                                <User size={20} className="text-primary" />
                            </div>
                            {selectedContact.online && (
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold">{selectedContact.name}</h3>
                            <p className="text-xs text-muted-foreground">
                                {selectedContact.online ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <Phone size={20} className="text-muted-foreground" />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <Video size={20} className="text-muted-foreground" />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <MoreVertical size={20} className="text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-black/5">
                    <AnimatePresence>
                        {messages.map((msg, index) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex ${msg.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] ${msg.senderId === 'current-user'
                                            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl rounded-br-md'
                                            : 'bg-white/10 backdrop-blur-md text-foreground rounded-2xl rounded-bl-md border border-white/10'
                                        } px-4 py-2.5 shadow-lg`}
                                >
                                    <p className="leading-relaxed">{msg.content}</p>
                                    <p
                                        className={`text-xs mt-1 ${msg.senderId === 'current-user'
                                                ? 'text-primary-foreground/70 text-right'
                                                : 'text-muted-foreground text-right'
                                            }`}
                                    >
                                        {format(new Date(msg.timestamp), 'HH:mm')}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Send className="text-muted-foreground" size={32} />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                            <p className="text-sm">Start a conversation with {selectedContact.name}!</p>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-card/50">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground"
                        >
                            <Paperclip size={20} />
                        </button>
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full bg-background/50 px-4 py-3 pr-12 rounded-xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Smile size={20} />
                            </button>
                        </div>
                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50"
                            disabled={!newMessage.trim()}
                        >
                            <Send size={20} />
                        </motion.button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Messages;
