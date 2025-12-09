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
exports.getLikes = exports.toggleLike = void 0;
const Like_1 = __importDefault(require("../models/Like"));
const Letter_1 = __importDefault(require("../models/Letter"));
const toggleLike = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: letterId } = req.params;
        const userId = req.user.id;
        // Check if letter exists
        const letter = yield Letter_1.default.findByPk(letterId);
        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }
        // Check if like already exists
        const existingLike = yield Like_1.default.findOne({
            where: { letterId, userId },
        });
        if (existingLike) {
            // Unlike
            yield existingLike.destroy();
            const likeCount = yield Like_1.default.count({ where: { letterId } });
            // Emit real-time like update
            const io = req.app.get('io');
            if (io) {
                io.to(`letter_${letterId}`).emit('like_update', { letterId, likeCount, liked: false });
            }
            return res.json({ message: 'Like removed', liked: false, likeCount });
        }
        else {
            // Like
            yield Like_1.default.create({
                letterId: parseInt(letterId),
                userId,
            });
            // Create notification
            if (letter.userId !== userId) {
                const { default: Notification } = yield Promise.resolve().then(() => __importStar(require('../models/Notification')));
                const { default: User } = yield Promise.resolve().then(() => __importStar(require('../models/User')));
                const notification = yield Notification.create({
                    userId: letter.userId,
                    actorId: userId,
                    type: 'like',
                    entityId: letter.id,
                });
                // Emit real-time notification
                const io = req.app.get('io');
                if (io) {
                    const notificationWithDetails = yield Notification.findByPk(notification.id, {
                        include: [
                            { model: User, as: 'actor', attributes: ['id', 'username'] },
                            { model: Letter_1.default, as: 'letter', attributes: ['id', 'title'] }
                        ]
                    });
                    io.to(`user_${letter.userId}`).emit('new_notification', notificationWithDetails);
                }
            }
            const likeCount = yield Like_1.default.count({ where: { letterId } });
            // Emit real-time like update
            const io = req.app.get('io');
            if (io) {
                io.to(`letter_${letterId}`).emit('like_update', { letterId, likeCount, liked: true });
            }
            return res.json({ message: 'Like added', liked: true, likeCount });
        }
    }
    catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.toggleLike = toggleLike;
const getLikes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id: letterId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const likeCount = yield Like_1.default.count({ where: { letterId } });
        let isLikedByUser = false;
        if (userId) {
            const like = yield Like_1.default.findOne({
                where: { letterId, userId },
            });
            isLikedByUser = !!like;
        }
        res.json({ likeCount, isLikedByUser });
    }
    catch (error) {
        console.error('Error fetching likes:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getLikes = getLikes;
