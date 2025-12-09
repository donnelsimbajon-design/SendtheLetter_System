"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversations = exports.markAsRead = exports.getMessages = exports.sendMessage = void 0;
const sequelize_1 = require("sequelize");
const Message_1 = __importDefault(require("../models/Message"));
const User_1 = __importDefault(require("../models/User"));
const database_1 = __importDefault(require("../config/database"));
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const senderId = req.user.id;
        const { receiverId, content } = req.body;
        if (!receiverId || !content) {
            return res.status(400).json({ message: 'Receiver and content are required' });
        }
        const message = yield Message_1.default.create({
            senderId,
            receiverId,
            content,
            isRead: false
        });
        // Manually fetch updated message with sender/receiver details
        const createdMessage = yield Message_1.default.findByPk(message.id);
        const sender = yield User_1.default.findByPk(senderId, { attributes: ['id', 'username', 'avatar'] });
        const receiver = yield User_1.default.findByPk(receiverId, { attributes: ['id', 'username', 'avatar'] });
        const messageWithUsers = {
            id: createdMessage.id,
            senderId: createdMessage.senderId,
            receiverId: createdMessage.receiverId,
            content: createdMessage.content,
            isRead: createdMessage.isRead,
            createdAt: createdMessage.createdAt,
            sender: sender ? sender.toJSON() : undefined,
            receiver: receiver ? receiver.toJSON() : undefined
        };
        // Emit real-time message to receiver
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${receiverId}`).emit('new_message', messageWithUsers);
        }
        res.status(201).json(messageWithUsers);
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.sendMessage = sendMessage;
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;
        // Fetch messages first
        const messages = yield Message_1.default.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            },
            order: [['createdAt', 'ASC']]
        });
        // Manually populate sender/receiver to ensure safety
        // In a real app with many messages, we'd use include, but this debugs the 500 error
        const populatedMessages = yield Promise.all(messages.map((msg) => __awaiter(void 0, void 0, void 0, function* () {
            const sender = yield User_1.default.findByPk(msg.senderId, { attributes: ['id', 'username', 'avatar'] });
            const receiver = yield User_1.default.findByPk(msg.receiverId, { attributes: ['id', 'username', 'avatar'] });
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
        })));
        res.json(populatedMessages);
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getMessages = getMessages;
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { senderId } = req.body;
        yield Message_1.default.update({ isRead: true }, {
            where: {
                senderId: senderId,
                receiverId: userId,
                isRead: false
            }
        });
        res.json({ message: 'Messages marked as read' });
    }
    catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.markAsRead = markAsRead;
const getConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        // Get all unique users involved in messages with current user
        // We want the latset message for each conversation
        // This is a bit complex in Sequelize without raw query optimization or robust associations.
        // Let's rely on raw query for performance and simplicity to get "Latest Message Per Conversation"
        const query = `
            SELECT 
                CASE 
                    WHEN senderId = :userId THEN receiverId 
                    ELSE senderId 
                END as otherUserId,
                MAX(createdAt) as lastMessageTime
            FROM messages
            WHERE senderId = :userId OR receiverId = :userId
            GROUP BY otherUserId
            ORDER BY lastMessageTime DESC
        `;
        const results = yield database_1.default.query(query, {
            replacements: { userId },
            type: database_1.default.QueryTypes.SELECT
        });
        // Now fetch user details and the actual last message content for each
        const conversations = yield Promise.all(results.map((convo) => __awaiter(void 0, void 0, void 0, function* () {
            const otherUserId = convo.otherUserId;
            const user = yield User_1.default.findByPk(otherUserId, {
                attributes: ['id', 'username', 'avatar', 'location'] // added location for "Online" status simulation or country
            });
            // Get the actual last message content
            const lastMessage = yield Message_1.default.findOne({
                where: {
                    [sequelize_1.Op.or]: [
                        { senderId: userId, receiverId: otherUserId },
                        { senderId: otherUserId, receiverId: userId }
                    ]
                },
                order: [['createdAt', 'DESC']]
            });
            // Count unread messages
            const unreadCount = yield Message_1.default.count({
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
        })));
        res.json(conversations);
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getConversations = getConversations;
