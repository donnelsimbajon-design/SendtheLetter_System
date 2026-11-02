import { useRef } from 'react';
import type { PointerEvent } from 'react';
import type { StoryPage } from '../types/note';

type PhotoLayout = Pick<StoryPage, 'imageX' | 'imageY' | 'imageWidth'>;
type Props = {
    page: StoryPage;
    editable?: boolean;
    onChange?: (changes: PhotoLayout) => void;
    onCommit?: () => void;
};

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** A stable, normalized canvas: coordinates and size persist in JSONB and scale on mobile. */
export default function LetterPagePhoto({ page, editable = false, onChange, onCommit }: Props) {
    const offset = useRef<{ x: number; y: number } | null>(null);
    if (!page.imageData) return null;

    const width = clamp(page.imageWidth ?? 70, 30, 90);
    const x = clamp(page.imageX ?? 50, width / 2, 100 - width / 2);
    const y = clamp(page.imageY ?? 50, 15, 85);

    const move = (event: PointerEvent<HTMLButtonElement>) => {
        const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
        if (!bounds || !offset.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const nextX = (event.clientX - bounds.left) / bounds.width * 100 - offset.current.x;
        const nextY = (event.clientY - bounds.top) / bounds.height * 100 - offset.current.y;
        onChange?.({ imageX: Math.round(clamp(nextX, width / 2, 100 - width / 2)), imageY: Math.round(clamp(nextY, 15, 85)) });
    };

    const imageClass = 'pointer-events-none h-full w-full select-none rounded-xl border border-[#d9cbbb] bg-white object-contain shadow-lg';
    return <div className="relative my-4 h-[260px] overflow-hidden rounded-2xl border border-dashed border-[#cbbba8] bg-[#f0e6d8]/50 sm:h-[330px]" data-photo-stage>
        {editable && <span className="pointer-events-none absolute left-3 top-2 z-10 rounded-full bg-[#fffaf3]/90 px-2.5 py-1 text-[10px] font-semibold text-[#65513f]">Drag photo to move · Resize below</span>}
        {editable ? <button
            type="button"
            aria-label="Drag image to place it on the letter page. Use arrow keys to fine-tune."
            className="absolute cursor-grab rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#344a3c] active:cursor-grabbing"
            style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: 'auto', maxHeight: '85%', aspectRatio: '5 / 3', transform: 'translate(-50%, -50%)', touchAction: 'none' }}
            onPointerDown={event => {
                if (!event.isPrimary) return;
                const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
                if (!bounds) return;
                offset.current = {
                    x: (event.clientX - bounds.left) / bounds.width * 100 - x,
                    y: (event.clientY - bounds.top) / bounds.height * 100 - y,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={move}
            onPointerUp={event => { if (offset.current) { move(event); offset.current = null; onCommit?.(); } }}
            onPointerCancel={() => { offset.current = null; onCommit?.(); }}
            onKeyDown={event => {
                const offsets: Record<string, [number, number]> = {
                    ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2],
                };
                const step = offsets[event.key];
                if (!step) return;
                event.preventDefault();
                onChange?.({ imageX: clamp(x + step[0], width / 2, 100 - width / 2), imageY: clamp(y + step[1], 15, 85) });
                onCommit?.();
            }}
        ><img src={page.imageData} alt={page.caption || 'Photo in the letter'} draggable={false} className={imageClass} /></button>
        : <img src={page.imageData} alt={page.caption || 'Photo in the letter'} loading="lazy" className={imageClass + ' absolute'} style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: 'auto', maxHeight: '85%', aspectRatio: '5 / 3', transform: 'translate(-50%, -50%)' }} />}
    </div>;
}
