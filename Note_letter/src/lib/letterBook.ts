import type { StoryPage } from '../types/note';

/**
 * Comfortable page size for a reader-sized book. Photos reserve about half
 * of the available paper, so a picture page holds fewer words.
 * A page remains editable; overflow moves forward without discarding text.
 */
export const MAX_BOOK_PAGES = 80;
export const MAX_BOOK_PHOTOS = 12;
export const WORDS_PER_PAGE = 145;
export const PHOTO_WORDS_PER_PAGE = 70;

const pageWordLimit = (page: StoryPage) => page.imageData ? PHOTO_WORDS_PER_PAGE : WORDS_PER_PAGE;
const pageCharLimit = (page: StoryPage) => page.imageData ? 630 : 1300;
const countWords = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;

function splitOverflow(text: string, page: StoryPage): [string, string] {
    const maxWords = pageWordLimit(page);
    const maxChars = pageCharLimit(page);
    if (text.length <= maxChars && countWords(text) <= maxWords) return [text, ''];
    const candidate = Math.min(text.length, maxChars);
    const part = text.slice(0, candidate);
    const regex = /\S+\s*/g;
    let words = 0;
    let end = 0;
    while (regex.exec(part)) {
        words++;
        if (words > maxWords) break;
        end = regex.lastIndex;
    }
    if (!end) end = Math.min(candidate, Math.max(1, maxChars));
    // If word cap was reached before the character cap, stop at the cap.
    const kept = text.slice(0, end);
    return [kept, text.slice(end)];
}

/** Copy the page array and push overflow to subsequent pages in order. */
export function balanceBookPages(pages: StoryPage[], start: number): StoryPage[] {
    const next = pages.map(page => ({ ...page }));
    for (let i = Math.max(0, start); i < next.length && i < MAX_BOOK_PAGES; i++) {
        const [kept, overflow] = splitOverflow(next[i].text, next[i]);
        if (!overflow) continue;
        if (i >= MAX_BOOK_PAGES - 1) break;
        next[i].text = kept;
        if (!next[i + 1]) next.push({ text: overflow });
        else next[i + 1].text = overflow + next[i + 1].text;
    }
    return next;
}

export function bookPagesFromContent(content = '', stored?: StoryPage[] | null): StoryPage[] {
    if (Array.isArray(stored) && stored.length) {
        const clean = stored.filter(page => page && typeof page.text === 'string').slice(0, MAX_BOOK_PAGES).map(page => ({
            text: page.text,
            ...(typeof page.imageData === 'string' ? { imageData: page.imageData } : {}),
            ...(typeof page.caption === 'string' ? { caption: page.caption } : {}),
        }));
        return clean.length ? clean : [{ text: '' }];
    }
    return balanceBookPages([{ text: content || '' }], 0);
}

export const bookPlainText = (pages: StoryPage[]) => pages.map(page => page.text.trim()).filter(Boolean).join('\n\n');
export const bookWordCount = (pages: StoryPage[]) => pages.reduce((sum, page) => sum + countWords(page.text), 0);

export function canAddBookPhoto(pages: StoryPage[]) {
    return pages.filter(page => !!page.imageData).length < MAX_BOOK_PHOTOS;
}
