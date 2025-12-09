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
exports.getPublicUserReposts = exports.getUserReposts = exports.checkRepostStatus = exports.toggleRepost = void 0;
const database_1 = __importDefault(require("../config/database"));
const Letter_1 = __importDefault(require("../models/Letter"));
const User_1 = __importDefault(require("../models/User"));
const Repost_1 = __importDefault(require("../models/Repost"));
const toggleRepost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const letterId = parseInt(req.params.id);
        const existingRepost = yield Repost_1.default.findOne({
            where: { userId, letterId }
        });
        if (existingRepost) {
            yield existingRepost.destroy();
            res.json({ reposted: false });
        }
        else {
            yield Repost_1.default.create({ userId, letterId });
            res.json({ reposted: true });
        }
    }
    catch (error) {
        console.error('Error toggling repost:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.toggleRepost = toggleRepost;
const checkRepostStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const letterId = parseInt(req.params.id);
        const repost = yield Repost_1.default.findOne({
            where: { userId, letterId }
        });
        const count = yield Repost_1.default.count({
            where: { letterId }
        });
        res.json({
            reposted: !!repost,
            count
        });
    }
    catch (error) {
        console.error('Error checking repost status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.checkRepostStatus = checkRepostStatus;
const getUserReposts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const reposts = yield Repost_1.default.findAll({
            where: { userId },
            include: [{
                    model: Letter_1.default,
                    as: 'letter',
                    include: [{
                            model: User_1.default,
                            as: 'user',
                            attributes: ['id', 'username', 'avatar']
                        }]
                }],
            order: [['createdAt', 'DESC']]
        });
        const letters = reposts.map((repost) => {
            var _a, _b;
            return (Object.assign(Object.assign({}, repost.letter.toJSON()), { repostedAt: repost.createdAt, authorName: (_a = repost.letter.user) === null || _a === void 0 ? void 0 : _a.username, authorId: (_b = repost.letter.user) === null || _b === void 0 ? void 0 : _b.id }));
        });
        res.json(letters);
    }
    catch (error) {
        console.error('Error fetching reposts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getUserReposts = getUserReposts;
const getPublicUserReposts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.params;
        const user = yield User_1.default.findOne({
            where: database_1.default.where(database_1.default.fn('LOWER', database_1.default.col('username')), database_1.default.fn('LOWER', username))
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const reposts = yield Repost_1.default.findAll({
            where: { userId: user.id },
            include: [{
                    model: Letter_1.default,
                    as: 'letter',
                    where: { isPublic: true, status: 'published' }, // Only show public letters
                    include: [{
                            model: User_1.default,
                            as: 'user',
                            attributes: ['id', 'username', 'avatar']
                        }]
                }],
            order: [['createdAt', 'DESC']]
        });
        const letters = reposts.map((repost) => {
            var _a, _b;
            return (Object.assign(Object.assign({}, repost.letter.toJSON()), { repostedAt: repost.createdAt, authorName: (_a = repost.letter.user) === null || _a === void 0 ? void 0 : _a.username, authorId: (_b = repost.letter.user) === null || _b === void 0 ? void 0 : _b.id }));
        });
        res.json(letters);
    }
    catch (error) {
        console.error('Error fetching public reposts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getPublicUserReposts = getPublicUserReposts;
