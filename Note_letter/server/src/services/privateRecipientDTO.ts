/** Recipient link responses have a dedicated minimal allowlist.
 * Never spread a whole Letter model or reuse public-feed DTOs as they evolve.
 */
export function privateRecipientDTO(letter: Record<string, any>) {
    const fields = [
        'id', 'title', 'content', 'type', 'status', 'isAnonymous',
        'recipientName', 'backgroundImage', 'spotifyLink', 'font',
        'imageUrl', 'letterPages', 'createdAt',
    ] as const;
    const result: Record<string, unknown> = { isPublic: false };
    for (const key of fields) {
        if (Object.prototype.hasOwnProperty.call(letter, key)) result[key] = letter[key];
    }
    const anonymous = letter.isAnonymous === true;
    result.authorName = anonymous ? 'Anonymous Writer' : (letter.user?.username || 'A Writer');
    return result;
}
