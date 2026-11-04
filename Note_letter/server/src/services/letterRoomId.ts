/** Strictly parse a client-provided Socket.IO room identifier.
 * Rejects malformed, zero, negative, fractional, whitespace and unsafe IDs.
 */
export function parseLetterRoomId(raw: unknown): number | null {
    if (typeof raw !== 'string' && typeof raw !== 'number') return null;
    const value = String(raw);
    if (!/^[1-9][0-9]*$/.test(value)) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
}
