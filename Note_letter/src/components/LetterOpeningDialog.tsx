import { useEffect, useState } from 'react';
import { BookOpenText, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import Mascot from './Mascot';
import LetterOpeningEnvelope from './LetterOpeningEnvelope';
import type { Note } from '../types/note';

type Props = {
  note: Note | null;
  onClose: () => void;
  onRead: (note: Note) => void;
};

export default function LetterOpeningDialog({ note, onClose, onRead }: Props) {
  const [opened, setOpened] = useState(false);

  useEffect(() => { setOpened(false); }, [note?.id]);

  return (
    <Dialog open={Boolean(note)} onOpenChange={value => { if (!value) onClose(); }}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xl overflow-hidden rounded-[1.7rem] border-border bg-background p-5 sm:p-8">
        <div className="pr-6">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">An envelope just for you</p>
          <DialogTitle className="mt-2 font-editorial text-2xl leading-tight sm:text-3xl">A letter for you</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6">
            Open the envelope to reveal your letter, or skip straight to the familiar reader.
          </DialogDescription>
        </div>
        <LetterOpeningEnvelope opened={opened} />
        <div aria-live="polite" className="text-center text-xs text-muted-foreground">
          {opened ? 'Envelope opened. Your letter is ready.' : 'Sealed and ready to open.'}
        </div>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          {note && !opened && (
            <button
              type="button"
              onClick={() => setOpened(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-85"
            >
              <Mascot name="lumi" className="h-7 w-7" /> Open envelope
            </button>
          )}
          {note && (
            <button
              type="button"
              onClick={() => onRead(note)}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold ${opened ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground'}`}
            >
              {opened ? <BookOpenText size={17} /> : <ArrowRight size={17} />}
              {opened ? 'Read the letter' : 'Skip animation & read'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
