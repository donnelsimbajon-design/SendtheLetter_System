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
exports.markAsRead = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const Letter_1 = __importDefault(require("../models/Letter"));
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const notifications = yield Notification_1.default.findAll({
            where: { userId },
            include: [
                {
                    model: User_1.default,
                    as: 'actor',
                    attributes: ['id', 'username'],
                },
                {
                    model: Letter_1.default,
                    as: 'letter',
                    attributes: ['id', 'title'],
                }
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json(notifications);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getNotifications = getNotifications;
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        yield Notification_1.default.update({ isRead: true }, { where: { userId, isRead: false } });
        res.json({ message: 'Notifications marked as read' });
    }
    catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.markAsRead = markAsRead;
