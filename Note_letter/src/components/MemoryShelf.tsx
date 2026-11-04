import { BookOpenText, Unlock } from 'lucide-react';
import type { Note } from '../types/note';
import Mascot from './Mascot';

type Props = {
  notes: Note[];
  onOpen: (note: Note) => void;
};

/** Optional 3D presentation of the owner's already-released library. */
export default function MemoryShelf({ notes, onOpen }: Props) {
  return (
    <section aria-label="3D memory library" className="stl-shelf">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Your memory shelf</p>
          <h3 className="mt-1 font-editorial text-2xl">Stories to open</h3>
        </div>
        <Mascot name="basa" className="h-14 w-14" />
      </div>
      <div className="grid grid-cols-1 gap-6 pb-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => onOpen(note)}
            aria-label={`Open ${note.title || 'Untitled letter'} with 3D envelope`}
            className="stl-book-button focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <span className="flex items-center justify-between gap-2">
              <Mascot name={note.isTimeCapsule ? 'araw' : 'basa'} className="h-12 w-12 shrink-0" />
              {note.isTimeCapsule ? <Unlock size={17} aria-hidden="true" className="text-muted-foreground" /> : <BookOpenText size={17} aria-hidden="true" className="text-muted-foreground" />}
            </span>
            <span className="min-w-0">
              <span className="block break-words font-editorial text-xl leading-snug">{note.title || 'Untitled letter'}</span>
              <span className="mt-2 block text-xs text-muted-foreground">{note.isTimeCapsule ? 'Opened time capsule' : note.category || note.type || 'Your writing'}</span>
            </span>
            <span className="flex items-center justify-between gap-2 border-t border-border pt-3 text-xs font-semibold text-primary">
              Open this memory <span aria-hidden="true">→</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
