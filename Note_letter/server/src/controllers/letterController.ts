import { Request, Response } from 'express';
import Letter from '../models/Letter';
import User from '../models/User';
import sequelize from '../config/database';

interface AuthRequest extends Request {
    user?: any;
}

export const createLetter = async (req: AuthRequest, res: Response) => {
    try {
        const {
            title,
            content,
            type,
            isPublic,
            scheduledDate,
            status,
            backgroundImage,
            recipientName,
            recipientAddress,
            spotifyLink,
            font,
            isAnonymous,
            imageUrl
        } = req.body;
        const userId = req.user.id;

        const letter = await Letter.create({
            userId,
            title,
            content,
            type,
            isPublic,
            scheduledDate,
            status: status || 'published',
            backgroundImage,
            recipientName,
            recipientAddress,
            spotifyLink,
            font,
            isAnonymous,
            imageUrl,
        });

        res.status(201).json({ message: 'Letter created successfully', letter });
    } catch (error) {
        console.error('Error creating letter:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMyLetters = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const letters = await Letter.findAll({
            where: { userId, status: 'published' },
            order: [['createdAt', 'DESC']],
        });
        res.json(letters);
    } catch (error) {
        console.error('Error fetching letters:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getDrafts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const letters = await Letter.findAll({
            where: { userId, status: 'draft' },
            order: [['createdAt', 'DESC']],
        });
        res.json(letters);
    } catch (error) {
        console.error('Error fetching drafts:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getPublicLetters = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;

        const { default: Like } = await import('../models/Like');
        const { default: Comment } = await import('../models/Comment');

        const letters = await Letter.findAll({
            where: { isPublic: true, status: 'published' },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        // Fetch like and comment counts for each letter
        const lettersWithCounts = await Promise.all(
            letters.map(async (letter) => {
                const likeCount = await Like.count({ where: { letterId: letter.id } });
                const commentCount = await Comment.count({ where: { letterId: letter.id } });

                let isLikedByUser = false;
                if (userId) {
                    const like = await Like.findOne({
                        where: { letterId: letter.id, userId },
                    });
                    isLikedByUser = !!like;
                }

                const letterData = letter.toJSON() as any;

                return {
                    ...letterData,
                    authorName: letterData.user?.username || 'Unknown',
                    authorAvatar: letterData.user?.avatar || null,
                    authorId: letterData.user?.id || null,
                    likeCount,
                    commentCount,
                    isLikedByUser,
                };
            })
        );

        res.json(lettersWithCounts);
    } catch (error) {
        console.error('Error fetching public letters:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getUserPublicLetters = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const currentUserId = (req as AuthRequest).user?.id;

        const user = await User.findOne({
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('username')),
                sequelize.fn('LOWER', username)
            )
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { default: Like } = await import('../models/Like');
        const { default: Comment } = await import('../models/Comment');

        const letters = await Letter.findAll({
            where: {
                isPublic: true,
                status: 'published',
                userId: user.id,
                isAnonymous: false // Don't show anonymous letters on profile
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        // Fetch like and comment counts for each letter
        const lettersWithCounts = await Promise.all(
            letters.map(async (letter) => {
                const likeCount = await Like.count({ where: { letterId: letter.id } });
                const commentCount = await Comment.count({ where: { letterId: letter.id } });

                let isLikedByUser = false;
                if (currentUserId) {
                    const like = await Like.findOne({
                        where: { letterId: letter.id, userId: currentUserId },
                    });
                    isLikedByUser = !!like;
                }

                const letterData = letter.toJSON() as any;

                return {
                    ...letterData,
                    authorName: letterData.user?.username || 'Unknown',
                    authorAvatar: letterData.user?.avatar || null,
                    authorId: letterData.user?.id || null,
                    likeCount,
                    commentCount,
                    isLikedByUser,
                };
            })
        );

        res.json(lettersWithCounts);
    } catch (error) {
        console.error('Error fetching user public letters:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteLetter = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const letter = await Letter.findByPk(id);

        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        if (letter.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this letter' });
        }

        await letter.destroy();
        res.json({ message: 'Letter deleted successfully' });
    } catch (error) {
        console.error('Error deleting letter:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateLetter = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updates = req.body;

        const letter = await Letter.findByPk(id);

        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        if (letter.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this letter' });
        }

        await letter.update(updates);
        res.json({ message: 'Letter updated successfully', letter });
    } catch (error) {
        console.error('Error updating letter:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateDraft = async (req: AuthRequest, res: Response) => {
    // Re-use updateLetter logic for drafts
    return updateLetter(req, res);
};

export const getScheduledLetters = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const letters = await Letter.findAll({
            where: {
                userId,
                status: 'scheduled'
            },
            order: [['scheduledDate', 'ASC']],
        });
        res.json(letters);
    } catch (error) {
        console.error('Error fetching scheduled letters:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTimeCapsules = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        // Time capsules are just scheduled letters (for now, or logic can differ)
        // Assuming time capsules are a specific 'type' or just handled same as scheduled
        const letters = await Letter.findAll({
            where: {
                userId,
                type: 'Time Capsule',
                status: 'scheduled'
            },
            order: [['scheduledDate', 'ASC']],
        });
        res.json(letters);
    } catch (error) {
        console.error('Error fetching time capsules:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const archiveLetter = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const letter = await Letter.findByPk(id);

        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        if (letter.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await letter.update({ isArchived: true });
        res.json({ message: 'Letter archived successfully', letter });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getArchivedLetters = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;

        const letters = await Letter.findAll({
            where: { userId, isArchived: true },
            order: [['updatedAt', 'DESC']]
        });

        res.json(letters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
