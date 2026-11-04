import WorldScene3D from '../../components/WorldScene3D';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import UserProfilePage from './UserProfilePage';
import CharacterBadge from '../../components/CharacterBadge';

/** A public, read-only writer profile. Private letters stay in the signed-in workspace. */
export default function PublicWriterPage() {
    const loggedIn = useAuthStore(state => state.isAuthenticated);

    return <div className="min-h-screen bg-background text-foreground">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-primary-foreground">Skip to main content</a>
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
            <div className="mx-auto flex min-h-[72px] max-w-[1250px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <Link to="/" aria-label="SendTheLetter home" className="inline-flex min-w-0 items-center">
                    <img src="/sendtheletter-logo.svg" width="180" height="48" alt="SendTheLetter" className="h-11 w-[145px] object-contain object-left sm:w-[180px]" />
                </Link>
                <nav aria-label="Writer profile navigation" className="flex items-center gap-2">
                    <Link to={loggedIn ? '/dashboard/community' : '/'} aria-label={loggedIn ? 'Back to community' : 'Back home'} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-bold hover:bg-muted sm:px-4">
                        <CharacterBadge name="basa" tone="paper" size="xs" />
                        <span className="hidden sm:inline">{loggedIn ? 'Community' : 'Home'}</span><span className="sr-only sm:hidden">Back</span>
                    </Link>
                    <Link to={loggedIn ? '/dashboard/profile' : '/login'} aria-label={loggedIn ? 'My space' : 'Sign in'} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 sm:px-4">
                        <CharacterBadge name="lumi" tone="paper" size="xs" />
                        <span className="hidden sm:inline">{loggedIn ? 'My space' : 'Sign in'}</span>
                    </Link>
                </nav>
            </div>
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1250px] px-4 pb-12 pt-7 sm:px-6">
            <WorldScene3D kind="profile" title="3D writer stories world" className="mb-6 h-[200px]" />
            <UserProfilePage />
            {!loggedIn && <aside className="mt-10 flex flex-col items-start justify-between gap-5 rounded-[1.8rem] bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:p-8">
                <div className="flex items-start gap-4"><CharacterBadge name="lumi" tone="paper" size="lg" /><div><h2 className="font-editorial text-2xl sm:text-3xl">Every writer starts somewhere.</h2><p className="mt-2 max-w-lg text-sm leading-6 opacity-85">Read a story that moved you? There is room here for your own words, too.</p></div></div>
                <Link to="/signup" className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-[hsl(var(--surface-gold))] px-6 py-3 text-sm font-bold text-[#493D2A]">Write your first letter</Link>
            </aside>}
        </main>
        <footer className="flex items-center justify-center gap-2 border-t border-border bg-card px-5 py-7 text-center text-xs text-muted-foreground">
            <CharacterBadge name="sely" tone="paper" size="xs" />
            Stories shared with care on SendTheLetter.
        </footer>
    </div>;
}
