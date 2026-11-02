import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import Letter from '../models/Letter';
import Comment from '../models/Comment';
import User from '../models/User';
import { createRateLimiter } from '../middleware/rateLimit';

type AuthedRequest = Request & { user?: { id: number; username: string } };
const validToken = /^[a-f0-9]{48}$/;
const giftChoices = ['heart', 'flower', 'star', 'hug', 'sparkles'];
const limiter = createRateLimiter(10 * 60 * 1000, 8);
export const limitThreadPosts = limiter;

async function publishedLetter(token: string) {
    if (!validToken.test(token)) return null;
    return Letter.findOne({
        where: {
            shareToken: token,
            isPublic: true,
            status: 'published',
            isArchived: false,
            [Op.and]: [
                { [Op.or]: [{ openDate: null }, { openDate: { [Op.lte]: new Date() } }] },
                { [Op.or]: [{ scheduledDate: null }, { scheduledDate: { [Op.lte]: new Date() } }] },
            ],
        },
    });
}

type GuestRow = {
    id: number;
    displayName: string;
    kind: 'comment' | 'gift';
    content: string | null;
    imageData: string | null;
    reaction: string | null;
    createdAt: Date | string;
    userId: number | null;
    username: string | null;
    avatar: string | null;
};

function validPicture(data: unknown): data is string {
    if (typeof data !== 'string' || data.length > 480000) return false;
    const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(data);
    if (!match) return false;
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length < 16 || bytes.length > 350 * 1024) return false;
    const png = bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
    const jpg = bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'));
    const webp = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
    return match[1] === 'png' ? png : match[1] === 'jpeg' ? jpg : webp;
}

/**
 * Public thread merges legacy account comments with new guest/photo/gift interactions.
 * Only explicitly published, visible public letters may be read.
 */
export const getPublicThread = async (req: Request, res: Response) => {
    try {
        const letter = await publishedLetter(req.params.token);
        if (!letter) return res.status(404).json({ message: 'This letter is not available.' });

        const [legacy, interactions, totals] = await Promise.all([
            Comment.findAll({
                where: { letterId: letter.id },
                include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
                order: [['createdAt', 'DESC']],
                limit: 60,
            }),
            sequelize.query<GuestRow>(
                'SELECT g.id, g."displayName", g.kind, g.content, g."imageData", g.reaction, g."createdAt", g."userId", u.username, u.avatar FROM public.letter_guest_interactions g LEFT JOIN public.users u ON u.id = g."userId" WHERE g."letterId" = :letterId ORDER BY g."createdAt" DESC LIMIT 60',
                { replacements: { letterId: letter.id }, type: QueryTypes.SELECT }
            ),
            sequelize.query<{ reaction: string; count: number }>(
                "SELECT reaction, count(*)::int AS count FROM public.letter_guest_interactions WHERE \"letterId\" = :letterId AND kind = 'gift' GROUP BY reaction",
                { replacements: { letterId: letter.id }, type: QueryTypes.SELECT }
            ),
        ]);

        const posts = [
            ...legacy.map((comment) => {
                const data = comment.toJSON() as any;
                return {
                    id: `member-${data.id}`,
                    kind: 'comment' as const,
                    source: 'account' as const,
                    displayName: data.user?.username || 'Member',
                    avatar: data.user?.avatar || null,
                    content: data.content,
                    imageData: null,
                    reaction: null,
                    createdAt: data.createdAt,
                };
            }),
            ...interactions.map((entry) => ({
                id: `guestbook-${entry.id}`,
                kind: entry.kind,
                source: entry.userId ? 'account' as const : 'guest' as const,
                displayName: entry.userId ? (entry.username || 'Member') : entry.displayName,
                avatar: entry.userId ? entry.avatar : null,
                content: entry.content,
                imageData: entry.imageData,
                reaction: entry.reaction,
                createdAt: entry.createdAt,
            })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 80);

        res.setHeader('Cache-Control', 'no-store');
        return res.json({ entries: posts, totals, commentCount: posts.filter(p => p.kind === 'comment').length });
    } catch (error) {
        console.error('Unable to read public comments:', error);
        return res.status(500).json({ message: 'Unable to load comments.' });
    }
};

/** Account identity is derived from a verified JWT, never from submitted display names. */
export const postPublicThread = async (req: AuthedRequest, res: Response) => {
    try {
        const letter = await publishedLetter(req.params.token);
        if (!letter) return res.status(404).json({ message: 'This letter is not available.' });

        const mode = req.body?.mode === 'account' ? 'account' : req.body?.mode === 'guest' ? 'guest' : null;
        const kind = req.body?.kind;
        if (!mode || (kind !== 'comment' && kind !== 'gift')) {
            return res.status(400).json({ message: 'Choose an interaction mode and type.' });
        }

        let userId: number | null = null;
        let displayName: string;
        if (mode === 'account') {
            if (!req.user) return res.status(401).json({ message: 'Sign in to comment with your account.' });
            const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'isActive'] });
            if (!user?.isActive) return res.status(401).json({ message: 'Account unavailable. Sign in again.' });
            userId = user.id;
            displayName = user.username.slice(0, 40);
        } else {
            const name = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : '';
            if (name.length < 2 || name.length > 40 || /[<>\x00-\x1f]/.test(name)) {
                return res.status(400).json({ message: 'Enter a nickname between 2 and 40 characters.' });
            }
            displayName = name;
        }

        let content: string | null = null;
        let imageData: string | null = null;
        let reaction: string | null = null;
        if (kind === 'comment') {
            const rawContent = typeof req.body.content === 'string' ? req.body.content.trim() : '';
            if (rawContent.length > 1200) return res.status(400).json({ message: 'Comments can be up to 1,200 characters.' });
            const picture = req.body.imageData;
            if (picture != null && picture !== '') {
                if (!validPicture(picture)) return res.status(400).json({ message: 'Only valid JPG, PNG or WebP photos under 350 KB are allowed.' });
                imageData = picture;
            }
            if (!rawContent && !imageData) return res.status(400).json({ message: 'Write a comment or add a photo.' });
            content = rawContent || null;
        } else {
            if (!giftChoices.includes(req.body?.reaction)) return res.status(400).json({ message: 'Choose a valid gift reaction.' });
            if (req.body?.content || req.body?.imageData) return res.status(400).json({ message: 'Gift reactions cannot include a message or photo.' });
            reaction = req.body.reaction;
        }

        const [saved] = await sequelize.query<{ id: number }>(
            'INSERT INTO public.letter_guest_interactions ("letterId", "userId", "displayName", kind, content, "imageData", reaction) VALUES (:letterId, :userId, :displayName, :kind, :content, :imageData, :reaction) RETURNING id',
            {
                replacements: {
                    letterId: letter.id, userId, displayName, kind, content, imageData, reaction,
                },
                type: QueryTypes.SELECT,
            }
        );

        // Only authenticated members can create a linked notification.
        if (userId && userId !== letter.userId && kind === 'comment') {
            try {
                const { default: Notification } = await import('../models/Notification');
                const notification = await Notification.create({
                    userId: letter.userId,
                    actorId: userId,
                    type: 'comment',
                    entityId: letter.id,
                    letterId: letter.id,
                });
                const io = req.app.get('io');
                if (io) {
                    const detailed = await Notification.findByPk(notification.id, {
                        include: [
                            { model: User, as: 'actor', attributes: ['id', 'username'] },
                            { model: Letter, as: 'letter', attributes: ['id', 'title'] },
                        ],
                    });
                    io.to(`user_${letter.userId}`).emit('new_notification', detailed || notification);
                }
            } catch (notificationError) {
                console.error('Comment saved, but notification could not be delivered:', notificationError);
            }
        }
        res.setHeader('Cache-Control', 'no-store');
        return res.status(201).json({ message: 'Posted successfully.', id: saved.id });
    } catch (error) {
        console.error('Unable to post public interaction:', error);
        return res.status(500).json({ message: 'Unable to save your comment.' });
    }
};
