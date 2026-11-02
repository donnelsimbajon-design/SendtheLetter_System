import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import User from '../models/User';
import UserBlock from '../models/UserBlock';
import Follow from '../models/Follow';
import Friend from '../models/Friend';

type Authed = Request & { user?: { id: number } };
const otherId = (req: Request) => Number(req.params.userId);

export const getBlockStatus = async (req: Authed, res: Response) => {
    try {
        const me = Number(req.user?.id);
        const other = otherId(req);
        if (!Number.isSafeInteger(other) || other < 1) return res.status(400).json({ message: 'Invalid writer.' });
        if (other === me) return res.json({ blocked: false, canInteract: true });
        const rows = await UserBlock.findAll({ where: {
            [Op.or]: [{ blockerId: me, blockedId: other }, { blockerId: other, blockedId: me }],
        }, attributes: ['blockerId', 'blockedId'] });
        res.setHeader('Cache-Control', 'no-store');
        return res.json({
            blocked: rows.some(row => row.blockerId === me),
            canInteract: rows.length === 0,
        });
    } catch (error) {
        console.error('Could not check block status:', error);
        return res.status(500).json({ message: 'Could not check interaction permissions.' });
    }
};

export const blockWriter = async (req: Authed, res: Response) => {
    try {
        const me = Number(req.user?.id);
        const other = otherId(req);
        if (!Number.isSafeInteger(other) || other < 1 || other === me) {
            return res.status(400).json({ message: 'Choose another writer.' });
        }
        const user = await User.findByPk(other, { attributes: ['id', 'isActive'] });
        if (!user || !user.isActive) return res.status(404).json({ message: 'Writer not found.' });
        await sequelize.transaction(async transaction => {
            await UserBlock.findOrCreate({
                where: { blockerId: me, blockedId: other },
                defaults: { blockerId: me, blockedId: other },
                transaction,
            });
            // Blocking ends existing social relationships but never deletes letters or messages.
            await Follow.destroy({ where: { [Op.or]: [
                { followerId: me, followingId: other }, { followerId: other, followingId: me },
            ] }, transaction });
            await Friend.destroy({ where: { [Op.or]: [
                { requesterId: me, recipientId: other }, { requesterId: other, recipientId: me },
            ] }, transaction });
        });
        return res.json({ blocked: true, canInteract: false });
    } catch (error) {
        console.error('Could not block writer:', error);
        return res.status(500).json({ message: 'Unable to block writer.' });
    }
};

export const unblockWriter = async (req: Authed, res: Response) => {
    try {
        const me = Number(req.user?.id);
        const other = otherId(req);
        if (!Number.isSafeInteger(other) || other < 1 || other === me) return res.status(400).json({ message: 'Invalid writer.' });
        await UserBlock.destroy({ where: { blockerId: me, blockedId: other } });
        const stillBlocked = await UserBlock.findOne({ where: { blockerId: other, blockedId: me }, attributes: ['id'] });
        return res.json({ blocked: false, canInteract: !stillBlocked });
    } catch (error) {
        console.error('Could not unblock writer:', error);
        return res.status(500).json({ message: 'Unable to unblock writer.' });
    }
};
