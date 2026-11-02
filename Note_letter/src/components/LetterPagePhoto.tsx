import type { StoryPage } from '../types/note';
import { photoLayoutStyle } from '../lib/letterImageLayout';

type Props = { page: StoryPage };

/** A real floated figure participates in text reflow. No absolute overlays or duplicated prose. */
export default function LetterPagePhoto({ page }: Props) {
    if (!page.imageData) return null;
    return <figure data-letter-photo className="relative box-border block max-w-full break-inside-avoid rounded-lg border border-[#e2d5c5] bg-[#f8f3eb] p-1.5 shadow-sm"
        style={photoLayoutStyle(page)}>
        <img src={page.imageData} alt={page.caption || 'Photo attached to this letter'}
            loading="lazy" draggable={false} className="block h-auto max-h-[270px] w-full rounded-md object-contain" />
        {page.caption && <figcaption className="px-1 pt-1.5 text-center font-serif text-xs italic leading-5 text-[#867362]">{page.caption}</figcaption>}
    </figure>;
}
