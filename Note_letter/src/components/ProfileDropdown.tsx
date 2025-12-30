import { LogOut, Settings, HelpCircle, MessageSquare, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../lib/utils';

interface ProfileDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileDropdown = ({ isOpen, onClose }: ProfileDropdownProps) => {
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div key="backdrop" className="fixed inset-0 z-40" onClick={onClose} />
            )}
            <motion.div
                key="dropdown"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-14 w-80 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden z-50"
            >
                <div className="p-4 border-b border-border/10">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg overflow-hidden">
                            {user?.avatar ? (
                                <img
                                    src={getImageUrl(user.avatar)}
                                    alt={user.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span>{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{user?.username || 'User'}</h4>
                            <p className="text-xs text-muted-foreground">See your profile</p>
                        </div>
                    </div>
                </div>

                <div className="p-2 space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 text-sm font-medium transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Settings size={18} />
                        </div>
                        Settings & Privacy
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 text-sm font-medium transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <HelpCircle size={18} />
                        </div>
                        Help & Support
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 text-sm font-medium transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <MessageSquare size={18} />
                        </div>
                        Give Feedback
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 text-sm font-medium transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <AlertTriangle size={18} />
                        </div>
                        Report a Problem
                    </button>
                </div>

                <div className="p-2 border-t border-border/10">
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-sm font-medium transition-colors text-left"
                    >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                            <LogOut size={18} />
                        </div>
                        Log Out
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProfileDropdown;
