import WorldScene3D from '../components/WorldScene3D';
import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import CharacterBadge from '../components/CharacterBadge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import AvatarPicker from '../components/AvatarPicker';

const Signup = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requested = params.get('returnTo') || '';
  const returnTo = /^\/dashboard\/notes\?compose=1(?:&template=(?:gratitude|future-self|apology|hello)|&guest=1)?$/.test(requested) ? requested : '/dashboard';
  const loginLink = returnTo === '/dashboard' ? '/login' : '/login?returnTo=' + encodeURIComponent(returnTo);
  const register = useAuthStore((state) => state.register);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreset, setAvatarPreset] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await register({ username, email, password, avatarPreset });
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not create your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" className="grid min-h-screen bg-background lg:grid-cols-[.9fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[hsl(var(--surface-rose))] p-12 text-[#49363B] lg:flex lg:flex-col lg:justify-between xl:p-16">
        <Link to="/" className="relative z-10 flex items-center gap-3"><CharacterBadge name="lumi" tone="paper" size="md" className="!h-11 !w-11" /><span className="font-editorial text-2xl">SendTheLetter</span></Link>
        <WorldScene3D kind="home" title="3D SendTheLetter welcome world" controls={false} className="relative z-10 h-[190px] w-full max-w-md" />
        <div className="relative z-10 max-w-xl"><p className="text-xs font-bold uppercase tracking-[.22em] opacity-65">A fresh page</p><h1 className="mt-5 font-editorial text-6xl leading-[1.08] xl:text-7xl">Make room for what matters.</h1><p className="mt-6 max-w-md leading-7 opacity-75">Create a little corner of the internet for thoughtful words, quiet moments, and meaningful connection.</p></div>
        <p className="relative z-10 text-sm opacity-60">Your story can start with one sentence.</p>
        <div className="absolute -bottom-20 -right-24 h-96 w-96 rounded-full border border-[#49363B]/15"/><div className="absolute -bottom-10 -right-14 h-72 w-72 rounded-full border border-[#49363B]/15"/>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="stl-depth-paper stl-depth-static w-full max-w-md rounded-[1.8rem] border border-border bg-card/70 p-6 sm:p-9">
          <Link to="/" className="mb-9 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Back to home</Link>
          <div className="mb-8 lg:hidden"><CharacterBadge name="lumi" tone="forest" size="md" /><p className="mt-4 font-editorial text-2xl">SendTheLetter</p></div>
          <WorldScene3D kind="home" title="3D SendTheLetter welcome world" controls={false} className="mb-4 h-[145px] lg:hidden" />
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">Start here</p>
          <h2 className="mt-3 font-editorial text-4xl">Create your space.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">A few details, then the page is yours.</p>
          {error && <div role="alert" className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2"><label htmlFor="username" className="text-sm font-semibold">Username</label><div className="relative"><Input id="username" autoComplete="username" required value={username} onChange={(event)=>setUsername(event.target.value)} placeholder="Choose a username" className="h-12 rounded-xl bg-card px-4"/></div></div>
            <div className="space-y-2"><label htmlFor="email" className="text-sm font-semibold">Email address</label><div className="relative"><Input id="email" type="email" autoComplete="email" required value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="you@example.com" className="h-12 rounded-xl bg-card px-4"/></div></div>
            <div className="space-y-2"><label htmlFor="password" className="text-sm font-semibold">Password</label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(event)=>setPassword(event.target.value)} placeholder="At least 8 characters" className="h-12 rounded-xl bg-card px-4 pr-20"/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(current => !current)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-xs font-bold text-primary hover:bg-muted">{showPassword ? "Hide" : "Show"}</button></div></div>
            <div className="stl-depth-card stl-depth-static rounded-2xl border border-border bg-card p-4 sm:p-5">
              <AvatarPicker value={avatarPreset} onChange={setAvatarPreset} />
            </div>
            <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-xl text-sm font-semibold">{isLoading?'Creating your space...':'Create account'}</Button>
          </form>
          <p className="mt-7 text-center text-sm text-muted-foreground">Already have an account? <Link to={loginLink} className="font-semibold text-primary hover:underline">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
};

export default Signup;
