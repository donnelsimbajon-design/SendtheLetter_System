import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNoteStore, type Notification } from '../store/noteStore';
import socketService from '../services/socketService';
import Mascot from './Mascot';
import CharacterBadge from './CharacterBadge';

function destination(n: Notification): string {
  if (n.letterId && Number.isSafeInteger(Number(n.letterId))) {
    return `/dashboard/notes?letterId=${encodeURIComponent(String(n.letterId))}`;
  }
  return n.actor?.username ? `/dashboard/profile/${encodeURIComponent(n.actor.username)}` : '/dashboard';
}
function detail(n: Notification): string {
  switch (n.type) {
    case 'comment': return 'commented on your letter';
    case 'like': return 'liked your letter';
    case 'follow': return 'started following you';
    case 'friend_request': return 'sent a friend request';
    case 'time_capsule_opened': return 'Your time capsule is ready';
    case 'scheduled_letter_published': return 'Your scheduled letter was released';
    default: return 'New update';
  }
}

export default function NotificationsMenu({ placement = 'header' }: { placement?: 'header' | 'rail' }) {
  const { notifications, fetchNotifications, markNotificationsRead, markNotificationRead } = useNoteStore();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const unread = notifications.filter(n => !n.isRead).length;
  useEffect(() => {
    void fetchNotifications();
    socketService.onNewNotification(() => void fetchNotifications());
    return () => socketService.offNewNotification();
  }, [fetchNotifications]);
  return <div className="relative">
    <button type="button" onClick={() => { setOpen(!open); setError(''); }}
      aria-label={`Notifications, ${unread} unread`} aria-expanded={open} aria-haspopup="dialog"
      className={placement === 'rail' ? "relative flex h-12 w-12 items-center justify-center rounded-2xl border border-transparent hover:border-white/15 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#F1D49C]" : "relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"}>
      <CharacterBadge name="nori" tone="gold" size="sm" />
      {unread > 0 && <span aria-hidden="true" className="absolute right-0 top-0 min-w-4 rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{unread > 99 ? '99+' : unread}</span>}
    </button>
    {open && <section role="dialog" aria-label="Notifications" className={placement === 'rail' ? "absolute bottom-0 left-[calc(100%+14px)] z-50 w-[min(22rem,calc(100vw-7rem))] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-xl" : "absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-xl"}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div><h2 className="text-sm font-semibold">Notifications</h2><p className="text-xs text-muted-foreground">{unread ? `${unread} unread` : 'All caught up'}</p></div>
        {unread > 0 && <button type="button" className="rounded-lg px-2 py-2 text-xs font-semibold hover:bg-muted" onClick={() => void markNotificationsRead().catch(() => setError('Unable to mark all read.'))}>Mark all read</button>}
        <button type="button" className="rounded-lg px-2 py-2 text-xs hover:bg-muted" onClick={() => setOpen(false)} aria-label="Close notifications">Close</button>
      </div>
      {error && <p role="alert" className="px-4 py-2 text-xs text-destructive">{error}</p>}
      <div className="max-h-[min(65vh,22rem)] overflow-y-auto">
        {notifications.length ? notifications.slice(0, 20).map(n => <Link key={n.id} to={destination(n)}
          onClick={() => { setOpen(false); if (!n.isRead) void markNotificationRead(n.id).catch(() => setError('Could not update notification.')); }}
          className={`block border-b border-border/70 px-4 py-3 text-sm last:border-0 hover:bg-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${n.isRead ? '' : 'bg-[hsl(var(--surface-gold))]/30'}`}>
          <p><strong>{n.type.startsWith('scheduled_') || n.type === 'time_capsule_opened' ? 'Nori' : n.actor?.username || 'Someone'}</strong> {detail(n)}{n.letter?.title ? ` · ${n.letter.title}` : ''}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}{n.isRead ? '' : ' · Unread'}</p>
        </Link>) : <div className="flex flex-col items-center px-4 py-6 text-center text-sm text-muted-foreground"><Mascot name="nori" className="mb-2 h-20 w-20" /><p>No notifications yet.</p></div>}
      </div>
    </section>}
  </div>;
}
