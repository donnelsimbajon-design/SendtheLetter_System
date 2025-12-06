import { Request, Response } from 'express';
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Letter from '../models/Letter';
import User from '../models/User';
import Repost from '../models/Repost';

interface AuthRequest extends Request {
    user?: any;
}

export const toggleRepost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const letterId = parseInt(req.params.id);

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
        const letterId = parseInt(req.params.id);

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
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        const letters = reposts.map((repost: any) => ({
            ...repost.letter.toJSON(),
            repostedAt: repost.createdAt,
            authorName: repost.letter.user?.username,
            authorId: repost.letter.user?.id
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
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('username')),
                sequelize.fn('LOWER', username)
            )
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const reposts = await Repost.findAll({
            where: { userId: user.id },
            include: [{
                model: Letter,
                as: 'letter',
                where: { isPublic: true, status: 'published' }, // Only show public letters
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        const letters = reposts.map((repost: any) => ({
            ...repost.letter.toJSON(),
            repostedAt: repost.createdAt,
            authorName: repost.letter.user?.username,
            authorId: repost.letter.user?.id
        }));

        res.json(letters);
    } catch (error) {
        console.error('Error fetching public reposts:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
