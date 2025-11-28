import { NavLink } from 'react-router-dom';
import { LayoutDashboard, StickyNote, MessageSquare, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

const Sidebar = () => {
    const logout = useAuthStore((state) => state.logout);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: StickyNote, label: 'Notes', path: '/dashboard/notes' },
        { icon: MessageSquare, label: 'Messages', path: '/dashboard/messages' },
        { icon: User, label: 'Profile', path: '/dashboard/profile' },
    ];

    return (
        <div className="h-screen w-64 bg-background border-r border-border/50 flex flex-col">
            <div className="p-6 flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                <h1 className="text-xl font-serif font-bold text-foreground tracking-wide">SentTheLetter</h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-border">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
