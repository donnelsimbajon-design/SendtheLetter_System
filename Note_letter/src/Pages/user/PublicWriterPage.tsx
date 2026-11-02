import { Link } from 'react-router-dom';
import { BookHeart, ArrowLeft, Feather, LogIn, UserRound } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import UserProfilePage from './UserProfilePage';

/** Public, read-only writer profile entrypoint. Private library lives in /dashboard. */
export default function PublicWriterPage() {
    const loggedIn = useAuthStore(state => state.isAuthenticated);
    return <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
            <div className="mx-auto flex h-[72px] max-w-[1250px] items-center justify-between gap-3 px-4 sm:px-6">
                <Link to="/" className="inline-flex items-center gap-2.5 font-editorial text-lg font-semibold sm:text-xl"><span className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-primary text-primary-foreground"><BookHeart size={21} /></span> SendTheLetter</Link>
                <div className="flex items-center gap-2">
                    <Link to={loggedIn ? '/dashboard/community' : '/'} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2.5 text-xs font-bold hover:bg-muted sm:px-4"><ArrowLeft size={15} /><span className="hidden sm:inline">{loggedIn ? 'Community' : 'Home'}</span><span className="sm:hidden">Back</span></Link>
                    <Link to={loggedIn ? '/dashboard/profile' : '/login'} className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 sm:px-4">{loggedIn ? <UserRound size={16} /> : <LogIn size={16} />}{loggedIn ? 'My profile' : 'Sign in'}</Link>
                </div>
            </div>
        </header>
        <div className="mx-auto max-w-[1250px] px-4 pb-12 pt-7 sm:px-6">
            <UserProfilePage />
        </div>
        <footer className="flex items-center justify-center gap-2 border-t border-border bg-card py-7 text-xs text-muted-foreground"><Feather size={14} /> Stories shared with care on SendTheLetter.</footer>
    </div>;
}
