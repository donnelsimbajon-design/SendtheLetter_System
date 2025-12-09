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
exports.getFollowing = exports.getFollowers = exports.getUserById = exports.getUserProfile = exports.toggleFollow = void 0;
const Follow_1 = __importDefault(require("../models/Follow"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const database_1 = __importDefault(require("../config/database"));
const toggleFollow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const followerId = req.user.id;
        const { userId: followingId } = req.params;
        if (followerId === parseInt(followingId)) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }
        const existingFollow = yield Follow_1.default.findOne({
            where: { followerId, followingId },
        });
        if (existingFollow) {
            yield existingFollow.destroy();
            return res.json({ message: 'Unfollowed', isFollowing: false });
        }
        else {
            const newFollow = yield Follow_1.default.create({ followerId, followingId: parseInt(followingId) });
            // Create Notification
            try {
                const notification = yield Notification_1.default.create({
                    userId: parseInt(followingId), // Recipient
                    actorId: followerId, // Triggered by
                    type: 'follow',
                    entityId: newFollow.id, // The follow info
                });
                // Socket.io
                const io = req.app.get('io');
                if (io) {
                    const notificationWithDetails = yield Notification_1.default.findByPk(notification.id, {
                        include: [{ model: User_1.default, as: 'actor', attributes: ['id', 'username', 'avatar'] }]
                    });
                    io.to(`user_${followingId}`).emit('new_notification', notificationWithDetails);
                }
            }
            catch (err) {
                console.error('Error creating follow notification:', err);
            }
            return res.json({ message: 'Followed', isFollowing: true });
        }
    }
    catch (error) {
        console.error('Error toggling follow:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.toggleFollow = toggleFollow;
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { username } = req.params;
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log('Fetching profile for username:', username);
        const user = yield User_1.default.findOne({
            where: database_1.default.where(database_1.default.fn('LOWER', database_1.default.col('username')), database_1.default.fn('LOWER', username)),
            attributes: ['id', 'username', 'email', 'createdAt', 'bio', 'location', 'avatar', 'coverImage'],
        });
        console.log('User found:', user ? user.username : 'null');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const followerCount = yield Follow_1.default.count({ where: { followingId: user.id } });
        const followingCount = yield Follow_1.default.count({ where: { followerId: user.id } });
        let isFollowing = false;
        if (currentUserId) {
            const follow = yield Follow_1.default.findOne({
                where: { followerId: currentUserId, followingId: user.id },
            });
            isFollowing = !!follow;
        }
        res.json(Object.assign(Object.assign({}, user.toJSON()), { followerCount,
            followingCount,
            isFollowing }));
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getUserProfile = getUserProfile;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        // Parse ID carefully
        const id = parseInt(userId);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid User ID' });
        }
        const user = yield User_1.default.findByPk(id, {
            attributes: ['id', 'username', 'email', 'createdAt', 'bio', 'location', 'avatar', 'coverImage'],
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Similar to profile but maybe simpler structure is fine, 
        // reusing same logic for robust profile availability
        const followerCount = yield Follow_1.default.count({ where: { followingId: user.id } });
        const followingCount = yield Follow_1.default.count({ where: { followerId: user.id } });
        res.json(Object.assign(Object.assign({}, user.toJSON()), { followerCount,
            followingCount }));
    }
    catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getUserById = getUserById;
const getFollowers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const followers = yield Follow_1.default.findAll({
            where: { followingId: userId },
            include: [
                {
                    model: User_1.default,
                    as: 'follower',
                    attributes: ['id', 'username'],
                },
            ],
        });
        res.json(followers);
    }
    catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getFollowers = getFollowers;
const getFollowing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const following = yield Follow_1.default.findAll({
            where: { followerId: userId },
            include: [
                {
                    model: User_1.default,
                    as: 'following',
                    attributes: ['id', 'username'],
                },
            ],
        });
        res.json(following);
    }
    catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getFollowing = getFollowing;
