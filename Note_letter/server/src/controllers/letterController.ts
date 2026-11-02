import { Request, Response } from 'express';
import axios from 'axios';
import Letter from '../models/Letter';
import User from '../models/User';
import sequelize from '../config/database';
import { Op } from 'sequelize';
import { parseStoryPages } from '../services/storyPageValidation';

interface AuthRequest extends Request {
    user?: any;
}

export const createLetter = async (req: AuthRequest, res: Response) => {
    try {
        const {
            title: rawTitle,
            content,
            type: rawType,
            isPublic: rawIsPublic,
            scheduledDate,
            openDate,
            isTimeCapsule,
            status,
            backgroundImage,
            recipientName,
            recipientAddress,
            spotifyLink,
            font,
            isAnonymous,
            imageUrl,
            letterPages: rawLetterPages
        } = req.body;
        const userId = req.user.id;
        const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
        const type = typeof rawType === 'string' ? rawType.slice(0, 50) : 'General';
        const isPublic = rawIsPublic === true;
        const parsedPages = parseStoryPages(rawLetterPages);
        if (parsedPages.error) return res.status(400).json({ message: parsedPages.error });

        if (!title || title.length > 255 || typeof content !== 'string' || !content.trim() || content.length > 100000) {
            return res.status(400).json({ message: 'A title (max 255 characters) and letter content are required.' });
        }
        if (typeof imageUrl === 'string' && imageUrl.length > 7500000) {
            return res.status(400).json({ message: 'Letter image must be 5 MB or smaller.' });
        }
        if (status !== 'draft' && isTimeCapsule && !openDate) {
            return res.status(400).json({ message: 'Choose an opening date for your Time Capsule' });
        }

        const releaseAt = isTimeCapsule ? openDate : scheduledDate;
        const releaseTime = releaseAt ? new Date(releaseAt).getTime() : null;
        if (releaseTime !== null && !Number.isFinite(releaseTime)) {
            return res.status(400).json({ message: 'Enter a valid release date' });
        }
        const releaseIsFuture = releaseTime !== null && releaseTime > Date.now();
        const effectiveStatus = status === 'draft' ? 'draft' : (releaseIsFuture ? 'scheduled' : (status || 'published'));

        const letter = await Letter.create({
            userId,
            title,
            content,
            type,
            isPublic,
            scheduledDate,
            status: effectiveStatus,
            openDate,
            isTimeCapsule,
            backgroundImage,
            recipientName,
            recipientAddress,
            spotifyLink,
            font,
            isAnonymous,
            imageUrl,
            letterPages: parsedPages.pages,
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
            where: { userId, status: 'published', [Op.or]: [{ openDate: null }, { openDate: { [Op.lte]: new Date() } }] },
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
            where: { isPublic: true, status: 'published', isArchived: false, [Op.or]: [{ openDate: null }, { openDate: { [Op.lte]: new Date() } }] },
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
                isArchived: false,
                userId: user.id,
                isAnonymous: false, // Don't show anonymous letters on profile
                [Op.or]: [{ openDate: null }, { openDate: { [Op.lte]: new Date() } }]
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
        const requestedUpdates = req.body || {};
        const allowedFields = [
            'title', 'content', 'type', 'isPublic', 'scheduledDate', 'openDate',
            'isTimeCapsule', 'backgroundImage', 'recipientName', 'recipientAddress',
            'spotifyLink', 'font', 'isAnonymous', 'imageUrl', 'address',
            'latitude', 'longitude', 'isArchived', 'letterPages',
        ];
        const updates = Object.fromEntries(
            Object.entries(requestedUpdates).filter(([key]) => allowedFields.includes(key))
        );
        if ('letterPages' in updates) {
            const parsedPages = parseStoryPages(updates.letterPages);
            if (parsedPages.error) return res.status(400).json({ message: parsedPages.error });
            updates.letterPages = parsedPages.pages;
        }

        const letter = await Letter.findByPk(id);

        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        if (Number(letter.userId) !== Number(userId)) {
            return res.status(403).json({ message: 'Not authorized to update this letter' });
        }

        const nextIsTimeCapsule = updates.isTimeCapsule ?? letter.isTimeCapsule;
        const nextReleaseAt = nextIsTimeCapsule
            ? (updates.openDate ?? letter.openDate)
            : (updates.scheduledDate ?? letter.scheduledDate);

        if (letter.status !== 'draft' && nextIsTimeCapsule && !nextReleaseAt) {
            return res.status(400).json({ message: 'Choose an opening date for your Time Capsule' });
        }
        if (letter.status !== 'draft' && nextReleaseAt) {
            const releaseTime = nextReleaseAt instanceof Date ? nextReleaseAt.getTime() : Date.parse(String(nextReleaseAt));
            if (!Number.isFinite(releaseTime)) {
                return res.status(400).json({ message: 'Enter a valid scheduled release date' });
            }
            updates.status = releaseTime > Date.now() ? 'scheduled' : 'published';
        } else if (letter.status === 'scheduled' && !nextReleaseAt) {
            updates.status = 'published';
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
                shareToken: req.params.token,
                isPublic: true,
                status: 'published',
                isArchived: false,
                [Op.or]: [{ openDate: null }, { openDate: { [Op.lte]: new Date() } }],
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
            shareToken: data.shareToken,
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
            letterPages: data.letterPages || null,
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
        if (letter.status !== 'published' || letter.isArchived || (letter.scheduledDate && letter.scheduledDate.getTime() > Date.now()) || (letter.isTimeCapsule && letter.openDate && letter.openDate.getTime() > Date.now())) {
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
            ? `${(process.env.APP_BASE_URL || process.env.CLIENT_ORIGIN || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/?s=${encodeURIComponent(letter.shareToken)}`
            : '';
        const publicLinkHtml = publicUrl
            ? `<p><a href="${escapeEmailHtml(publicUrl)}">View this letter on SendTheLetter</a></p>`
            : '';

        recentAttempts.push(now);
        emailSendHistory.set(userId, recentAttempts);

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


/**
 * Social crawler landing response. It exposes metadata only for a currently
 * public, published, non-archived letter, then redirects humans to the SPA.
 */
export const getPublicLetterSharePreview = async (req: Request, res: Response) => {
    try {
        const letter = await Letter.findOne({
            where: {
                shareToken: req.params.token,
                isPublic: true,
                status: 'published',
                isArchived: false,
                [Op.or]: [{ openDate: null }, { openDate: { [Op.lte]: new Date() } }],
            },
        });

        if (!letter) {
            return res.status(404).type('text').send('Public letter not found');
        }

        const appBaseUrl = (process.env.APP_BASE_URL || process.env.CLIENT_ORIGIN || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        const canonicalUrl = `${appBaseUrl}/?s=${encodeURIComponent(letter.shareToken)}`;
        const title = escapeEmailHtml(letter.title || 'A letter from SendTheLetter');
        const description = escapeEmailHtml((letter.content || 'A letter shared with care.').replace(/\s+/g, ' ').slice(0, 200));
        const imageUrl = typeof letter.imageUrl === 'string' && /^https?:\/\//i.test(letter.imageUrl)
            ? letter.imageUrl
            : `${appBaseUrl}/logo.png`;
        const imageTag = `<meta property="og:image" content="${escapeEmailHtml(imageUrl)}">
<meta property="og:image:alt" content="SendTheLetter public letter">
<meta property="og:site_name" content="SendTheLetter">`;

        res.setHeader('Cache-Control', 'public, max-age=300');
        return res.status(200).type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | SendTheLetter</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${escapeEmailHtml(canonicalUrl)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${escapeEmailHtml(canonicalUrl)}">
${imageTag}
<meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta http-equiv="refresh" content="0;url=${escapeEmailHtml(canonicalUrl)}">
</head>
<body><p>Opening your letter… <a href="${escapeEmailHtml(canonicalUrl)}">Continue to SendTheLetter</a></p></body>
</html>`);
    } catch (error) {
        console.error('Error creating public letter preview:', error);
        return res.status(500).type('text').send('Unable to open this letter');
    }
};

/**
 * Publish an existing draft in-place, avoiding duplicate letters after auto-save.
 * Only the owning account may publish it; existing rows are never deleted.
 */
export const publishDraft = async (req: AuthRequest, res: Response) => {
    try {
        const letter = await Letter.findOne({ where: { id: req.params.id, userId: req.user.id, status: 'draft' } });
        if (!letter) return res.status(404).json({ message: 'Draft not found. Reload your drafts and try again.' });
        const fields = req.body || {};
        const title = typeof fields.title === 'string' ? fields.title.trim() : '';
        const content = typeof fields.content === 'string' ? fields.content.trim() : '';
        if (!title || title.length > 255 || !content || content.length > 100000) {
            return res.status(400).json({ message: 'A title and letter content are required.' });
        }
        if (typeof fields.imageUrl === 'string' && fields.imageUrl.length > 7500000) {
            return res.status(400).json({ message: 'Letter image is too large.' });
        }
        const parsedPages = parseStoryPages(fields.letterPages);
        if (parsedPages.error) return res.status(400).json({ message: parsedPages.error });
        const capsule = fields.isTimeCapsule === true;
        if (capsule && !fields.openDate) return res.status(400).json({ message: 'Choose a time capsule opening date.' });
        const releaseValue = capsule ? fields.openDate : fields.scheduledDate;
        const release = releaseValue ? new Date(releaseValue) : null;
        if (release && !Number.isFinite(release.getTime())) {
            return res.status(400).json({ message: 'Enter a valid release date.' });
        }
        const effectiveStatus = release && release.getTime() > Date.now() ? 'scheduled' : 'published';
        await letter.update({
            title, content,
            type: typeof fields.type === 'string' ? fields.type.slice(0, 50) : letter.type,
            recipientName: typeof fields.recipientName === 'string' ? fields.recipientName.slice(0, 255) : letter.recipientName,
            recipientAddress: typeof fields.recipientAddress === 'string' ? fields.recipientAddress.slice(0, 255) : letter.recipientAddress,
            font: typeof fields.font === 'string' ? fields.font : letter.font,
            spotifyLink: typeof fields.spotifyLink === 'string' ? fields.spotifyLink.slice(0, 2048) : letter.spotifyLink,
            backgroundImage: typeof fields.backgroundImage === 'string' ? fields.backgroundImage : letter.backgroundImage,
            imageUrl: typeof fields.imageUrl === 'string' ? fields.imageUrl : letter.imageUrl,
            letterPages: parsedPages.pages,
            isPublic: fields.isPublic === true,
            isAnonymous: fields.isAnonymous === true,
            scheduledDate: fields.scheduledDate || null,
            openDate: fields.openDate || null,
            isTimeCapsule: capsule,
            status: effectiveStatus,
        });
        res.setHeader('Cache-Control', 'no-store');
        return res.json({ message: effectiveStatus === 'scheduled' ? 'Letter scheduled successfully.' : 'Letter published successfully.', letter });
    } catch (error) {
        console.error('Unable to publish draft:', error);
        return res.status(500).json({ message: 'Could not publish your draft.' });
    }
};
