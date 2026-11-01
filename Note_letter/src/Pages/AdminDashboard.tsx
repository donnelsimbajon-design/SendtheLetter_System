import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useAuthStore } from '../store/authStore';

type UserRecord = { id: number; username: string; email: string; role: 'user' | 'admin'; isActive: boolean; createdAt: string };
type LetterRecord = { id: number; title: string; status: string; isPublic: boolean; isArchived: boolean; createdAt: string; user?: { id: number; username: string; email: string } };
type Overview = { users: number; activeUsers: number; suspendedUsers: number; letters: number; publicLetters: number; drafts: number };

const AdminDashboard = () => {
  const token = useAuthStore((state) => state.token);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [letters, setLetters] = useState<LetterRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}/api/admin${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}`, ...(init.headers || {}) },
    });
    const text = await response.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('The server returned an unreadable response.'); }
    if (!response.ok) throw new Error(data.message || 'Admin request failed.');
    return data;
  }, [token]);

  const load = useCallback(async (query = '') => {
    setLoading(true); setError('');
    try {
      const suffix = query ? `?limit=100&search=${encodeURIComponent(query)}` : '?limit=100';
      const [stats, userResult, letterResult] = await Promise.all([api('/overview'), api(`/users${suffix}`), api(`/letters${suffix}`)]);
      setOverview(stats); setUsers(userResult.items || []); setLetters(letterResult.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the admin panel.');
    } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const updateUser = async (user: UserRecord, changes: { role?: 'user' | 'admin'; isActive?: boolean }) => {
    setNotice(''); setError('');
    try {
      await api(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(changes) });
      setNotice(`Updated ${user.username}.`); await load(search);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update this account.'); }
  };

  const removeLetter = async (letter: LetterRecord) => {
    if (!window.confirm(`Remove “${letter.title || 'Untitled letter'}” from public view?`)) return;
    setNotice(''); setError('');
    try {
      await api(`/letters/${letter.id}/remove`, { method: 'POST' });
      setNotice('Letter removed from public view.'); await load(search);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to moderate this letter.'); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-muted-foreground"><ShieldCheck size={15} /> Administration</p><h1 className="mt-2 font-editorial text-4xl">Admin panel</h1><p className="mt-2 text-sm text-muted-foreground">Manage accounts and moderate public letters.</p></div>
        <button onClick={() => void load(search)} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </header>
      {error && <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {notice && <div role="status" className="rounded-2xl border border-border bg-card p-4 text-sm">{notice}</div>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Total accounts', value: overview?.users ?? '—', icon: Users },
          { label: 'Active accounts', value: overview?.activeUsers ?? '—', icon: CheckCircle2 },
          { label: 'Suspended accounts', value: overview?.suspendedUsers ?? '—', icon: AlertTriangle },
          { label: 'All letters', value: overview?.letters ?? '—', icon: FileText },
          { label: 'Public letters', value: overview?.publicLetters ?? '—', icon: FileText },
          { label: 'Saved drafts', value: overview?.drafts ?? '—', icon: FileText },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-3xl border border-border bg-card p-5"><div className="flex items-center justify-between text-muted-foreground"><span className="text-sm">{label}</span><Icon size={18} /></div><p className="mt-3 font-editorial text-3xl">{value}</p></div>)}
      </section>
      <form onSubmit={(event) => { event.preventDefault(); void load(search); }} className="flex flex-wrap gap-2">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-full border border-border bg-card px-4"><Search size={17} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users or letters" className="h-11 w-full bg-transparent text-sm outline-none" /></div>
        <button type="submit" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Search</button>
        {search && <button type="button" onClick={() => { setSearch(''); void load(''); }} className="rounded-full border border-border px-4 py-2.5 text-sm">Clear</button>}
      </form>
      <section className="space-y-4">
        <div><h2 className="font-editorial text-2xl">User accounts</h2><p className="text-sm text-muted-foreground">Promote trusted staff, or suspend accounts. Public sign-up cannot assign administrator access.</p></div>
        <div className="overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-4">Account</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => <tr key={user.id}><td className="px-5 py-4"><p className="font-semibold">{user.username}</p><p className="text-xs text-muted-foreground">{user.email}</p></td><td className="px-5 py-4 capitalize">{user.role}</td><td className="px-5 py-4"><span className={user.isActive ? 'text-emerald-700' : 'text-destructive'}>{user.isActive ? 'Active' : 'Suspended'}</span></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2">
                <button disabled={user.id === useAuthStore.getState().user?.id} onClick={() => void updateUser(user, { role: user.role === 'admin' ? 'user' : 'admin' })} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40">{user.role === 'admin' ? 'Remove admin' : 'Make admin'}</button>
                <button disabled={user.id === useAuthStore.getState().user?.id} onClick={() => void updateUser(user, { isActive: !user.isActive })} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40">{user.isActive ? 'Suspend' : 'Reactivate'}</button>
              </div></td></tr>)}
              {!users.length && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">{loading ? 'Loading accounts…' : 'No accounts found.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-4">
        <div><h2 className="font-editorial text-2xl">Letter moderation</h2><p className="text-sm text-muted-foreground">Removing a letter makes it private, archived, and unavailable in public feeds; the author’s record is retained.</p></div>
        <div className="overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-4">Letter</th><th className="px-5 py-4">Author</th><th className="px-5 py-4">Visibility</th><th className="px-5 py-4">Action</th></tr></thead>
            <tbody className="divide-y divide-border">
              {letters.map((letter) => <tr key={letter.id}><td className="px-5 py-4"><p className="max-w-sm truncate font-semibold">{letter.title || 'Untitled letter'}</p><p className="text-xs text-muted-foreground">#{letter.id} · {letter.status}</p></td><td className="px-5 py-4">{letter.user?.username || 'Unknown'}</td><td className="px-5 py-4">{letter.isPublic && !letter.isArchived && letter.status === 'published' ? 'Public' : 'Private / archived'}</td><td className="px-5 py-4"><button disabled={!letter.isPublic || letter.isArchived} onClick={() => void removeLetter(letter)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Remove from public</button></td></tr>)}
              {!letters.length && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">{loading ? 'Loading letters…' : 'No letters found.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
