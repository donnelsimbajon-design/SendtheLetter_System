import { Request, Response } from 'express';
import Notification from '../models/Notification';
import User from '../models/User';
import Letter from '../models/Letter';

interface AuthRequest extends Request {
    user?: any;
}

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.findAll({
            where: { userId },
            include: [
                {
                    model: User,
                    as: 'actor',
                    attributes: ['id', 'username'],
                },
                {
                    model: Letter,
                    as: 'letter',
                    attributes: ['id', 'title'],
                }
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        await Notification.update(
            { isRead: true },
            { where: { userId, isRead: false } }
        );
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/** Update only a notification belonging to the signed-in recipient. */
export const markOneAsRead = async (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid notification ID.' });
    try {
        const [updated] = await Notification.update({ isRead: true }, { where: { id, userId: req.user.id } });
        if (!updated) return res.status(404).json({ message: 'Notification not found.' });
        return res.json({ message: 'Notification marked as read.' });
    } catch (error) {
        console.error('Failed to mark notification read:', error);
        return res.status(500).json({ message: 'Unable to update notification.' });
    }
};
