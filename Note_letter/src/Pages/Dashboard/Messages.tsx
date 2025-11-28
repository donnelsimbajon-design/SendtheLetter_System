import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { Send, User } from 'lucide-react';
import { format } from 'date-fns';

const Messages = () => {
    const { messages, sendMessage } = useChatStore();
    const [newMessage, setNewMessage] = useState('');

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        sendMessage({
            id: crypto.randomUUID(),
            senderId: 'current-user',
            receiverId: 'other-user',
            content: newMessage,
            timestamp: new Date(),
        });
        setNewMessage('');
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User size={20} />
                </div>
                <div>
                    <h3 className="font-semibold">John Doe</h3>
                    <p className="text-xs text-muted-foreground">Online</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] p-3 rounded-lg ${msg.senderId === 'current-user'
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-muted text-foreground rounded-bl-none'
                                }`}
                        >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.senderId === 'current-user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {format(new Date(msg.timestamp), 'HH:mm')}
                            </p>
                        </div>
                    </div>
                ))}
                {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        No messages yet. Start a conversation!
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-muted px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                    type="submit"
                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default Messages;
