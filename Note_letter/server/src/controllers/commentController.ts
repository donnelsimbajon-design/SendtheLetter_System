import { Request, Response } from 'express';
import Comment from '../models/Comment';
import User from '../models/User';
import Letter from '../models/Letter';

interface AuthRequest extends Request {
    user?: any;
}

export const createComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id: letterId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        // Check if letter exists and is public
        const letter = await Letter.findByPk(letterId);
        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        const comment = await Comment.create({
            letterId: parseInt(letterId),
            userId,
            content,
        });

        // Fetch the comment with user info
        const commentWithUser = await Comment.findByPk(comment.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                },
            ],
        });

        // Format response to match frontend expectations
        const formattedComment = {
            id: commentWithUser!.id,
            letterId: commentWithUser!.letterId,
            userId: commentWithUser!.userId,
            content: commentWithUser!.content,
            createdAt: commentWithUser!.createdAt,
            user: {
                id: (commentWithUser as any).user?.id,
                username: (commentWithUser as any).user?.username || 'Unknown',
                avatar: (commentWithUser as any).user?.avatar,
            }
        };

        // Create notification for letter owner if it's not their own comment
        if (letter.userId !== userId) {
            const { default: Notification } = await import('../models/Notification');
            const notification = await Notification.create({
                userId: letter.userId,
                actorId: userId,
                type: 'comment',
                entityId: letter.id,
            });

            // Emit real-time notification
            const io = (req as any).app.get('io');
            if (io) {
                // Fetch notification with user details
                const notificationWithDetails = await Notification.findByPk(notification.id, {
                    include: [
                        { model: User, as: 'actor', attributes: ['id', 'username'] },
                        { model: Letter, as: 'letter', attributes: ['id', 'title'] }
                    ]
                });
                io.to(`user_${letter.userId}`).emit('new_notification', notificationWithDetails);
            }
        }

        // Emit real-time comment to letter room
        const io = (req as any).app.get('io');
        if (io) {
            io.to(`letter_${letterId}`).emit('new_comment', formattedComment);
        }

        res.status(201).json({ message: 'Comment created successfully', comment: formattedComment });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getComments = async (req: Request, res: Response) => {
    try {
        const { id: letterId } = req.params;

        const comments = await Comment.findAll({
            where: { letterId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        // Format comments to match frontend expectations
        const formattedComments = comments.map((comment: any) => ({
            id: comment.id,
            letterId: comment.letterId,
            userId: comment.userId,
            content: comment.content,
            createdAt: comment.createdAt,
            user: {
                id: comment.user?.id,
                username: comment.user?.username || 'Unknown',
                avatar: comment.user?.avatar,
            }
        }));

        res.json(formattedComments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id: letterId, commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findOne({
            where: { id: commentId, letterId },
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user owns the comment
        if (comment.userId !== userId) {
            return res.status(403).json({ message: 'You can only delete your own comments' });
        }

        await comment.destroy();
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
