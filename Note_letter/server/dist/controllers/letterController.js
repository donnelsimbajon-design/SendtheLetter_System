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
exports.getArchivedLetters = exports.archiveLetter = exports.getTimeCapsules = exports.getScheduledLetters = exports.updateDraft = exports.updateLetter = exports.deleteLetter = exports.getUserPublicLetters = exports.getPublicLetters = exports.getDrafts = exports.getMyLetters = exports.createLetter = void 0;
const Letter_1 = __importDefault(require("../models/Letter"));
const User_1 = __importDefault(require("../models/User"));
const database_1 = __importDefault(require("../config/database"));
const createLetter = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content, type, isPublic, scheduledDate, status, backgroundImage, recipientName, recipientAddress, spotifyLink, font, isAnonymous, imageUrl } = req.body;
        const userId = req.user.id;
        const letter = yield Letter_1.default.create({
            userId,
            title,
            content,
            type,
            isPublic,
            scheduledDate,
            status: status || 'published',
            backgroundImage,
            recipientName,
            recipientAddress,
            spotifyLink,
            font,
            isAnonymous,
            imageUrl,
        });
        res.status(201).json({ message: 'Letter created successfully', letter });
    }
    catch (error) {
        console.error('Error creating letter:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createLetter = createLetter;
const getMyLetters = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const letters = yield Letter_1.default.findAll({
            where: { userId, status: 'published' },
            order: [['createdAt', 'DESC']],
        });
        res.json(letters);
    }
    catch (error) {
        console.error('Error fetching letters:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getMyLetters = getMyLetters;
const getDrafts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const letters = yield Letter_1.default.findAll({
            where: { userId, status: 'draft' },
            order: [['createdAt', 'DESC']],
        });
        res.json(letters);
    }
    catch (error) {
        console.error('Error fetching drafts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getDrafts = getDrafts;
const getPublicLetters = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { default: Like } = yield Promise.resolve().then(() => __importStar(require('../models/Like')));
        const { default: Comment } = yield Promise.resolve().then(() => __importStar(require('../models/Comment')));
        const letters = yield Letter_1.default.findAll({
            where: { isPublic: true, status: 'published' },
            include: [
                {
                    model: User_1.default,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        // Fetch like and comment counts for each letter
        const lettersWithCounts = yield Promise.all(letters.map((letter) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const likeCount = yield Like.count({ where: { letterId: letter.id } });
            const commentCount = yield Comment.count({ where: { letterId: letter.id } });
            let isLikedByUser = false;
            if (userId) {
                const like = yield Like.findOne({
                    where: { letterId: letter.id, userId },
                });
                isLikedByUser = !!like;
            }
            const letterData = letter.toJSON();
            return Object.assign(Object.assign({}, letterData), { authorName: ((_a = letterData.user) === null || _a === void 0 ? void 0 : _a.username) || 'Unknown', authorAvatar: ((_b = letterData.user) === null || _b === void 0 ? void 0 : _b.avatar) || null, authorId: ((_c = letterData.user) === null || _c === void 0 ? void 0 : _c.id) || null, likeCount,
                commentCount,
                isLikedByUser });
        })));
        res.json(lettersWithCounts);
    }
    catch (error) {
        console.error('Error fetching public letters:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getPublicLetters = getPublicLetters;
const getUserPublicLetters = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { username } = req.params;
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield User_1.default.findOne({
            where: database_1.default.where(database_1.default.fn('LOWER', database_1.default.col('username')), database_1.default.fn('LOWER', username))
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const { default: Like } = yield Promise.resolve().then(() => __importStar(require('../models/Like')));
        const { default: Comment } = yield Promise.resolve().then(() => __importStar(require('../models/Comment')));
        const letters = yield Letter_1.default.findAll({
            where: {
                isPublic: true,
                status: 'published',
                userId: user.id,
                isAnonymous: false // Don't show anonymous letters on profile
            },
            include: [
                {
                    model: User_1.default,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        // Fetch like and comment counts for each letter
        const lettersWithCounts = yield Promise.all(letters.map((letter) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const likeCount = yield Like.count({ where: { letterId: letter.id } });
            const commentCount = yield Comment.count({ where: { letterId: letter.id } });
            let isLikedByUser = false;
            if (currentUserId) {
                const like = yield Like.findOne({
                    where: { letterId: letter.id, userId: currentUserId },
                });
                isLikedByUser = !!like;
            }
            const letterData = letter.toJSON();
            return Object.assign(Object.assign({}, letterData), { authorName: ((_a = letterData.user) === null || _a === void 0 ? void 0 : _a.username) || 'Unknown', authorAvatar: ((_b = letterData.user) === null || _b === void 0 ? void 0 : _b.avatar) || null, authorId: ((_c = letterData.user) === null || _c === void 0 ? void 0 : _c.id) || null, likeCount,
                commentCount,
                isLikedByUser });
        })));
        res.json(lettersWithCounts);
    }
    catch (error) {
        console.error('Error fetching user public letters:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getUserPublicLetters = getUserPublicLetters;
const deleteLetter = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const letter = yield Letter_1.default.findByPk(id);
        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }
        if (letter.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this letter' });
        }
        yield letter.destroy();
        res.json({ message: 'Letter deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting letter:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.deleteLetter = deleteLetter;
const updateLetter = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updates = req.body;
        const letter = yield Letter_1.default.findByPk(id);
        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }
        if (letter.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this letter' });
        }
        yield letter.update(updates);
        res.json({ message: 'Letter updated successfully', letter });
    }
    catch (error) {
        console.error('Error updating letter:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateLetter = updateLetter;
const updateDraft = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Re-use updateLetter logic for drafts
    return (0, exports.updateLetter)(req, res);
});
exports.updateDraft = updateDraft;
const getScheduledLetters = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const letters = yield Letter_1.default.findAll({
            where: {
                userId,
                status: 'scheduled'
            },
            order: [['scheduledDate', 'ASC']],
        });
        res.json(letters);
    }
    catch (error) {
        console.error('Error fetching scheduled letters:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getScheduledLetters = getScheduledLetters;
const getTimeCapsules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        // Time capsules are just scheduled letters (for now, or logic can differ)
        // Assuming time capsules are a specific 'type' or just handled same as scheduled
        const letters = yield Letter_1.default.findAll({
            where: {
                userId,
                type: 'Time Capsule',
                status: 'scheduled'
            },
            order: [['scheduledDate', 'ASC']],
        });
        res.json(letters);
    }
    catch (error) {
        console.error('Error fetching time capsules:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getTimeCapsules = getTimeCapsules;
const archiveLetter = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const letter = yield Letter_1.default.findByPk(id);
        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }
        if (letter.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        yield letter.update({ isArchived: true });
        res.json({ message: 'Letter archived successfully', letter });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.archiveLetter = archiveLetter;
const getArchivedLetters = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const letters = yield Letter_1.default.findAll({
            where: { userId, isArchived: true },
            order: [['updatedAt', 'DESC']]
        });
        res.json(letters);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getArchivedLetters = getArchivedLetters;
