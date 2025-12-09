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
exports.declineFriendRequest = exports.cancelFriendRequest = exports.checkFriendStatus = exports.getFriends = exports.acceptFriendRequest = exports.sendFriendRequest = void 0;
const Friend_1 = __importDefault(require("../models/Friend"));
const User_1 = __importDefault(require("../models/User"));
const sequelize_1 = require("sequelize");
const Notification_1 = __importDefault(require("../models/Notification"));
const sendFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requesterId = req.user.id;
        const { recipientId } = req.body;
        if (requesterId === recipientId) {
            return res.status(400).json({ message: 'Cannot add yourself' });
        }
        const existing = yield Friend_1.default.findOne({
            where: {
                [sequelize_1.Op.or]: [
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
        const friendRequest = yield Friend_1.default.create({
            requesterId,
            recipientId,
            status: 'pending'
        });
        // Create Notification
        const notification = yield Notification_1.default.create({
            userId: recipientId,
            actorId: requesterId,
            type: 'friend_request',
            entityId: friendRequest.id,
        });
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            const notificationWithDetails = yield Notification_1.default.findByPk(notification.id, {
                include: [{ model: User_1.default, as: 'actor', attributes: ['id', 'username', 'avatar'] }]
            });
            io.to(`user_${recipientId}`).emit('new_notification', notificationWithDetails);
        }
        res.json(friendRequest);
    }
    catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
exports.sendFriendRequest = sendFriendRequest;
const acceptFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { requestId } = req.body;
        const friendRequest = yield Friend_1.default.findOne({
            where: { id: requestId, recipientId: userId, status: 'pending' }
        });
        if (!friendRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }
        friendRequest.status = 'accepted';
        yield friendRequest.save();
        // Notify requester
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${friendRequest.requesterId}`).emit('friend_accepted', {
                friendId: userId,
                // could send more user info here
            });
        }
        res.json({ message: 'Friend request accepted' });
    }
    catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
exports.acceptFriendRequest = acceptFriendRequest;
const getFriends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const friends = yield Friend_1.default.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { requesterId: userId, status: 'accepted' },
                    { recipientId: userId, status: 'accepted' }
                ]
            },
            include: [
                { model: User_1.default, as: 'requester', attributes: ['id', 'username', 'avatar', 'location'] },
                { model: User_1.default, as: 'recipient', attributes: ['id', 'username', 'avatar', 'location'] }
            ]
        });
        // Format to return just the OTHER user
        const formattedFriends = friends.map((f) => {
            return f.requesterId === userId ? f.recipient : f.requester;
        });
        res.json(formattedFriends);
    }
    catch (error) {
        console.error('Error getting friends:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
exports.getFriends = getFriends;
const checkFriendStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const myId = req.user.id;
        const { otherUserId } = req.params;
        const connection = yield Friend_1.default.findOne({
            where: {
                [sequelize_1.Op.or]: [
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
    }
    catch (error) {
        console.error('Error checking status:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
exports.checkFriendStatus = checkFriendStatus;
const cancelFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { requestId } = req.body;
        const request = yield Friend_1.default.findOne({
            where: {
                id: requestId,
                requesterId: userId,
                status: 'pending'
            }
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        yield request.destroy();
        // Optionally delete the notification too if you want to be clean
        yield Notification_1.default.destroy({
            where: {
                entityId: requestId,
                type: 'friend_request'
            }
        });
        res.json({ message: 'Friend request cancelled' });
    }
    catch (error) {
        console.error('Error cancelling friend request:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
exports.cancelFriendRequest = cancelFriendRequest;
// Decline a request (for the recipient)
const declineFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { requestId } = req.body;
        const request = yield Friend_1.default.findOne({
            where: {
                id: requestId,
                recipientId: userId, // Ensure current user is the recipient
                status: 'pending'
            }
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        yield request.destroy();
        // Delete associated notification
        yield Notification_1.default.destroy({
            where: {
                entityId: requestId,
                type: 'friend_request'
            }
        });
        res.json({ message: 'Friend request declined' });
    }
    catch (error) {
        console.error('Error declining friend request:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});
exports.declineFriendRequest = declineFriendRequest;
