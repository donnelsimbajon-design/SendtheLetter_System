import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, LockKeyhole } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import CharacterBadge from '../components/CharacterBadge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

type Props = { mode: 'request' | 'confirm' };

export default function PasswordRecoveryPage({ mode }: Props) {
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Avoid leaving a reset secret in browser history after the page is opened.
    if (mode === 'confirm' && token) window.history.replaceState(window.history.state, '', '/reset-password');
  }, [mode, token]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (mode === 'confirm' && newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    if (mode === 'confirm' && newPassword.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.auth}/password-reset/${mode === 'request' ? 'request' : 'confirm'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'request' ? { email } : { token, newPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Account recovery is temporarily unavailable.');
      if (mode === 'confirm') navigate('/login?resetSuccess=1', { replace: true });
      else setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again later.');
    } finally {
      setBusy(false);
    }
  };

  const badLink = mode === 'confirm' && !/^[a-f0-9]{64}$/.test(token);
  return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
    <section className="stl-depth-paper stl-depth-static w-full max-w-md rounded-[28px] border border-border bg-card p-7 shadow-sm sm:p-10">
      <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Back to sign in</Link>
      <CharacterBadge name="susi" tone="sage" size="lg" />
      <h1 className="mt-4 font-editorial text-3xl">{mode === 'request' ? 'Recover your account' : 'Choose a new password'}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{mode === 'request'
        ? 'Enter your email address. If an eligible account exists, we will send a reset link valid for 30 minutes.'
        : 'Use a new password that you have not used for this account.'}</p>
      {error && <p role="alert" className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {badLink ? <div className="mt-6 space-y-3 text-sm"><p>This reset link is invalid or has expired.</p><Link className="font-semibold text-primary underline" to="/forgot-password">Request another reset link</Link></div>
      : sent ? <div role="status" className="mt-6 rounded-xl bg-muted p-4 text-sm">Check your inbox if the account is eligible. The link may take a few moments to arrive.</div>
      : <form className="mt-7 space-y-5" onSubmit={submit}>
        {mode === 'request' ? <label className="block space-y-2 text-sm font-semibold">Email address
          <span className="relative block"><Mail size={17} className="absolute left-3 top-3.5 text-muted-foreground" /><Input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="h-12 pl-10" /></span>
        </label> : <>
          <label className="block space-y-2 text-sm font-semibold">New password
            <span className="relative block"><LockKeyhole size={17} className="absolute left-3 top-3.5 text-muted-foreground" /><Input type="password" minLength={8} maxLength={72} autoComplete="new-password" required value={newPassword} onChange={event => setNewPassword(event.target.value)} className="h-12 pl-10" /></span>
          </label>
          <label className="block space-y-2 text-sm font-semibold">Confirm new password
            <Input type="password" minLength={8} maxLength={72} autoComplete="new-password" required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="h-12" />
          </label>
        </>}
        <Button type="submit" disabled={busy} className="h-12 w-full">{busy ? 'Processing…' : mode === 'request' ? 'Send reset link' : 'Update password'}</Button>
      </form>}
    </section>
  </main>;
}
