import type { StoryPage } from '../types/note';
import type { CSSProperties } from 'react';

/** The stored anchor is a character offset into the single source-of-truth page text. */
export const clampImageAnchor = (page: StoryPage): number => {
    if (page.imagePlacement === 'before') return 0;
    if (page.imagePlacement === 'after' || !page.imagePlacement) return page.text.length;
    return Math.max(0, Math.min(page.text.length, Math.floor(page.imageAnchor ?? 0)));
};

export const isWrappedPhoto = (page: StoryPage) =>
    page.imagePlacement === 'left' || page.imagePlacement === 'right';

export const photoWidth = (page: StoryPage): number => {
    const value = page.imageWidth ?? (isWrappedPhoto(page) ? 42 : 70);
    return Math.max(30, Math.min(isWrappedPhoto(page) ? 65 : 90, value));
};

export const photoLayoutStyle = (page: StoryPage): CSSProperties => {
    const wrapped = isWrappedPhoto(page);
    return {
        float: wrapped ? page.imagePlacement as 'left' | 'right' : 'none',
        width: `${photoWidth(page)}%`,
        maxWidth: '100%',
        margin: wrapped ? (page.imagePlacement === 'left' ? '0 20px 14px 0' : '0 0 14px 20px') : '18px auto',
    };
};
