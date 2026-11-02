/**
 * Explicit allowlist for data that can be returned by public letter APIs.
 * Never spread a full Sequelize Letter into a public response: future
 * schema columns (recipient address, coordinates, ownership, etc.) must
 * remain private unless deliberately reviewed and added here.
 */
export function publicLetterDTO(letter: Record<string, any>) {
    const fields = [
        'id', 'title', 'content', 'type', 'isPublic', 'status',
        'isAnonymous', 'isArchived', 'isTimeCapsule', 'shareToken',
        'scheduledDate', 'openDate', 'createdAt', 'updatedAt',
        'backgroundImage', 'recipientName', 'spotifyLink', 'font',
        'imageUrl', 'letterPages',
    ] as const;
    const safe: Record<string, any> = {};
    for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(letter, field)) {
            safe[field] = letter[field];
        }
    }
    const anonymous = letter.isAnonymous === true;
    return {
        ...safe,
        authorName: anonymous ? 'Anonymous Writer' : (letter.user?.username || 'A Writer'),
        authorAvatar: anonymous ? null : (letter.user?.avatar || null),
        authorId: anonymous ? null : (letter.user?.id || null),
    };
}
