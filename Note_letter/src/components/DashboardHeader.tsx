import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, User, MessageSquare, Search, Bell } from 'lucide-react';
import { Input } from './ui/input';
import { useAuthStore } from '../store/authStore';
import { useNoteStore } from '../store/noteStore';
import ProfileDropdown from './ProfileDropdown';
import { formatDistanceToNow } from 'date-fns';
import socketService from '../services/socketService';
import { getImageUrl } from '../lib/utils';

const DashboardHeader = () => {
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const { notifications, fetchNotifications, markNotificationsRead } = useNoteStore();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    useEffect(() => {
        fetchNotifications();

        // Listen for real-time notifications
        socketService.onNewNotification((newNotification) => {
            console.log('New notification received:', newNotification);
            fetchNotifications();
        });

        return () => {
            socketService.offNewNotification();
        };
    }, [fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const toggleNotifications = () => {
        if (!isNotificationOpen) {
            setIsNotificationOpen(true);
            if (unreadCount > 0) markNotificationsRead();
        } else {
            setIsNotificationOpen(false);
        }
    };

    const isActive = (path: string) => {
        return location.pathname === path ? 'text-primary border-b-4 border-primary' : 'text-muted-foreground hover:bg-accent/50 rounded-lg';
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border/50 z-50 flex items-center justify-between px-4 shadow-sm">
            {/* Left: Logo & Search */}
            <div className="flex items-center gap-4 w-1/4">
                <Link to="/dashboard">
                    <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                </Link>
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
                    <Input
                        placeholder="Search Letters"
                        className="pl-10 h-10 w-64 rounded-full bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                </div>
            </div>

            {/* Center: Navigation */}
            <nav className="flex items-center justify-center gap-2 md:gap-10 flex-1 h-full">
                <Link to="/dashboard" className={`h-full px-4 md:px-10 flex items-center justify-center transition-all ${isActive('/dashboard')}`}>
                    <Home size={24} strokeWidth={isActive('/dashboard').includes('text-primary') ? 3 : 2} />
                </Link>
                <Link to="/dashboard/notes" className={`h-full px-4 md:px-10 flex items-center justify-center transition-all ${isActive('/dashboard/notes')}`}>
                    <FileText size={24} strokeWidth={isActive('/dashboard/notes').includes('text-primary') ? 3 : 2} />
                </Link>
                <Link to="/dashboard/profile" className={`h-full px-4 md:px-10 flex items-center justify-center transition-all ${isActive('/dashboard/profile')}`}>
                    <User size={24} strokeWidth={isActive('/dashboard/profile').includes('text-primary') ? 3 : 2} />
                </Link>
            </nav>

            {/* Right: Actions & Profile */}
            <div className="flex items-center justify-end gap-2 w-1/4 relative">
                <Link to="/dashboard/messages" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors text-stone-700">
                    <MessageSquare size={20} />
                </Link>

                <div className="relative">
                    <button
                        onClick={toggleNotifications}
                        className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors relative"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card" />
                        )}
                    </button>

                    {isNotificationOpen && (
                        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden z-50">
                            <div className="p-3 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                                <h3 className="font-medium text-sm text-stone-900">Notifications</h3>
                                {unreadCount > 0 && <span className="text-xs text-stone-500">{unreadCount} new</span>}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-stone-500 text-sm">
                                        No notifications yet
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className="p-3 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0">
                                            <p className="text-sm text-stone-800 leading-snug">
                                                <span className="font-bold">{n.actor?.username || 'Someone'}</span>
                                                {n.type === 'like' ? ' liked your letter ' : ' commented on your letter '}
                                                <span className="font-medium">"{n.letter?.title || 'Untitled'}"</span>
                                            </p>
                                            <p className="text-xs text-stone-400 mt-1">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative ml-2">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-border hover:opacity-80 transition-opacity relative"
                    >
                        {user?.avatar ? (
                            <img
                                src={getImageUrl(user.avatar)}
                                alt={user.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="font-bold text-primary">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-card rounded-full flex items-center justify-center z-10">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
                        </div>
                    </button>

                    {/* Dropdown */}
                    <ProfileDropdown isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
