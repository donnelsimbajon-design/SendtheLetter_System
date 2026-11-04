import { LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import Mascot from './Mascot';
import type { Note } from '../types/note';

type Props = {
  note: Note;
  onManage: (note: Note) => void;
  onOpen: (note: Note) => void;
};

const releaseDate = (note: Note): Date | null => {
  const value = note.isTimeCapsule ? note.openDate : note.scheduledDate;
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

export default function TimeCapsuleCard({ note, onManage, onOpen }: Props) {
  // Never rely on the clock alone to unlock a scheduled letter. The server
  // must have actually published it before the reading action is available.
  const date = releaseDate(note);
  const locked = note.status !== 'published' || (date !== null && date.getTime() > Date.now());
  const formatted = date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Not scheduled';
  return (
    <article className="stl-capsule-card group flex min-h-[330px] flex-col rounded-[1.5rem] border border-border bg-card/70 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
        <span>{locked ? 'Sealed time capsule' : 'Ready to open'}</span>
        {locked ? <LockKeyhole size={16} aria-label="Locked" /> : <LockKeyholeOpen size={16} aria-label="Unlocked" />}
      </div>
      <div className="stl-capsule-scene" aria-hidden="true">
        <div className={`stl-capsule ${locked ? '' : 'is-unlocked'}`}>
          <Mascot name={locked ? 'susi' : 'araw'} className="relative z-10 h-16 w-16" />
        </div>
      </div>
      <h3 className="line-clamp-2 font-editorial text-xl">{note.title || 'A letter for the future'}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{locked ? 'Opens on' : 'Released'}: {formatted}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{locked ? 'The letter stays sealed in this preview until the server publishes it.' : 'Your time capsule is ready to read.'}</p>
      <button
        type="button"
        onClick={() => locked ? onManage(note) : onOpen(note)}
        className="mt-auto min-h-11 w-full rounded-full border border-border bg-background px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {locked ? 'Manage scheduled capsule' : 'Open time capsule'}
      </button>
    </article>
  );
}
