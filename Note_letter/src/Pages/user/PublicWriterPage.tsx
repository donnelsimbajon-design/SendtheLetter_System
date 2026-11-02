import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import UserProfilePage from './UserProfilePage';
import CharacterBadge from '../../components/CharacterBadge';

/** A public, read-only writer profile. Private letters stay in the signed-in workspace. */
export default function PublicWriterPage() {
    const loggedIn = useAuthStore(state => state.isAuthenticated);

    return <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
            <div className="mx-auto flex min-h-[72px] max-w-[1250px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <Link to="/" aria-label="SendTheLetter home" className="inline-flex min-w-0 items-center">
                    <img src="/sendtheletter-logo.svg" width="180" height="48" alt="SendTheLetter" className="h-11 w-[145px] object-contain object-left sm:w-[180px]" />
                </Link>
                <nav aria-label="Writer profile navigation" className="flex items-center gap-2">
                    <Link to={loggedIn ? '/dashboard/community' : '/'} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-bold hover:bg-muted sm:px-4">
                        <CharacterBadge name="basa" tone="paper" size="xs" />
                        <span className="hidden sm:inline">{loggedIn ? 'Community' : 'Home'}</span><span className="sm:hidden">Back</span>
                    </Link>
                    <Link to={loggedIn ? '/dashboard/profile' : '/login'} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 sm:px-4">
                        <CharacterBadge name="lumi" tone="paper" size="xs" />
                        {loggedIn ? 'My space' : 'Sign in'}
                    </Link>
                </nav>
            </div>
        </header>
        <main id="main-content" className="mx-auto max-w-[1250px] px-4 pb-12 pt-7 sm:px-6">
            <UserProfilePage />
        </main>
        <footer className="flex items-center justify-center gap-2 border-t border-border bg-card px-5 py-7 text-center text-xs text-muted-foreground">
            <CharacterBadge name="sely" tone="paper" size="xs" />
            Stories shared with care on SendTheLetter.
        </footer>
    </div>;
}
