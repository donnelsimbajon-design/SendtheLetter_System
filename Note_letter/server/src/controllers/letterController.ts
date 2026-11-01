import { Request, Response } from 'express';
import axios from 'axios';
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


/**
 * Public letter detail endpoint.
 * Only published, explicitly public letters can be resolved by a share URL.
 */
export const getPublicLetterById = async (req: Request, res: Response) => {
    try {
        const letter = await Letter.findOne({
            where: {
                id: req.params.id,
                isPublic: true,
                status: 'published',
                isArchived: false,
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'avatar'],
            }],
        });

        if (!letter) {
            return res.status(404).json({ message: 'Public letter not found' });
        }

        const data = letter.toJSON() as any;
        const author = data.user;

        return res.json({
            id: data.id,
            title: data.title,
            content: data.content,
            type: data.type,
            isPublic: true,
            status: data.status,
            isAnonymous: Boolean(data.isAnonymous),
            authorName: data.isAnonymous ? 'Anonymous' : (author?.username || 'Unknown'),
            authorAvatar: data.isAnonymous ? null : (author?.avatar || null),
            createdAt: data.createdAt,
            backgroundImage: data.backgroundImage,
            imageUrl: data.imageUrl,
            font: data.font,
        });
    } catch (error) {
        console.error('Error fetching public letter:', error);
        return res.status(500).json({ message: 'Unable to load this letter' });
    }
};


const emailSendHistory = new Map<number, number[]>();
const escapeEmailHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Sends a published letter by email through Resend.
 * The sender must own the letter; private content is sent only after this
 * explicit authenticated action and is never exposed through a public URL.
 */
export const sendLetterByEmail = async (req: AuthRequest, res: Response) => {
    const userId = Number(req.user?.id);
    try {
        const recipientEmail = String(req.body?.recipientEmail || '').trim().toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!emailPattern.test(recipientEmail) || recipientEmail.length > 254) {
            return res.status(400).json({ message: 'Enter a valid recipient email address' });
        }

        const letter = await Letter.findByPk(req.params.id);
        if (!letter) return res.status(404).json({ message: 'Letter not found' });
        if (Number(letter.userId) !== userId) {
            return res.status(403).json({ message: 'Only the letter author can send it by email' });
        }
        if (letter.status !== 'published' || letter.isArchived || (letter.scheduledDate && new Date(letter.scheduledDate) > new Date())) {
            return res.status(409).json({ message: 'Only available, published letters can be emailed' });
        }

        const now = Date.now();
        const recentAttempts = (emailSendHistory.get(userId) || []).filter((time) => now - time < 60 * 60 * 1000);
        if (recentAttempts.length >= 5) {
            return res.status(429).json({ message: 'Email sharing limit reached. Try again later.' });
        }

        const apiKey = process.env.RESEND_API_KEY;
        const from = process.env.EMAIL_FROM;
        if (!apiKey || !from) {
            return res.status(503).json({ message: 'Email delivery is not configured yet' });
        }

        const safeTitle = escapeEmailHtml(letter.title || 'A letter from SendTheLetter');
        const safeContent = escapeEmailHtml(letter.content || '').replace(/\r?\n/g, '<br>');
        const publicUrl = letter.isPublic
            ? `${(process.env.APP_BASE_URL || '').replace(/\/$/, '')}/letters/${letter.id}`
            : '';
        const publicLinkHtml = publicUrl
            ? `<p><a href="${escapeEmailHtml(publicUrl)}">View this letter on SendTheLetter</a></p>`
            : '';

        const response = await axios.post('https://api.resend.com/emails', {
            from,
            to: [recipientEmail],
            subject: letter.title || 'A letter from SendTheLetter',
            html: `<main style="font-family:Georgia,serif;line-height:1.7;color:#263b35;max-width:640px;margin:auto"><h1>${safeTitle}</h1><div>${safeContent}</div>${publicLinkHtml}<p style="color:#8a8d84;font:12px Arial,sans-serif">Sent with care via SendTheLetter.</p></main>`,
            text: `${letter.title || 'A letter from SendTheLetter'}\n\n${letter.content || ''}${publicUrl ? `\n\nView online: ${publicUrl}` : ''}\n\nSent with care via SendTheLetter.`,
        }, {
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 15000,
        });

        recentAttempts.push(now);
        emailSendHistory.set(userId, recentAttempts);
        return res.status(202).json({
            message: 'Letter email accepted by the delivery provider',
            providerMessageId: response.data?.id || null,
        });
    } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        console.error('Letter email delivery failed:', status || 'provider/network error');
        return res.status(502).json({ message: 'Email could not be delivered. Please try again later.' });
    }
};
