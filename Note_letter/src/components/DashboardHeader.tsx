import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, User, MessageSquare, Search, Bell, Grid } from 'lucide-react';
import { Input } from './ui/input';
import { useAuthStore } from '../store/authStore';
import ProfileDropdown from './ProfileDropdown';

const DashboardHeader = () => {
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

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
                        placeholder="Search Facebook"
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
                <Link to="/dashboard/messages" className={`h-full px-4 md:px-10 flex items-center justify-center transition-all ${isActive('/dashboard/messages')}`}>
                    <MessageSquare size={24} strokeWidth={isActive('/dashboard/messages').includes('text-primary') ? 3 : 2} />
                </Link>
                <Link to="/dashboard/profile" className={`h-full px-4 md:px-10 flex items-center justify-center transition-all ${isActive('/dashboard/profile')}`}>
                    <User size={24} strokeWidth={isActive('/dashboard/profile').includes('text-primary') ? 3 : 2} />
                </Link>
            </nav>

            {/* Right: Actions & Profile */}
            <div className="flex items-center justify-end gap-2 w-1/4 relative">
                <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                    <Grid size={20} />
                </button>
                <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                    <MessageSquare size={20} />
                </button>
                <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                    <Bell size={20} />
                </button>

                <div className="relative ml-2">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-border hover:opacity-80 transition-opacity"
                    >
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-primary">{user?.name?.[0] || 'U'}</span>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-card rounded-full flex items-center justify-center">
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
