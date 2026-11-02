import { Request, Response } from 'express';
import Like from '../models/Like';
import Letter from '../models/Letter';
import { isBlockedBetween } from '../services/blockService';

interface AuthRequest extends Request {
    user?: any;
}

export const toggleLike = async (req: AuthRequest, res: Response) => {
    try {
        const { id: letterId } = req.params;
        const userId = req.user.id;

        // Check if letter exists
        const letter = await Letter.findByPk(letterId);
        const isOwner = !!letter && Number(letter.userId) === Number(userId);
        const notReleased = !!letter && (
            (letter.openDate && letter.openDate.getTime() > Date.now()) ||
            (letter.scheduledDate && letter.scheduledDate.getTime() > Date.now())
        );
        if (!letter || letter.isArchived || letter.status !== 'published' || (!isOwner && (!letter.isPublic || notReleased))) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        if (await isBlockedBetween(userId, letter.userId)) return res.status(403).json({ message: 'Reactions are unavailable between these accounts.' });

        // Check if like already exists
        const existingLike = await Like.findOne({
            where: { letterId, userId },
        });

        if (existingLike) {
            // Unlike
            await existingLike.destroy();
            const likeCount = await Like.count({ where: { letterId } });

            // Emit real-time like update
            const io = (req as any).app.get('io');
            if (io) {
                io.to(`letter_${letterId}`).emit('like_update', { letterId, likeCount, liked: false });
            }

            return res.json({ message: 'Like removed', liked: false, likeCount });
        } else {
            // Like
            await Like.create({
                letterId: parseInt(letterId),
                userId,
            });

            // Create notification
            if (letter.userId !== userId) {
                const { default: Notification } = await import('../models/Notification');
                const { default: User } = await import('../models/User');
                const notification = await Notification.create({
                    userId: letter.userId,
                    actorId: userId,
                    type: 'like',
                    entityId: letter.id,
                    letterId: letter.id,
                });

                // Emit real-time notification
                const io = (req as any).app.get('io');
                if (io) {
                    const notificationWithDetails = await Notification.findByPk(notification.id, {
                        include: [
                            { model: User, as: 'actor', attributes: ['id', 'username'] },
                            { model: Letter, as: 'letter', attributes: ['id', 'title'] }
                        ]
                    });
                    io.to(`user_${letter.userId}`).emit('new_notification', notificationWithDetails);
                }
            }

            const likeCount = await Like.count({ where: { letterId } });

            // Emit real-time like update
            const io = (req as any).app.get('io');
            if (io) {
                io.to(`letter_${letterId}`).emit('like_update', { letterId, likeCount, liked: true });
            }

            return res.json({ message: 'Like added', liked: true, likeCount });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getLikes = async (req: AuthRequest, res: Response) => {
    try {
        const { id: letterId } = req.params;
        const userId = req.user?.id;
        const letter = await Letter.findByPk(letterId);
        const isOwner = !!letter && Number(letter.userId) === Number(userId);
        const notReleased = !!letter && (
            (letter.openDate && letter.openDate.getTime() > Date.now()) ||
            (letter.scheduledDate && letter.scheduledDate.getTime() > Date.now())
        );
        if (!letter || letter.isArchived || letter.status !== 'published' || (!isOwner && (!letter.isPublic || notReleased))) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        const likeCount = await Like.count({ where: { letterId } });

        let isLikedByUser = false;
        if (userId) {
            const like = await Like.findOne({
                where: { letterId, userId },
            });
            isLikedByUser = !!like;
        }

        res.json({ likeCount, isLikedByUser });
    } catch (error) {
        console.error('Error fetching likes:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
