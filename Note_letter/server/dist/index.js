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
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const database_1 = __importDefault(require("./config/database"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const letterRoutes_1 = __importDefault(require("./routes/letterRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const followRoutes_1 = __importDefault(require("./routes/followRoutes"));
const User_1 = __importDefault(require("./models/User"));
const Letter_1 = __importDefault(require("./models/Letter"));
const Notification_1 = __importDefault(require("./models/Notification"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const friendRoutes_1 = __importDefault(require("./routes/friendRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' })); // Increased limit for images
// Serve uploaded files
app.use('/uploads', express_1.default.static('uploads'));
// Make io accessible to routes
app.set('io', io);
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/letters', letterRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/users', followRoutes_1.default);
app.use('/api/messages', messageRoutes_1.default);
app.use('/api/friends', friendRoutes_1.default);
// Test route
app.use('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});
// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    // Join a room for a specific user
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their room`);
    });
    // Join a room for a specific letter
    socket.on('join_letter', (letterId) => {
        socket.join(`letter_${letterId}`);
        console.log(`Socket ${socket.id} joined letter room ${letterId}`);
    });
    // Leave a letter room
    socket.on('leave_letter', (letterId) => {
        socket.leave(`letter_${letterId}`);
        console.log(`Socket ${socket.id} left letter room ${letterId}`);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
// Database connection and server start
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database_1.default.authenticate();
        console.log('Database connected successfully.');
        // Setup Associations
        User_1.default.hasMany(Notification_1.default, { foreignKey: 'userId', as: 'notifications' });
        Notification_1.default.belongsTo(User_1.default, { foreignKey: 'userId', as: 'user' });
        User_1.default.hasMany(Notification_1.default, { foreignKey: 'actorId', as: 'triggeredNotifications' });
        Notification_1.default.belongsTo(User_1.default, { foreignKey: 'actorId', as: 'actor' });
        Notification_1.default.belongsTo(Letter_1.default, { foreignKey: 'entityId', as: 'letter' });
        // Message associations
        // Associations are defined in models/Message.ts, but we ensure they are initialized
        // User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
        // User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
        // Follow associations - Commented out temporarily due to MySQL key limit
        // User.hasMany(Follow, { foreignKey: 'followerId', as: 'following' });
        // User.hasMany(Follow, { foreignKey: 'followingId', as: 'followers' });
        // Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
        // Follow.belongsTo(User, { foreignKey: 'followingId', as: 'following' });
        // Sync models (Disabled alter to prevent index duplication crash)
        yield database_1.default.sync();
        try {
            // Manual fix for Notification type to ensure it supports 'friend_request'
            yield database_1.default.query("ALTER TABLE notifications MODIFY COLUMN type VARCHAR(255) NOT NULL");
            console.log('Schema patch: Notification type updated to VARCHAR');
        }
        catch (err) {
            // Ignore error if column already modified or table issues - primarily to fix the 500 error
            console.log('Schema patch info:', err.message);
        }
        try {
            // Manual fix: Drop the SPECIFIC Foreign Key constraint reported by user
            yield database_1.default.query("ALTER TABLE notifications DROP FOREIGN KEY notifications_ibfk_62");
            console.log('Schema patch: Dropped conflicting FK on notifications.entityId (ibfk_62)');
        }
        catch (err) {
            console.log('Schema patch info (FK):', err.message);
        }
        console.log('Database synced.');
        httpServer.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});
startServer();
