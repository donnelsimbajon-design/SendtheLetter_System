import { ArrowRight, BookOpenText, MailOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import LetterOpeningEnvelope from './LetterOpeningEnvelope';
import PlushCompanion from './PlushCompanion';

type Props = {
    title: string;
    opened: boolean;
    onOpen: () => void;
    onRead: () => void;
    onSkip?: () => void;
    className?: string;
    eyebrow?: string;
    description?: string;
    footer?: ReactNode;
};

/** Shared reader opening for member, public and private letters.
 * Iver is beside the introduction, never layered over the envelope seal.
 * Iver reactions are decorative and cannot trigger open/read actions.
 */
export default function LetterOpeningStage({
    title, opened, onOpen, onRead, onSkip,
    className = '', eyebrow = 'A letter is waiting for you',
    description = 'Unseal the envelope, then enjoy the letter without distractions.',
    footer,
}: Props) {
    return (
        <section aria-label="Open the 3D letter" className={`stl-opening-stage flex min-w-0 flex-col items-center justify-start gap-3 overflow-y-auto overscroll-contain px-3 pb-7 pt-5 text-center sm:justify-center sm:gap-4 sm:px-6 ${className}`}>
            <div className="stl-opening-heading w-full">
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#a16f54]">{eyebrow}</p>
                <h2 className="mx-auto mt-2 max-w-[720px] break-words font-editorial text-2xl leading-tight text-[#30443a] sm:text-4xl">{title || 'A note from the heart'}</h2>
            </div>

            <div className="stl-opening-layout w-full">
                <LetterOpeningEnvelope opened={opened} className="stl-opening-envelope" />
                <aside className="stl-opening-iver" aria-label="Iver, your letter-opening companion">
                    <PlushCompanion name="iver" size="envelope" />
                    <span className="sr-only">{description} Tap Iver for a reaction.</span>
                </aside>
            </div>

            <span aria-live="polite" className="sr-only">
                {opened ? 'Envelope opened. Your letter is ready.' : 'Sealed and ready to open.'}
            </span>
            <div className="flex w-full flex-wrap items-center justify-center gap-2">
                {!opened && (
                    <button type="button" onClick={onOpen} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#304b3e] px-6 py-3 text-sm font-bold text-white hover:bg-[#426550] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#304b3e]">
                        <MailOpen size={19} aria-hidden="true" /> Open envelope
                    </button>
                )}
                {opened && (
                    <button type="button" onClick={onRead} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#304b3e] px-6 py-3 text-sm font-bold text-white hover:bg-[#426550] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#304b3e]">
                        <BookOpenText size={19} aria-hidden="true" /> Read full letter <ArrowRight size={17} aria-hidden="true" />
                    </button>
                )}
                {onSkip && (
                    <button type="button" onClick={onSkip} className="inline-flex min-h-12 items-center rounded-full border border-[#dcd0c2] bg-white px-5 py-3 text-sm font-semibold text-[#43574d] hover:bg-[#f5eee6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#304b3e]">
                        Skip 3D &amp; read
                    </button>
                )}
            </div>
            {footer && <div className="max-w-lg text-xs leading-5 text-[#7a7165]">{footer}</div>}
        </section>
    );
}
