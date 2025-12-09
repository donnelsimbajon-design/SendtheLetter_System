import { Request, Response } from 'express';
import Friend from '../models/Friend';
import User from '../models/User';
import { Op } from 'sequelize';
import Notification from '../models/Notification';

interface AuthRequest extends Request {
    user?: any;
}

export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
    try {
        const requesterId = req.user.id;
        const { recipientId } = req.body;

        if (requesterId === recipientId) {
            return res.status(400).json({ message: 'Cannot add yourself' });
        }

        const existing = await Friend.findOne({
            where: {
                [Op.or]: [
                    { requesterId, recipientId },
                    { requesterId: recipientId, recipientId: requesterId }
                ]
            }
        });

        if (existing) {
            if (existing.status === 'pending') {
                return res.status(400).json({ message: 'Request already pending' });
            }
            if (existing.status === 'accepted') {
                return res.status(400).json({ message: 'Already friends' });
            }
        }

        const friendRequest = await Friend.create({
            requesterId,
            recipientId,
            status: 'pending'
        });

        // Create Notification
        const notification = await Notification.create({
            userId: recipientId,
            actorId: requesterId,
            type: 'friend_request',
            entityId: friendRequest.id,
        });

        // Emit socket event
        const io = (req as any).app.get('io');
        if (io) {
            const notificationWithDetails = await Notification.findByPk(notification.id, {
                include: [{ model: User, as: 'actor', attributes: ['id', 'username', 'avatar'] }]
            });
            io.to(`user_${recipientId}`).emit('new_notification', notificationWithDetails);
        }

        res.json(friendRequest);
    } catch (error: any) {
        console.error('Error sending friend request:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.body;

        const friendRequest = await Friend.findOne({
            where: { id: requestId, recipientId: userId, status: 'pending' }
        });

        if (!friendRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        friendRequest.status = 'accepted';
        await friendRequest.save();

        // Notify requester
        const io = (req as any).app.get('io');
        if (io) {
            io.to(`user_${friendRequest.requesterId}`).emit('friend_accepted', {
                friendId: userId,
                // could send more user info here
            });
        }

        res.json({ message: 'Friend request accepted' });
    } catch (error: any) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const getFriends = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;

        const friends = await Friend.findAll({
            where: {
                [Op.or]: [
                    { requesterId: userId, status: 'accepted' },
                    { recipientId: userId, status: 'accepted' }
                ]
            },
            include: [
                { model: User, as: 'requester', attributes: ['id', 'username', 'avatar', 'location'] },
                { model: User, as: 'recipient', attributes: ['id', 'username', 'avatar', 'location'] }
            ]
        });

        // Format to return just the OTHER user
        const formattedFriends = friends.map((f: any) => {
            return f.requesterId === userId ? f.recipient : f.requester;
        });

        res.json(formattedFriends);
    } catch (error: any) {
        console.error('Error getting friends:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const checkFriendStatus = async (req: AuthRequest, res: Response) => {
    try {
        const myId = req.user.id;
        const { otherUserId } = req.params;

        const connection = await Friend.findOne({
            where: {
                [Op.or]: [
                    { requesterId: myId, recipientId: otherUserId },
                    { requesterId: otherUserId, recipientId: myId }
                ]
            }
        });

        if (!connection) {
            return res.json({ status: 'none' });
        }

        if (connection.status === 'accepted') {
            return res.json({ status: 'friends' });
        }

        if (connection.status === 'pending') {
            return res.json({
                status: 'pending',
                isSender: connection.requesterId === myId,
                requestId: connection.id
            });
        }

        res.json({ status: 'none' });
    } catch (error: any) {
        console.error('Error checking status:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const cancelFriendRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.body;

        const request = await Friend.findOne({
            where: {
                id: requestId,
                requesterId: userId,
                status: 'pending'
            }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        await request.destroy();

        // Optionally delete the notification too if you want to be clean
        await Notification.destroy({
            where: {
                entityId: requestId,
                type: 'friend_request'
            }
        });

        res.json({ message: 'Friend request cancelled' });
    } catch (error: any) {
        console.error('Error cancelling friend request:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
// Decline a request (for the recipient)
export const declineFriendRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.body;

        const request = await Friend.findOne({
            where: {
                id: requestId,
                recipientId: userId, // Ensure current user is the recipient
                status: 'pending'
            }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        await request.destroy();

        // Delete associated notification
        await Notification.destroy({
            where: {
                entityId: requestId,
                type: 'friend_request'
            }
        });

        res.json({ message: 'Friend request declined' });
    } catch (error: any) {
        console.error('Error declining friend request:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};
