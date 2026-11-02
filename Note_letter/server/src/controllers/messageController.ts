
import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import Message from '../models/Message';
import User from '../models/User';
import sequelize from '../config/database';
import { isBlockedBetween } from '../services/blockService';

interface AuthRequest extends Request {
    user?: any;
}

export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const senderId = req.user.id;
        const { receiverId, content } = req.body;

        const receiverUserId = Number(receiverId);
        const safeContent = typeof content === 'string' ? content.trim() : '';
        if (!Number.isInteger(receiverUserId) || receiverUserId < 1 || !safeContent || safeContent.length > 5000) {
            return res.status(400).json({ message: 'A valid recipient and a message of 1 to 5,000 characters are required.' });
        }
        if (receiverUserId === senderId) return res.status(400).json({ message: 'You cannot message yourself.' });
        const receiverUser = await User.findByPk(receiverUserId);
        if (!receiverUser || !receiverUser.isActive) return res.status(404).json({ message: 'Recipient not found.' });
        if (await isBlockedBetween(senderId, receiverUserId)) return res.status(403).json({ message: 'Messaging is unavailable between these accounts.' });

        const message = await Message.create({
            senderId,
            receiverId: receiverUserId,
            content: safeContent,
            isRead: false
        });

        // Manually fetch updated message with sender/receiver details
        const createdMessage = await Message.findByPk(message.id);
        const sender = await User.findByPk(senderId, { attributes: ['id', 'username', 'avatar'] });
        const receiver = await User.findByPk(receiverUserId, { attributes: ['id', 'username', 'avatar'] });

        const messageWithUsers = {
            id: createdMessage!.id,
            senderId: createdMessage!.senderId,
            receiverId: createdMessage!.receiverId,
            content: createdMessage!.content,
            isRead: createdMessage!.isRead,
            createdAt: createdMessage!.createdAt,
            sender: sender ? sender.toJSON() : undefined,
            receiver: receiver ? receiver.toJSON() : undefined
        };

        // Emit real-time message to receiver
        const io = (req as any).app.get('io');
        if (io) {
            io.to(`user_${receiverUserId}`).emit('new_message', messageWithUsers);
        }

        res.status(201).json(messageWithUsers);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const otherUserId = Number(req.params.otherUserId);
        if (!Number.isInteger(otherUserId) || otherUserId < 1) return res.status(400).json({ message: 'Invalid conversation.' });

        // Fetch messages first
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            },
            order: [['createdAt', 'ASC']]
        });

        // Manually populate sender/receiver to ensure safety
        // In a real app with many messages, we'd use include, but this debugs the 500 error
        const populatedMessages = await Promise.all(messages.map(async (msg) => {
            const sender = await User.findByPk(msg.senderId, { attributes: ['id', 'username', 'avatar'] });
            const receiver = await User.findByPk(msg.receiverId, { attributes: ['id', 'username', 'avatar'] });

            return {
                id: msg.id,
                senderId: msg.senderId,
                receiverId: msg.receiverId,
                content: msg.content,
                isRead: msg.isRead,
                createdAt: msg.createdAt,
                sender: sender ? sender.toJSON() : { id: msg.senderId, username: 'Unknown' },
                receiver: receiver ? receiver.toJSON() : { id: msg.receiverId, username: 'Unknown' }
            };
        }));

        res.json(populatedMessages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/** Cursor-paginated conversation history, restricted to the authenticated participant. */
export const getMessagePage = async (req: AuthRequest, res: Response) => {
    try {
        const userId = Number(req.user.id);
        const peerId = Number(req.params.otherUserId);
        const before = req.query.before == null ? null : Number(req.query.before);
        if (!Number.isSafeInteger(peerId) || peerId <= 0 || (before !== null && (!Number.isSafeInteger(before) || before <= 0))) {
            return res.status(400).json({ message: 'Invalid conversation cursor.' });
        }
        const where = {
            [Op.or]: [
                { senderId: userId, receiverId: peerId },
                { senderId: peerId, receiverId: userId },
            ],
            ...(before === null ? {} : { id: { [Op.lt]: before } }),
        };
        const rows = await Message.findAll({ where, order: [['id', 'DESC']], limit: 51 });
        const hasMore = rows.length > 50;
        const page = rows.slice(0, 50).reverse();
        const profiles = await User.findAll({
            where: { id: { [Op.in]: [userId, peerId] } },
            attributes: ['id', 'username', 'avatar'],
        });
        const users = new Map(profiles.map(user => [user.id, user.toJSON()]));
        const messages = page.map(msg => ({
            id: msg.id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            content: msg.content,
            isRead: msg.isRead,
            createdAt: msg.createdAt,
            sender: users.get(msg.senderId) || { id: msg.senderId, username: 'Unknown' },
            receiver: users.get(msg.receiverId) || { id: msg.receiverId, username: 'Unknown' },
        }));
        res.setHeader('Cache-Control', 'no-store');
        return res.json({
            messages,
            nextBeforeId: hasMore && page.length ? page[0].id : null,
        });
    } catch (error) {
        console.error('Unable to load message history:', error);
        return res.status(500).json({ message: 'Unable to open messages.' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const senderId = Number(req.body.senderId);
        if (!Number.isInteger(senderId) || senderId < 1) return res.status(400).json({ message: 'Invalid sender.' });

        await Message.update(
            { isRead: true },
            {
                where: {
                    senderId: senderId,
                    receiverId: userId,
                    isRead: false
                }
            }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;

        // Get all unique users involved in messages with current user
        // We want the latset message for each conversation

        // This is a bit complex in Sequelize without raw query optimization or robust associations.
        // Let's rely on raw query for performance and simplicity to get "Latest Message Per Conversation"

        const query = `
            SELECT
                CASE
                    WHEN "senderId" = :userId THEN "receiverId"
                    ELSE "senderId"
                END AS "otherUserId",
                MAX("createdAt") AS "lastMessageTime"
            FROM "messages"
            WHERE "senderId" = :userId OR "receiverId" = :userId
            GROUP BY "otherUserId"
            ORDER BY "lastMessageTime" DESC
        `;

        const results = await sequelize.query(query, {
            replacements: { userId },
            type: QueryTypes.SELECT
        }) as any[];

        // Now fetch user details and the actual last message content for each
        const conversations = await Promise.all(results.map(async (convo: any) => {
            const otherUserId = convo.otherUserId;

            const user = await User.findByPk(otherUserId, {
                attributes: ['id', 'username', 'avatar', 'location'] // added location for "Online" status simulation or country
            });

            // Get the actual last message content
            const lastMessage = await Message.findOne({
                where: {
                    [Op.or]: [
                        { senderId: userId, receiverId: otherUserId },
                        { senderId: otherUserId, receiverId: userId }
                    ]
                },
                order: [['createdAt', 'DESC']]
            });

            // Count unread messages
            const unreadCount = await Message.count({
                where: {
                    senderId: otherUserId,
                    receiverId: userId,
                    isRead: false
                }
            });

            return {
                user: user ? user.toJSON() : { id: otherUserId, username: 'Unknown' },
                lastMessage: lastMessage ? lastMessage.content : '',
                lastMessageTime: convo.lastMessageTime,
                unreadCount,
                isOnline: false // Todo: checking online status via socket if possible, else hardcode/random for now
            };
        }));

        res.json(conversations);

    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
