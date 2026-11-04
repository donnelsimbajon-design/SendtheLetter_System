import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import Letter from '../models/Letter';
import User from '../models/User';
import { publicLetterDTO } from '../services/publicLetterDTO';
import { createRateLimiter } from '../middleware/rateLimit';
import { hashRecipientToken, isVisibleRecipientLetter } from '../services/privateRecipientSecurity';

type OwnerRequest = Request & { user?: { id: number } };
type LinkRow = {
    id: number;
    letterId: number;
    expiresAt: Date | string;
    revokedAt: Date | string | null;
};
const validToken = /^[a-f0-9]{48}$/;
const reactions = ['heart', 'hug', 'smile', 'thanks', 'star'] as const;
const rateLimitReply = createRateLimiter(15 * 60_000, 3);
export const limitRecipientReplies = rateLimitReply;

function idFromRoute(raw: string): number | null {
    const n = Number(raw);
    return /^[1-9][0-9]*$/.test(raw) && Number.isSafeInteger(n) ? n : null;
}
function privateResponse(res: Response) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.setHeader('Referrer-Policy', 'no-referrer');
}
async function activeLink(token: unknown) {
    if (typeof token !== 'string' || !validToken.test(token)) return null;
    const rows = await sequelize.query<LinkRow>(
        'SELECT id, "letterId", "expiresAt", "revokedAt" FROM public.letter_recipient_links ' +
        'WHERE "tokenHash" = :hash AND "revokedAt" IS NULL AND "expiresAt" > now() LIMIT 1',
        { type: QueryTypes.SELECT, replacements: { hash: hashRecipientToken(token) } },
    );
    return rows[0] ?? null;
}
async function readableLetter(link: LinkRow) {
    const letter = await Letter.findOne({
        where: { id: link.letterId, status: 'published', isPublic: false, isArchived: false },
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
    });
    return isVisibleRecipientLetter(letter) ? letter : null;
}
function unavailable(res: Response) {
    privateResponse(res);
    return res.status(404).json({ message: 'This invitation is unavailable or has expired. Ask the writer for a new link.' });
}
function fail(error: unknown, res: Response) {
    // Do not leak token, letter data, names or raw database errors to clients or logs.
    console.error('Recipient sharing operation failed:', error instanceof Error ? error.name : 'unknown');
    return res.status(503).json({ message: 'Letter invitations are temporarily unavailable. Please try again.' });
}

/** Explicit author request; previous link revoked atomically. The raw token is
 * returned exactly once, never stored in the database or included in lists.
 */
export const createRecipientLink = async (req: OwnerRequest, res: Response) => {
    const letterId = idFromRoute(req.params.id);
    const days = req.body?.expiresInDays ?? 7;
    if (letterId === null || ![1, 7, 30].includes(days)) return res.status(400).json({ message: 'Choose a valid letter and an expiry of 1, 7 or 30 days.' });
    try {
        const token = randomBytes(24).toString('hex');
        const expiresAt = new Date(Date.now() + days * 86_400_000);
        const created = await sequelize.transaction(async transaction => {
            const letter = await Letter.findOne({
                where: { id: letterId, userId: req.user!.id }, transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!letter || !isVisibleRecipientLetter(letter)) return false;
            await sequelize.query(
                'UPDATE public.letter_recipient_links SET "revokedAt" = now() ' +
                'WHERE "letterId" = :letterId AND "revokedAt" IS NULL',
                { replacements: { letterId }, transaction },
            );
            await sequelize.query(
                'INSERT INTO public.letter_recipient_links ("letterId", "tokenHash", "expiresAt") ' +
                'VALUES (:letterId, :hash, :expiresAt)',
                { replacements: { letterId, hash: hashRecipientToken(token), expiresAt }, transaction },
            );
            return true;
        });
        privateResponse(res);
        if (!created) return res.status(409).json({ message: 'Only your published, private and currently readable letters can have a recipient invitation.' });
        return res.status(201).json({ token, expiresAt: expiresAt.toISOString(), note: 'Keep this link private. Anyone who receives it can read the letter until you revoke or replace it.' });
    } catch (error) { return fail(error, res); }
};

export const getRecipientLinkStatus = async (req: OwnerRequest, res: Response) => {
    const letterId = idFromRoute(req.params.id);
    if (letterId === null) return res.status(400).json({ message: 'Invalid letter ID.' });
    try {
        const owner = await Letter.findOne({ where: { id: letterId, userId: req.user!.id }, attributes: ['id'] });
        if (!owner) return unavailable(res);
        const rows = await sequelize.query<{ expiresAt: Date | string }>(
            'SELECT "expiresAt" FROM public.letter_recipient_links WHERE "letterId" = :letterId ' +
            'AND "revokedAt" IS NULL AND "expiresAt" > now() ORDER BY "createdAt" DESC LIMIT 1',
            { type: QueryTypes.SELECT, replacements: { letterId } },
        );
        privateResponse(res);
        return res.json({ active: rows.length > 0, expiresAt: rows[0]?.expiresAt ?? null, linkNotRecoverable: true });
    } catch (error) { return fail(error, res); }
};

export const revokeRecipientLinks = async (req: OwnerRequest, res: Response) => {
    const letterId = idFromRoute(req.params.id);
    if (letterId === null) return res.status(400).json({ message: 'Invalid letter ID.' });
    try {
        const owner = await Letter.findOne({ where: { id: letterId, userId: req.user!.id }, attributes: ['id'] });
        if (!owner) return unavailable(res);
        await sequelize.query(
            'UPDATE public.letter_recipient_links SET "revokedAt" = now() ' +
            'WHERE "letterId" = :letterId AND "revokedAt" IS NULL',
            { replacements: { letterId } },
        );
        privateResponse(res);
        return res.json({ revoked: true });
    } catch (error) { return fail(error, res); }
};

/** Bearer-link recipient can read without signing in. Token is hashed before DB lookup.
 * Never return shareToken, recipientAddress, coordinates, email, owner ID, or reply data.
 */
export const readRecipientLetter = async (req: Request, res: Response) => {
    privateResponse(res);
    try {
        const link = await activeLink(req.body?.token);
        if (!link) return unavailable(res);
        const letter = await readableLetter(link);
        if (!letter) return unavailable(res);
        const safe: Record<string, unknown> = { ...publicLetterDTO(letter.toJSON() as Record<string, any>) };
        delete safe.shareToken;
        delete safe.authorId;
        return res.json({ letter: safe, expiresAt: link.expiresAt });
    } catch (error) { return fail(error, res); }
};

/** One optional reply per invitation, enforced by UNIQUE(linkId) in SQL.
 * This deliberately does not pretend to verify the recipient's identity.
 */
export const replyToRecipientLetter = async (req: Request, res: Response) => {
    privateResponse(res);
    const rawName = req.body?.displayName;
    const rawMessage = req.body?.message;
    const reaction = req.body?.reaction;
    if (!(reactions as readonly string[]).includes(reaction) ||
        (rawName != null && (typeof rawName !== 'string' || rawName.length > 60)) ||
        (rawMessage != null && (typeof rawMessage !== 'string' || rawMessage.length > 600))) {
        return res.status(400).json({ message: 'Choose a reaction and an optional short reply (max 600 characters).' });
    }
    const displayName = typeof rawName === 'string' ? rawName.trim().slice(0, 60) || null : null;
    const message = typeof rawMessage === 'string' ? rawMessage.trim().slice(0, 600) || null : null;
    try {
        const link = await activeLink(req.body?.token);
        if (!link || !(await readableLetter(link))) return unavailable(res);
        const rows = await sequelize.query<{ id: number }>(
            'INSERT INTO public.letter_recipient_replies ("linkId", "letterId", "displayName", reaction, message) ' +
            'VALUES (:linkId, :letterId, :displayName, :reaction, :message) ' +
            'ON CONFLICT ("linkId") DO NOTHING RETURNING id',
            {
                type: QueryTypes.SELECT,
                replacements: { linkId: link.id, letterId: link.letterId, displayName, reaction, message },
            },
        );
        if (!rows.length) return res.status(409).json({ message: 'A reply has already been sent from this invitation.' });
        return res.status(201).json({ sent: true, message: 'Your reply was delivered to the writer.' });
    } catch (error) { return fail(error, res); }
};

export const getRecipientReplies = async (req: OwnerRequest, res: Response) => {
    const letterId = idFromRoute(req.params.id);
    if (letterId === null) return res.status(400).json({ message: 'Invalid letter ID.' });
    try {
        const owner = await Letter.findOne({ where: { id: letterId, userId: req.user!.id }, attributes: ['id'] });
        if (!owner) return unavailable(res);
        const rows = await sequelize.query(
            'SELECT reaction, "displayName", message, "createdAt" ' +
            'FROM public.letter_recipient_replies WHERE "letterId" = :letterId ' +
            'ORDER BY "createdAt" DESC LIMIT 20',
            { type: QueryTypes.SELECT, replacements: { letterId } },
        );
        privateResponse(res);
        return res.json(rows);
    } catch (error) { return fail(error, res); }
};
