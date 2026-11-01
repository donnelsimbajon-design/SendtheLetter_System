import { Request, Response } from 'express';
import { QueryTypes, Op } from 'sequelize';
import sequelize from '../config/database';
import Letter from '../models/Letter';
import { createRateLimiter } from '../middleware/rateLimit';

const GIFTS = ['heart', 'flower', 'star', 'hug', 'sparkles'] as const;
const shareTokenPattern = /^[a-f0-9]{48}$/;
const imagePattern = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const rate = createRateLimiter(10 * 60 * 1000, 8);

async function findVisibleLetter(token: string) {
    if (!shareTokenPattern.test(token)) return null;
    return Letter.findOne({
        where: {
            shareToken: token,
            isPublic: true,
            status: 'published',
            isArchived: false,
            [Op.or]: [{ openDate: null }, { openDate: { [Op.lte]: new Date() } }],
        },
    });
}

export const guestRateLimit = rate;

export const getGuestInteractions = async (req: Request, res: Response) => {
    try {
        const letter = await findVisibleLetter(req.params.token);
        if (!letter) return res.status(404).json({ message: 'This public letter is unavailable.' });

        const entries = await sequelize.query(
            'SELECT id, "displayName", kind, content, "imageData", reaction, "createdAt" FROM public.letter_guest_interactions WHERE "letterId" = :letterId ORDER BY "createdAt" DESC LIMIT 60',
            { replacements: { letterId: letter.id }, type: QueryTypes.SELECT }
        );
        const totals = await sequelize.query(
            "SELECT reaction, count(*)::int AS count FROM public.letter_guest_interactions WHERE \"letterId\" = :letterId AND kind = 'gift' GROUP BY reaction",
            { replacements: { letterId: letter.id }, type: QueryTypes.SELECT }
        );
        res.setHeader('Cache-Control', 'no-store');
        return res.json({ entries, totals });
    } catch (error) {
        console.error('Unable to get guest interactions:', error);
        return res.status(500).json({ message: 'Unable to load guest reactions.' });
    }
};

export const postGuestInteraction = async (req: Request, res: Response) => {
    try {
        const letter = await findVisibleLetter(req.params.token);
        if (!letter) return res.status(404).json({ message: 'This public letter is unavailable.' });

        const name = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : '';
        const kind = req.body?.kind;
        const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
        const reaction = req.body?.reaction;
        const imageData = req.body?.imageData;
        if (name.length < 2 || name.length > 40 || /[<>\x00-\x1f]/.test(name)) {
            return res.status(400).json({ message: 'Enter a display name between 2 and 40 characters.' });
        }
        if (kind !== 'comment' && kind !== 'gift') {
            return res.status(400).json({ message: 'Unsupported interaction.' });
        }

        let savedImage: string | null = null;
        let savedContent: string | null = null;
        let savedReaction: string | null = null;

        if (kind === 'comment') {
            if (content.length > 1200) return res.status(400).json({ message: 'Comment is too long (max 1,200 characters).' });
            if (imageData != null && imageData !== '') {
                if (typeof imageData !== 'string' || imageData.length > 480000) return res.status(400).json({ message: 'Photo must be under 350 KB.' });
                const match = imageData.match(imagePattern);
                if (!match) return res.status(400).json({ message: 'Only PNG, JPG, and WebP photos are allowed.' });
                const bytes = Buffer.from(match[2], 'base64');
                const png = bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
                const jpg = bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'));
                const webp = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
                const valid = match[1] === 'png' ? png : match[1] === 'jpeg' ? jpg : webp;
                if (!valid || bytes.length > 350 * 1024 || bytes.length < 16) return res.status(400).json({ message: 'Invalid or oversized photo.' });
                savedImage = imageData;
            }
            if (!content && !savedImage) return res.status(400).json({ message: 'Write a message or attach a photo.' });
            savedContent = content || null;
        } else {
            if (typeof reaction !== 'string' || !(GIFTS as readonly string[]).includes(reaction)) return res.status(400).json({ message: 'Choose an available gift.' });
            if (content || imageData) return res.status(400).json({ message: 'Gifts cannot include a message or photo.' });
            savedReaction = reaction;
        }

        const [row] = await sequelize.query(
            'INSERT INTO public.letter_guest_interactions ("letterId", "displayName", kind, content, "imageData", reaction) VALUES (:letterId, :name, :kind, :content, :imageData, :reaction) RETURNING id, "displayName", kind, content, "imageData", reaction, "createdAt"',
            { replacements: { letterId: letter.id, name, kind, content: savedContent, imageData: savedImage, reaction: savedReaction }, type: QueryTypes.SELECT }
        );
        res.setHeader('Cache-Control', 'no-store');
        return res.status(201).json({ entry: row });
    } catch (error) {
        console.error('Unable to save guest interaction:', error);
        return res.status(500).json({ message: 'Unable to post your reaction.' });
    }
};
