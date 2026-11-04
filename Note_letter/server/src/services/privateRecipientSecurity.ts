import { createHash } from 'node:crypto';

/** No share secrets are ever persisted as plaintext. */
export function hashRecipientToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
}

export type PrivateLetterVisibility = {
    status: string;
    isPublic: boolean;
    isArchived?: boolean | null;
    openDate?: Date | string | null;
    scheduledDate?: Date | string | null;
};

export function isVisibleRecipientLetter(letter: PrivateLetterVisibility | null, now = Date.now()): boolean {
    return !!letter && letter.status === 'published' && letter.isPublic === false &&
        letter.isArchived !== true &&
        (!letter.openDate || new Date(letter.openDate).getTime() <= now) &&
        (!letter.scheduledDate || new Date(letter.scheduledDate).getTime() <= now);
}
