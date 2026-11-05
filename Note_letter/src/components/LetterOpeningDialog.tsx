import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import CharacterBadge from './CharacterBadge';
import LetterOpeningStage from './LetterOpeningStage';
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
      <DialogContent className="stl-full-letter-reader flex h-[min(94dvh,760px)] w-[calc(100vw-1rem)] max-w-[820px] min-w-0 flex-col gap-0 overflow-hidden rounded-[22px] border border-[#e7dbcc] bg-[#fcf9f4] p-0 shadow-2xl sm:h-[min(86dvh,760px)] sm:rounded-[30px]">
        <DialogTitle className="sr-only">A letter for you</DialogTitle>
        <DialogDescription className="sr-only">Unseal the paper envelope before reading, or skip the animation.</DialogDescription>
        <header className="flex shrink-0 items-center gap-3 border-b border-[#e7dbcc] bg-[#fffdf9] px-4 py-3 pr-12 sm:px-6 sm:py-4">
          <CharacterBadge name="basa" tone="paper" size="sm" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#a16f54]">SendTheLetter · Reader</p>
            <p className="truncate font-editorial text-sm font-semibold text-[#30443a] sm:text-lg">{note?.title || 'Your letter'}</p>
          </div>
        </header>
        <LetterOpeningStage
          title={note?.title || 'A note from the heart'}
          opened={opened}
          onOpen={() => setOpened(true)}
          onRead={() => { if (note) onRead(note); }}
          onSkip={() => { if (note) onRead(note); }}
          className="min-h-0 flex-1"
        />
      </DialogContent>
    </Dialog>
  );
}
