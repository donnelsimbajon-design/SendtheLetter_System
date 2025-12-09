
import { Request, Response } from 'express';
import Follow from '../models/Follow';
import User from '../models/User';
import Notification from '../models/Notification';
import sequelize from '../config/database';

interface AuthRequest extends Request {
    user?: any;
}

export const toggleFollow = async (req: AuthRequest, res: Response) => {
    try {
        const followerId = req.user.id;
        const { userId: followingId } = req.params;

        if (followerId === parseInt(followingId)) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const existingFollow = await Follow.findOne({
            where: { followerId, followingId },
        });

        if (existingFollow) {
            await existingFollow.destroy();
            return res.json({ message: 'Unfollowed', isFollowing: false });
        } else {
            const newFollow = await Follow.create({ followerId, followingId: parseInt(followingId) });

            // Create Notification
            try {
                const notification = await Notification.create({
                    userId: parseInt(followingId), // Recipient
                    actorId: followerId, // Triggered by
                    type: 'follow',
                    entityId: newFollow.id, // The follow info
                });

                // Socket.io
                const io = (req as any).app.get('io');
                if (io) {
                    const notificationWithDetails = await Notification.findByPk(notification.id, {
                        include: [{ model: User, as: 'actor', attributes: ['id', 'username', 'avatar'] }]
                    });
                    io.to(`user_${followingId}`).emit('new_notification', notificationWithDetails);
                }
            } catch (err) {
                console.error('Error creating follow notification:', err);
            }

            return res.json({ message: 'Followed', isFollowing: true });
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const currentUserId = (req as AuthRequest).user?.id;

        console.log('Fetching profile for username:', username);
        const user = await User.findOne({
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('username')),
                sequelize.fn('LOWER', username)
            ),
            attributes: ['id', 'username', 'email', 'createdAt', 'bio', 'location', 'avatar', 'coverImage'],
        });
        console.log('User found:', user ? user.username : 'null');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const followerCount = await Follow.count({ where: { followingId: user.id } });
        const followingCount = await Follow.count({ where: { followerId: user.id } });

        let isFollowing = false;
        if (currentUserId) {
            const follow = await Follow.findOne({
                where: { followerId: currentUserId, followingId: user.id },
            });
            isFollowing = !!follow;
        }

        res.json({
            ...user.toJSON(),
            followerCount,
            followingCount,
            isFollowing,
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // Parse ID carefully
        const id = parseInt(userId);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid User ID' });
        }

        const user = await User.findByPk(id, {
            attributes: ['id', 'username', 'email', 'createdAt', 'bio', 'location', 'avatar', 'coverImage'],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Similar to profile but maybe simpler structure is fine, 
        // reusing same logic for robust profile availability
        const followerCount = await Follow.count({ where: { followingId: user.id } });
        const followingCount = await Follow.count({ where: { followerId: user.id } });

        res.json({
            ...user.toJSON(),
            followerCount,
            followingCount,
            // isFollowing logic could be added if needed, but for minimal fetch it's okay.
            // Let's keep it simple for now.
        });

    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getFollowers = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const followers = await Follow.findAll({
            where: { followingId: userId },
            include: [
                {
                    model: User,
                    as: 'follower',
                    attributes: ['id', 'username'],
                },
            ],
        });

        res.json(followers);
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getFollowing = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const following = await Follow.findAll({
            where: { followerId: userId },
            include: [
                {
                    model: User,
                    as: 'following',
                    attributes: ['id', 'username'],
                },
            ],
        });

        res.json(following);
    } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
