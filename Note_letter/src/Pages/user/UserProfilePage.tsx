import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNoteStore } from '../../store/noteStore';
import { MapPin, Calendar, UserPlus, UserMinus, Sparkles, PenLine, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import LetterViewModal from '../../components/LetterViewModal';
import Notecard from '../../components/Notecard';
import { Note } from '../../types/note';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { getImageUrl } from '../../lib/utils';

interface UserProfile {
    id: number;
    username: string;
    email: string;
    createdAt: string;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
    bio?: string;
    location?: string;
    avatar?: string;
    coverImage?: string;
}

const UserProfilePage = () => {
    const { username } = useParams<{ username: string }>();
    const currentUser = useAuthStore((state) => state.user);
    const { userPublicLetters, fetchUserPublicLetters } = useNoteStore();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Letters');

    const tabs = ['Letters', 'About', 'Pen Pals'];

    useEffect(() => {
        if (username) {
            fetchProfile();
            fetchUserPublicLetters(username);
        }
    }, [username]);

    const fetchProfile = async () => {
        if (!username) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch(`http://localhost:5000/api/users/profile/${username}`, {
                headers,
            });
            if (!response.ok) throw new Error('Failed to fetch profile');
            const data = await response.json();
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleFollow = async () => {
        if (!currentUser || !profile?.id) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/users/${profile.id}/toggle`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to toggle follow');
            const data = await response.json();

            setProfile(prev => prev ? {
                ...prev,
                isFollowing: data.isFollowing,
                followerCount: data.isFollowing ? prev.followerCount + 1 : prev.followerCount - 1
            } : null);
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    const handleNoteClick = (note: Note) => {
        setSelectedNote(note);
        setIsViewModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <p>User not found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 font-sans selection:bg-primary/20">
            {/* Immersive Cover Section */}
            <div className="relative h-[50vh] w-full overflow-hidden">
                {profile.coverImage ? (
                    <motion.div
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${getImageUrl(profile.coverImage)})` }}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
            </div>

            <div className="container mx-auto px-4 md:px-6 -mt-32 relative z-10">
                <div className="flex flex-col items-center">
                    {/* Minimalist Profile Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center text-center mb-12 w-full max-w-2xl"
                    >
                        <div className="relative mb-6 group">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-background/50 backdrop-blur-sm border border-white/10 shadow-2xl">
                                <div className="w-full h-full rounded-full overflow-hidden relative">
                                    {profile.avatar ? (
                                        <img
                                            src={getImageUrl(profile.avatar)}
                                            alt={profile.username}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                                            <span className="text-5xl font-light text-primary">{profile.username[0].toUpperCase()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60">
                            {profile.username}
                        </h1>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 font-medium tracking-wide">
                            {profile.location && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={14} /> {profile.location}
                                </span>
                            )}
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} /> Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}
                            </span>
                        </div>

                        {profile.bio && (
                            <p className="text-lg text-muted-foreground/80 leading-relaxed max-w-lg font-light">
                                {profile.bio}
                            </p>
                        )}

                        <div className="flex gap-6 mt-8 items-center">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground">{userPublicLetters.length}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Letters</div>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground">{profile.followerCount}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Followers</div>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground">{profile.followingCount}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Following</div>
                            </div>
                        </div>

                        {/* Follow Button */}
                        {currentUser && currentUser.id !== profile?.id && (
                            <div className="mt-8">
                                <Button
                                    onClick={handleToggleFollow}
                                    variant={profile.isFollowing ? "outline" : "default"}
                                    className="rounded-full px-8"
                                >
                                    {profile.isFollowing ? (
                                        <>
                                            <UserMinus className="w-4 h-4 mr-2" />
                                            Unfollow
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Follow
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </motion.div>

                    {/* Minimalist Tabs */}
                    <div className="w-full max-w-4xl mb-10">
                        <div className="flex justify-center items-center gap-8 border-b border-white/5 pb-4 overflow-x-auto scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        text-sm font-medium transition-all duration-300 relative px-2 py-1
                                        ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
                                    `}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-primary"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="w-full max-w-5xl">
                        {activeTab === 'About' ? (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="max-w-2xl mx-auto text-center py-12"
                            >
                                <Sparkles className="w-8 h-8 text-primary/50 mx-auto mb-6" />
                                <h3 className="text-xl font-light mb-4">More About {profile.username}</h3>
                                <p className="text-muted-foreground leading-loose">
                                    {profile.bio || "This user hasn't written a long bio yet."}
                                </p>
                            </motion.div>
                        ) : activeTab === 'Pen Pals' ? (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-center py-20"
                            >
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                                    <PenLine size={32} className="text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-medium mb-2">Pen Pals</h3>
                                <p className="text-muted-foreground">Followers and Following list coming soon.</p>
                            </motion.div>
                        ) : (
                            <>
                                {/* Action Bar */}
                                <div className="flex justify-between items-center mb-8 px-2">
                                    <div className="relative w-full max-w-xs group">
                                        <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            placeholder="Search letters..."
                                            className="w-full bg-transparent border-b border-white/10 py-2 pl-8 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                                        />
                                    </div>
                                </div>

                                {/* Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {userPublicLetters.length > 0 ? (
                                        userPublicLetters.map((note, index) => (
                                            <motion.div
                                                key={note.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <Notecard note={note} onClick={handleNoteClick} />
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center py-20">
                                            <p className="text-muted-foreground font-light text-lg">
                                                No public letters published yet.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <LetterViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                note={selectedNote}
            />
        </div>
    );
};

export default UserProfilePage;
