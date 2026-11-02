import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import CharacterBadge from '../components/CharacterBadge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const Login = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionNotice = useAuthStore(state => state.sessionNotice);
  const requested = params.get('returnTo') || '/dashboard';
  const safeInternalReturn = requested.startsWith('/') && !requested.startsWith('//') && !/[\\\r\n]/.test(requested) && (
    /^\/dashboard(?:\/[^?#]*)?(?:\?[^#]*)?$/.test(requested) ||
    /^\/writers\/[^/?#]+(?:\?[^#]*)?$/.test(requested) ||
    /^\/letters\/[^/?#]+(?:\?[^#]*)?$/.test(requested) ||
    /^\/\?s=[a-f0-9]{48}$/.test(requested)
  );
  const returnTo = safeInternalReturn ? requested : '/dashboard';
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not sign you in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1fr_.9fr]">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="paper-grain absolute inset-0 opacity-30" />
        <Link to="/" className="relative z-10 flex items-center gap-3"><CharacterBadge name="lumi" tone="paper" size="md" className="!h-11 !w-11" /><span className="font-editorial text-2xl">SendTheLetter</span></Link>
        <div className="relative z-10 max-w-xl"><p className="text-xs font-bold uppercase tracking-[.22em] opacity-70">A space for your words</p><h1 className="mt-5 font-editorial text-6xl leading-[1.08] xl:text-7xl">Some feelings deserve a letter.</h1><p className="mt-6 max-w-md leading-7 opacity-75">Come back to your thoughts, your stories, and the words you want someone to remember.</p></div>
        <p className="relative z-10 text-sm opacity-60">Write slowly. Mean every word.</p>
        <div className="absolute -bottom-20 -right-24 h-96 w-96 rounded-full border border-white/15"/><div className="absolute -bottom-10 -right-14 h-72 w-72 rounded-full border border-white/15"/>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-12 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Back to home</Link>
          <div className="mb-8 lg:hidden"><CharacterBadge name="lumi" tone="forest" size="md" /><p className="mt-4 font-editorial text-2xl">SendTheLetter</p></div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">Welcome back</p>
          <h2 className="mt-3 font-editorial text-4xl">Your space is waiting.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in to pick up where your words left off.</p>
          {(params.has('passwordChanged') || params.has('resetSuccess')) && <div role="status" className="mt-6 rounded-2xl border border-border bg-muted p-3 text-sm">Password updated. Sign in with your new password.</div>}
          {!error && sessionNotice && <div role="status" className="mt-6 rounded-2xl border border-border bg-muted/80 p-3 text-sm text-muted-foreground">{sessionNotice}</div>}
          {error && <div role="alert" className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2"><label htmlFor="email" className="text-sm font-semibold">Email address</label><div className="relative"><Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"/><Input id="email" type="email" autoComplete="email" required value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="you@example.com" className="h-12 rounded-xl bg-card pl-11"/></div></div>
            <div className="space-y-2"><label htmlFor="password" className="text-sm font-semibold">Password</label><div className="relative"><LockKeyhole size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"/><Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event)=>setPassword(event.target.value)} placeholder="Your password" className="h-12 rounded-xl bg-card pl-11"/></div></div>
            <div className="text-right text-sm"><Link to="/forgot-password" className="font-semibold text-primary hover:underline">Forgot your password?</Link></div>
            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-sm font-semibold">{loading?'Signing you in...':'Sign in'} {!loading&&<ArrowRight size={17} className="ml-2"/>}</Button>
          </form>
          <p className="mt-7 text-center text-sm text-muted-foreground">New here? <Link to="/signup" className="font-semibold text-primary hover:underline">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
};

export default Login;
