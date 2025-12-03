import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { X, UserPlus, UserMinus, Mail } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';

interface UserProfile {
    id: number;
    username: string;
    email: string;
    createdAt: string;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
}

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number | null;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, userId }) => {
    const currentUser = useAuthStore((state) => state.user);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile();
        }
    }, [isOpen, userId]);

    const fetchProfile = async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch(`http://localhost:5000/api/users/${userId}/profile`, {
                headers,
            });
            if (!response.ok) throw new Error('Failed to fetch profile');
            const data = await response.json();
            setProfile(data);
            setIsFollowing(data.isFollowing);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleFollow = async () => {
        if (!currentUser || !userId) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/users/${userId}/toggle`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to toggle follow');
            const data = await response.json();
            setIsFollowing(data.isFollowing);
            // Refresh profile to update counts
            fetchProfile();
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    if (!profile && !isLoading) return null;

    const isOwnProfile = currentUser?.id === userId;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogTitle className="sr-only">User Profile</DialogTitle>
                <DialogDescription className="sr-only">Viewing user profile details</DialogDescription>
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                >
                    <X className="h-4 w-4" />
                </button>

                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : profile ? (
                    <div className="space-y-6 pt-6">
                        {/* Profile Header */}
                        <div className="text-center">
                            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary mx-auto mb-4">
                                {profile.username[0].toUpperCase()}
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">{profile.username}</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                <Mail className="inline w-3 h-3 mr-1" />
                                {profile.email}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Member since {format(new Date(profile.createdAt), 'MMM yyyy')}
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground">{profile.followerCount}</div>
                                <div className="text-sm text-muted-foreground">Followers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground">{profile.followingCount}</div>
                                <div className="text-sm text-muted-foreground">Following</div>
                            </div>
                        </div>

                        {/* Follow Button */}
                        {!isOwnProfile && currentUser && (
                            <Button
                                onClick={handleToggleFollow}
                                className="w-full"
                                variant={isFollowing ? "outline" : "default"}
                            >
                                {isFollowing ? (
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
                        )}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
};

export default UserProfileModal;
