import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Letter from '../models/Letter';
import User from '../models/User';
import Repost from '../models/Repost';
import { publicLetterDTO } from '../services/publicLetterDTO';

interface AuthRequest extends Request {
    user?: any;
}

export const toggleRepost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const letterId = Number(req.params.id);
        if (!Number.isInteger(letterId) || letterId < 1) return res.status(400).json({ message: 'Invalid letter ID.' });
        const letter = await Letter.findByPk(letterId);
        if (!letter || !letter.isPublic || letter.status !== 'published' || letter.isArchived || (letter.openDate && letter.openDate.getTime() > Date.now()) || (letter.scheduledDate && letter.scheduledDate.getTime() > Date.now())) return res.status(404).json({ message: 'Public letter not found.' });
        const author = await User.findByPk(letter.userId);
        if (!author || !author.isActive) return res.status(404).json({ message: 'Public letter not found.' });

        const existingRepost = await Repost.findOne({
            where: { userId, letterId }
        });

        if (existingRepost) {
            await existingRepost.destroy();
            res.json({ reposted: false });
        } else {
            await Repost.create({ userId, letterId });
            res.json({ reposted: true });
        }
    } catch (error) {
        console.error('Error toggling repost:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const checkRepostStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const letterId = Number(req.params.id);
        if (!Number.isInteger(letterId) || letterId < 1) return res.status(400).json({ message: 'Invalid letter ID.' });
        const letter = await Letter.findByPk(letterId);
        if (!letter || !letter.isPublic || letter.status !== 'published' || letter.isArchived || (letter.openDate && letter.openDate.getTime() > Date.now()) || (letter.scheduledDate && letter.scheduledDate.getTime() > Date.now())) return res.status(404).json({ message: 'Public letter not found.' });

        const repost = await Repost.findOne({
            where: { userId, letterId }
        });

        const count = await Repost.count({
            where: { letterId }
        });

        res.json({
            reposted: !!repost,
            count
        });
    } catch (error) {
        console.error('Error checking repost status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getUserReposts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;

        const reposts = await Repost.findAll({
            where: { userId },
            include: [{
                model: Letter,
                as: 'letter',
                where: { isPublic: true, status: 'published', isArchived: false, [Op.and]: [
                    { [Op.or]: [{ openDate: null }, { openDate: { [Op.lte]: new Date() } }] },
                    { [Op.or]: [{ scheduledDate: null }, { scheduledDate: { [Op.lte]: new Date() } }] },
                ] },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                    where: { isActive: true },
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        const letters = reposts.map((repost: any) => ({
            ...publicLetterDTO(repost.letter.toJSON()),
            repostedAt: repost.createdAt,
        }));

        res.json(letters);
    } catch (error) {
        console.error('Error fetching reposts:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getPublicUserReposts = async (req: AuthRequest, res: Response) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({
            where: { username: { [Op.iLike]: username }, isActive: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const reposts = await Repost.findAll({
            where: { userId: user.id },
            include: [{
                model: Letter,
                as: 'letter',
                where: { isPublic: true, status: 'published', isArchived: false, [Op.and]: [
                    { [Op.or]: [{ openDate: null }, { openDate: { [Op.lte]: new Date() } }] },
                    { [Op.or]: [{ scheduledDate: null }, { scheduledDate: { [Op.lte]: new Date() } }] },
                ] },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                    where: { isActive: true },
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        const letters = reposts.map((repost: any) => ({
            ...publicLetterDTO(repost.letter.toJSON()),
            repostedAt: repost.createdAt,
        }));

        res.json(letters);
    } catch (error) {
        console.error('Error fetching public reposts:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
