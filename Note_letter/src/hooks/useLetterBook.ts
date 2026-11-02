import { useCallback, useState } from 'react';
import type { StoryPage } from '../types/note';
import { balanceBookPages, bookPagesFromContent, bookPlainText, bookWordCount, canAddBookPhoto, MAX_BOOK_PAGES } from '../lib/letterBook';

export function useLetterBook() {
    const [pages, setPages] = useState<StoryPage[]>([{ text: '' }]);
    const [pageIndex, setPageIndex] = useState(0);
    const [bookError, setBookError] = useState('');

    const resetBook = useCallback((content: string, saved?: StoryPage[] | null) => {
        setPages(bookPagesFromContent(content, saved));
        setPageIndex(0);
        setBookError('');
    }, []);

    const updateText = (value: string) => {
        // If an image has been pasted as base64, do not turn it into dozens of book pages.
        // Images belong in page.imageData, not page.text.
        if (/data:image\/(?:png|jpeg|webp);base64,/i.test(value) || /[A-Za-z0-9+/]{256,}={0,2}/.test(value)) {
            setBookError('This looks like encoded photo data. Use "Insert image in page" or paste the photo itself.');
            return false;
        }
        const updated = pages.map(page => ({ ...page }));
        updated[pageIndex].text = value;
        const balanced = balanceBookPages(updated, pageIndex);
        if (balanced.length > MAX_BOOK_PAGES || balanced[balanced.length - 1].text.length > 2400) {
            setBookError('This book has reached its 80-page limit. Start another letter for the next chapter.');
            return false;
        }
        setPages(balanced);
        setBookError('');
        if (balanced.length > updated.length && balanced[pageIndex].text.length < value.length) setPageIndex(pageIndex + 1);
        return true;
    };

    const addPage = () => {
        if (pages.length >= MAX_BOOK_PAGES) { setBookError('Maximum of 80 pages reached.'); return false; }
        const next = [...pages];
        next.splice(pageIndex + 1, 0, { text: '' });
        setPages(next);
        setPageIndex(pageIndex + 1);
        setBookError('');
        return true;
    };

    const removeBlank = () => {
        const current = pages[pageIndex];
        if (pages.length < 2 || current.text.trim() || current.imageData) {
            setBookError('Only completely blank pages can be removed.');
            return false;
        }
        setPages(prev => prev.filter((_page, index) => index !== pageIndex));
        setPageIndex(prev => Math.max(0, prev - 1));
        setBookError('');
        return true;
    };

    const setCaption = (caption: string) => {
        setPages(prev => prev.map((page, index) => index === pageIndex ? { ...page, caption } : page));
    };

    const removeImage = () => {
        setPages(prev => prev.map((page, index) => index === pageIndex ? { text: page.text } : page));
    };

    const addPhoto = async (file: File) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 7 * 1024 * 1024) {
            throw new Error('Choose a JPG, PNG or WebP photo under 7 MB.');
        }
        if (!canAddBookPhoto(pages)) throw new Error('You can add up to 12 photos per letter.');
        const url = URL.createObjectURL(file);
        try {
            const image = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Could not read that image.'));
                img.src = url;
            });
            const canvas = document.createElement('canvas');
            const scale = Math.min(1, 1050 / Math.max(image.naturalWidth, image.naturalHeight));
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not resize this image.');
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            let quality = 0.82;
            let data = canvas.toDataURL('image/jpeg', quality);
            while (data.length > 390000 && quality > 0.32) {
                quality -= 0.1;
                data = canvas.toDataURL('image/jpeg', quality);
            }
            if (data.length > 390000) throw new Error('Photo is too large even after resizing.');
            const next = pages.map(page => ({ ...page }));
            const target = next[pageIndex].imageData ? pageIndex + 1 : pageIndex;
            if (target === next.length) next.push({ text: '' });
            if (next[target].imageData) next.splice(target, 0, { text: '' });
            if (next.length > MAX_BOOK_PAGES) throw new Error('No room for another page.');
            next[target] = { ...next[target], imageData: data };
            const balanced = balanceBookPages(next, target);
            setPages(balanced);
            setPageIndex(target);
            setBookError('');
        } finally {
            URL.revokeObjectURL(url);
        }
    };

    return {
        pages, pageIndex, setPageIndex, bookError, setBookError, resetBook,
        updateText, addPage, removeBlank, addPhoto, setCaption, removeImage,
        content: bookPlainText(pages), wordCount: bookWordCount(pages),
    };
}
