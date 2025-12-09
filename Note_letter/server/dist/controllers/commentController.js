"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.deleteComment = exports.getComments = exports.createComment = void 0;
const Comment_1 = __importDefault(require("../models/Comment"));
const User_1 = __importDefault(require("../models/User"));
const Letter_1 = __importDefault(require("../models/Letter"));
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id: letterId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        // Check if letter exists and is public
        const letter = yield Letter_1.default.findByPk(letterId);
        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }
        const comment = yield Comment_1.default.create({
            letterId: parseInt(letterId),
            userId,
            content,
        });
        // Fetch the comment with user info
        const commentWithUser = yield Comment_1.default.findByPk(comment.id, {
            include: [
                {
                    model: User_1.default,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                },
            ],
        });
        // Format response to match frontend expectations
        const formattedComment = {
            id: commentWithUser.id,
            letterId: commentWithUser.letterId,
            userId: commentWithUser.userId,
            content: commentWithUser.content,
            createdAt: commentWithUser.createdAt,
            user: {
                id: (_a = commentWithUser.user) === null || _a === void 0 ? void 0 : _a.id,
                username: ((_b = commentWithUser.user) === null || _b === void 0 ? void 0 : _b.username) || 'Unknown',
                avatar: (_c = commentWithUser.user) === null || _c === void 0 ? void 0 : _c.avatar,
            }
        };
        // Create notification for letter owner if it's not their own comment
        if (letter.userId !== userId) {
            const { default: Notification } = yield Promise.resolve().then(() => __importStar(require('../models/Notification')));
            const notification = yield Notification.create({
                userId: letter.userId,
                actorId: userId,
                type: 'comment',
                entityId: letter.id,
            });
            // Emit real-time notification
            const io = req.app.get('io');
            if (io) {
                // Fetch notification with user details
                const notificationWithDetails = yield Notification.findByPk(notification.id, {
                    include: [
                        { model: User_1.default, as: 'actor', attributes: ['id', 'username'] },
                        { model: Letter_1.default, as: 'letter', attributes: ['id', 'title'] }
                    ]
                });
                io.to(`user_${letter.userId}`).emit('new_notification', notificationWithDetails);
            }
        }
        // Emit real-time comment to letter room
        const io = req.app.get('io');
        if (io) {
            io.to(`letter_${letterId}`).emit('new_comment', formattedComment);
        }
        res.status(201).json({ message: 'Comment created successfully', comment: formattedComment });
    }
    catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createComment = createComment;
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: letterId } = req.params;
        const comments = yield Comment_1.default.findAll({
            where: { letterId },
            include: [
                {
                    model: User_1.default,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        // Format comments to match frontend expectations
        const formattedComments = comments.map((comment) => {
            var _a, _b, _c;
            return ({
                id: comment.id,
                letterId: comment.letterId,
                userId: comment.userId,
                content: comment.content,
                createdAt: comment.createdAt,
                user: {
                    id: (_a = comment.user) === null || _a === void 0 ? void 0 : _a.id,
                    username: ((_b = comment.user) === null || _b === void 0 ? void 0 : _b.username) || 'Unknown',
                    avatar: (_c = comment.user) === null || _c === void 0 ? void 0 : _c.avatar,
                }
            });
        });
        res.json(formattedComments);
    }
    catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getComments = getComments;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: letterId, commentId } = req.params;
        const userId = req.user.id;
        const comment = yield Comment_1.default.findOne({
            where: { id: commentId, letterId },
        });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        // Check if user owns the comment
        if (comment.userId !== userId) {
            return res.status(403).json({ message: 'You can only delete your own comments' });
        }
        yield comment.destroy();
        res.json({ message: 'Comment deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.deleteComment = deleteComment;
