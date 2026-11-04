import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import CharacterBadge from './CharacterBadge';
import LetterPagePhoto from './LetterPagePhoto';
import { clampImageAnchor } from '../lib/letterImageLayout';
import type { StoryPage } from '../types/note';
import { bookPagesFromContent, bookWordCount } from '../lib/letterBook';
import { getImageUrl } from '../lib/utils';

type Props = {
    title: string;
    content: string;
    letterPages?: StoryPage[] | null;
    recipientName?: string;
    authorName?: string;
    isAnonymous?: boolean;
    category?: string;
    font?: string;
    backgroundImage?: string;
    coverImage?: string;
    className?: string;
    compact?: boolean;
};
const gradients: Record<string, string> = {
    '#fdfbf7': 'linear-gradient(145deg,#fffdf9,#f8f2e7)',
    'linear-gradient(135deg, #fff5e6 0%, #ffe4cc 100%)': 'linear-gradient(135deg,#fff5e6,#ffe4cc)',
    'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)': 'linear-gradient(135deg,#e3f2fd,#bbdefb)',
    'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)': 'linear-gradient(135deg,#f3e5f5,#e1bee7)',
    'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)': 'linear-gradient(135deg,#e8f5e9,#c8e6c9)',
    'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)': 'linear-gradient(135deg,#fce4ec,#f8bbd0)',
};

export default function LetterBookReader({ title, content, letterPages, recipientName, authorName, isAnonymous, category, font, backgroundImage, coverImage, className = '', compact = false }: Props) {
    const pages = useMemo(() => bookPagesFromContent(content, letterPages), [content, letterPages]);
    const [pageIndex, setPageIndex] = useState(0);
    const [turnDirection, setTurnDirection] = useState<'next' | 'previous' | 'none'>('none');
    useEffect(() => { setPageIndex(0); setTurnDirection('none'); }, [content, letterPages]);
    const page = pages[Math.min(pageIndex, pages.length - 1)];
    const author = isAnonymous ? 'Anonymous' : authorName || 'A SendTheLetter writer';
    const paperBackground = gradients[backgroundImage || ''] || 'linear-gradient(145deg,#fffdf9,#f8f2e7)';
    const progress = ((pageIndex + 1) / Math.max(1, pages.length)) * 100;
    const imageSource = page.imageData;
    const anchor = clampImageAnchor(page);
    const beforePhoto = page.text.slice(0, anchor);
    const afterPhoto = page.text.slice(anchor);

    return <div data-testid="3d-letter-book" className={`stl-reading-book-3d min-w-0 ${className}`}>
      <div className="stl-depth-card stl-depth-static stl-reading-book min-w-0 overflow-hidden rounded-[22px] border border-[#e4d9c9] bg-[#fffdf9] shadow-[0_14px_35px_rgba(60,46,31,.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6ddd2] bg-[#fffaf3] px-5 py-3 text-[#785e4b] sm:px-7">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em]"><CharacterBadge name="basa" tone="gold" size="sm" /> The letter book</div>
            <div className="flex items-center gap-2 text-[11px]"><span>{pages.length} {pages.length === 1 ? 'page' : 'pages'}</span><span className="h-1 w-1 rounded-full bg-[#bcae9c]" /> <span>{bookWordCount(pages)} words</span></div>
        </div>
        <div className="relative stl-reading-perspective">
            <div key={pageIndex} data-turn={turnDirection} style={{ background: paperBackground }} className={`stl-reading-page-turn relative flex min-h-[460px] flex-col px-4 py-7 sm:px-6 sm:py-8 text-[#354337] sm:px-9 sm:py-10 ${compact ? 'lg:min-h-[500px]' : 'lg:min-h-[620px]'}`}>
                <div className="mb-6 flex items-center justify-between gap-3 border-b border-[#a58d75]/25 pb-4 text-[10px] font-semibold uppercase tracking-[.19em] text-[#9c715e]"><span className="inline-flex items-center gap-2"><CharacterBadge name="lumi" tone="paper" size="xs" /> From the heart</span><span>{category || 'Letter'}</span></div>
                {pageIndex === 0 ? <>
                    {coverImage && <img src={getImageUrl(coverImage)} alt="Letter cover illustration" className="mb-6 max-h-48 w-full rounded-2xl object-cover" />}
                    <h1 className="break-words font-editorial text-3xl leading-[1.22] sm:text-4xl">{title || 'A letter to remember'}</h1>
                    <p className="mt-4 text-xs font-semibold tracking-[.1em] text-[#a27c68]">BY {author}</p>
                    {recipientName && <p className="mt-8 font-serif text-lg italic text-[#665d4e]">Dear {recipientName},</p>}
                </> : <p className="mb-6 font-serif text-lg italic text-[#796f60]">{title} — continued</p>}
                <div data-testid="letter-reader-flow" className={`mt-6 flow-root min-w-0 flex-1 break-words whitespace-pre-wrap text-[15px] leading-[1.95] sm:text-[17px] ${font || 'font-serif'}`}>
                    {beforePhoto}
                    {imageSource && <LetterPagePhoto page={page} />}
                    {afterPhoto || (!page.text && !imageSource ? 'A quiet page, waiting for words.' : '')}
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-[#a58d75]/25 pt-4 text-xs text-[#9b8473]">
                    <span>{pageIndex === pages.length - 1 ? 'With care,' : 'Turn the page…'}</span><span className="font-serif font-semibold">{pageIndex === pages.length - 1 ? author : 'SendTheLetter'}</span>
                </div>
                <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 font-editorial text-[10px] tracking-[.2em] text-[#ad9d8b]">{pageIndex + 1} / {pages.length}</div>
            </div>
        </div>
        <div className="border-t border-[#e7ddce] bg-[#fffaf4] px-4 pb-4 pt-3 text-[#344a3c] sm:px-7">
            <div className="mb-4 h-1 overflow-hidden rounded-full bg-[#e8ddce]"><div className="h-full rounded-full bg-[#a98570] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
            <nav aria-label="Book pages" className="flex items-center justify-between gap-3">
                <button type="button" disabled={pageIndex <= 0} onClick={() => { setTurnDirection('previous'); setPageIndex(i => Math.max(0, i - 1)); }} className="inline-flex items-center gap-2 rounded-full border border-[#dfd1c1] bg-white px-4 py-2.5 text-xs font-bold hover:bg-[#f6eee3] disabled:cursor-not-allowed disabled:opacity-35"><ArrowLeft size={15} /> Previous</button>
                <div className="text-center text-[11px] font-semibold text-[#877667]">Page {pageIndex + 1} of {pages.length}</div>
                <button type="button" disabled={pageIndex >= pages.length - 1} onClick={() => { setTurnDirection('next'); setPageIndex(i => Math.min(pages.length - 1, i + 1)); }} className="inline-flex items-center gap-2 rounded-full bg-[#344a3c] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#47604f] disabled:cursor-not-allowed disabled:opacity-35">Next <ArrowRight size={15} /></button>
            </nav>
        </div>
      </div>
    </div>;
}
