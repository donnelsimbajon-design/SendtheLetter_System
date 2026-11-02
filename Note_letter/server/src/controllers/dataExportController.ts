import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import User from '../models/User';
import Letter from '../models/Letter';
import Message from '../models/Message';
import Follow from '../models/Follow';
import Friend from '../models/Friend';
import Notification from '../models/Notification';
import Comment from '../models/Comment';
import Like from '../models/Like';
import Repost from '../models/Repost';
import sequelize from '../config/database';

type Authed = Request & { user?: { id: number } };

/** Export only records belonging to the authenticated account.
 * Never expose password hashes, server tokens, or other users' private letters.
 */
export const exportAccountData = async (req: Authed, res: Response) => {
    try {
        const userId = Number(req.user?.id);
        if (!Number.isSafeInteger(userId) || userId <= 0) return res.status(401).json({ message: 'Sign in to download your data.' });
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'bio', 'avatar', 'coverImage', 'location', 'createdAt', 'updatedAt'],
        });
        if (!user || !user.isActive) return res.status(404).json({ message: 'Account unavailable.' });
        const [
            letters, messages, follows, friends, notifications, comments, likes, reposts, guestInteractions,
        ] = await Promise.all([
            Letter.findAll({ where: { userId }, order: [['id', 'ASC']] }),
            Message.findAll({ where: { [Op.or]: [{ senderId: userId }, { receiverId: userId }] }, order: [['id', 'ASC']] }),
            Follow.findAll({ where: { [Op.or]: [{ followerId: userId }, { followingId: userId }] } }),
            Friend.findAll({ where: { [Op.or]: [{ requesterId: userId }, { recipientId: userId }] } }),
            Notification.findAll({ where: { userId } }),
            Comment.findAll({ where: { userId } }),
            Like.findAll({ where: { userId } }),
            Repost.findAll({ where: { userId } }),
            sequelize.query(
                'SELECT id, "letterId", "displayName", kind, content, "imageData", reaction, "createdAt" FROM public.letter_guest_interactions WHERE "userId" = :userId ORDER BY id',
                { replacements: { userId }, type: QueryTypes.SELECT },
            ),
        ]);
        res.setHeader('Cache-Control', 'private, no-store');
        res.setHeader('Content-Disposition', 'attachment; filename="sendtheletter-my-data.json"');
        return res.json({
            schemaVersion: 1,
            exportedAt: new Date().toISOString(),
            account: user.toJSON(),
            letters: letters.map(x => x.toJSON()),
            messages: messages.map(x => x.toJSON()),
            follows: follows.map(x => x.toJSON()),
            penPalRequests: friends.map(x => x.toJSON()),
            notifications: notifications.map(x => x.toJSON()),
            comments: comments.map(x => x.toJSON()),
            likes: likes.map(x => x.toJSON()),
            reposts: reposts.map(x => x.toJSON()),
            publicThreadPosts: guestInteractions,
        });
    } catch (error) {
        console.error('Account export failed:', error);
        return res.status(500).json({ message: 'Could not prepare your data export.' });
    }
};
