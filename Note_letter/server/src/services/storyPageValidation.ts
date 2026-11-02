/** Reject image bytes accidentally pasted into letter prose rather than imageData. */
export const containsEncodedImageText = (text: string): boolean =>
    /data:image\/(?:png|jpeg|webp);base64,/i.test(text) || /[A-Za-z0-9+/]{256,}={0,2}/.test(text);

export interface StoryPage {
    text: string;
    imageData?: string;
    caption?: string;
    imageX?: number;
    imageY?: number;
    imageWidth?: number;
    imagePlacement?: 'before' | 'after';
}

/** Validate compact in-letter images and enforce bounds before JSONB persistence. */
export function parseStoryPages(value: unknown): { pages: StoryPage[] | null; error?: string } {
    if (value == null) return { pages: null };
    if (!Array.isArray(value) || value.length < 1 || value.length > 80) {
        return { pages: null, error: 'Letters can contain between 1 and 80 book pages.' };
    }
    const pages: StoryPage[] = [];
    let imageCount = 0;
    let totalBytes = 0;
    let allText = '';
    for (const item of value) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return { pages: null, error: 'Invalid book page.' };
        const text = (item as any).text;
        const imageData = (item as any).imageData;
        const caption = (item as any).caption;
        if (typeof text !== 'string' || text.length > 2400 || (caption != null && (typeof caption !== 'string' || caption.length > 140))) {
            return { pages: null, error: 'Each page supports up to 2,400 characters and a short photo caption.' };
        }
        if (containsEncodedImageText(text)) {
            return { pages: null, error: 'Image data was pasted into letter text. Insert the photo into a book page instead.' };
        }
        allText += text;
        const safePage: StoryPage = { text };
        if (imageData != null && imageData !== '') {
            if (typeof imageData !== 'string' || imageData.length > 440000 || imageCount >= 12) {
                return { pages: null, error: 'You can add up to 12 pictures, each under 300 KB.' };
            }
            const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(imageData);
            if (!match) return { pages: null, error: 'Photos must be JPG, PNG, or WebP.' };
            const bytes = Buffer.from(match[2], 'base64');
            const actualBase64 = bytes.toString('base64');
            if (actualBase64 !== match[2] || bytes.length < 16 || bytes.length > 300 * 1024) {
                return { pages: null, error: 'Photo is invalid or too large.' };
            }
            const png = bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
            const jpg = bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'));
            const webp = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
            if (!(match[1] === 'png' ? png : match[1] === 'jpeg' ? jpg : webp)) return { pages: null, error: 'Photo file format does not match its contents.' };
            imageCount++;
            totalBytes += bytes.length;
            if (totalBytes > 2 * 1024 * 1024) return { pages: null, error: 'Total book photo size must be under 2 MB.' };
            safePage.imageData = imageData;
        }
        // Preserve only bounded numeric layout metadata, never arbitrary CSS or HTML.
        const placement = (item as any).imagePlacement;
        if (placement != null && placement !== 'before' && placement !== 'after') {
            return { pages: null, error: 'Invalid photo placement.' };
        }
        if (placement && safePage.imageData) safePage.imagePlacement = placement;
        for (const key of ['imageX', 'imageY', 'imageWidth'] as const) {
            const value = (item as any)[key];
            if (value == null) continue;
            const min = key === 'imageWidth' ? 30 : 0;
            const max = key === 'imageWidth' ? 90 : 100;
            if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
                return { pages: null, error: 'Photo position and size must be within page bounds.' };
            }
            if (safePage.imageData) safePage[key] = Math.round(value);
        }
        if (caption) safePage.caption = caption.trim();
        pages.push(safePage);
    }
    if (allText.length > 100000) return { pages: null, error: 'Letter text is too long.' };
    return { pages };
}
