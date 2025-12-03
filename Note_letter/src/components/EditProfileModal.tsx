import { useState } from 'react';
import { X, Upload, Camera } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: user?.username || '',
        bio: user?.bio || '',
        location: user?.location || '',
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '');
    const [coverPreview, setCoverPreview] = useState<string>(user?.coverImage || '');

    if (!isOpen) return null;

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('username', formData.username);
            formDataToSend.append('bio', formData.bio);
            formDataToSend.append('location', formData.location);

            if (avatarFile) {
                formDataToSend.append('avatar', avatarFile);
            }
            if (coverFile) {
                formDataToSend.append('coverImage', coverFile);
            }

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formDataToSend,
            });

            const resData = await response.json();

            if (!response.ok) {
                console.error('Server error response:', resData);
                alert(`Error: ${resData.message}\nDetails: ${resData.error || 'No details'}`);
                throw new Error(resData.message);
            }

            // Update local storage and state
            localStorage.setItem('user', JSON.stringify(resData.user));
            alert('Profile updated successfully!');

            // Reload to show new images
            window.location.reload();
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            alert(`Failed to update profile: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-light mb-8 text-center">Edit Profile</h2>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Images Section */}
                        <div className="space-y-6">
                            {/* Cover Image */}
                            <div className="relative h-32 rounded-2xl overflow-hidden group border border-white/10">
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                        <span className="text-sm text-muted-foreground">No cover image</span>
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                    <div className="flex items-center gap-2 text-white font-medium">
                                        <Upload size={18} /> Change Cover
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                                </label>
                            </div>

                            {/* Avatar - Floating over cover */}
                            <div className="relative -mt-16 mx-auto w-24 h-24">
                                <div className="w-full h-full rounded-full overflow-hidden border-4 border-background shadow-xl relative group">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-primary">{formData.username?.[0]?.toUpperCase()}</span>
                                        </div>
                                    )}
                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                        <Camera size={20} className="text-white" />
                                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</label>
                                <Input
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="bg-white/5 border-transparent focus:border-primary/50 h-12 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    rows={3}
                                    className="w-full bg-white/5 border border-transparent focus:border-primary/50 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 resize-none"
                                    placeholder="Tell your story..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="bg-white/5 border-transparent focus:border-primary/50 h-12 rounded-xl"
                                    placeholder="e.g., San Francisco, CA"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20">
                                {loading ? 'Saving Changes...' : 'Save Profile'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
