import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sequelize from './config/database';
import authRoutes from './routes/authRoutes';
import letterRoutes from './routes/letterRoutes';
import notificationRoutes from './routes/notificationRoutes';
import followRoutes from './routes/followRoutes';
import User from './models/User';
import Letter from './models/Letter';
import Notification from './models/Notification';
import Follow from './models/Follow';
import messageRoutes from './routes/messageRoutes';
import Message from './models/Message';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for images

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', followRoutes);
app.use('/api/messages', messageRoutes);

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
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Setup Associations
        User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
        Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

        User.hasMany(Notification, { foreignKey: 'actorId', as: 'triggeredNotifications' });
        Notification.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

        Notification.belongsTo(Letter, { foreignKey: 'entityId', as: 'letter' });

        // Message associations
        // Associations are defined in models/Message.ts, but we ensure they are initialized
        // User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
        // User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });

        // Follow associations - Commented out temporarily due to MySQL key limit
        // User.hasMany(Follow, { foreignKey: 'followerId', as: 'following' });
        // User.hasMany(Follow, { foreignKey: 'followingId', as: 'followers' });
        // Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
        // Follow.belongsTo(User, { foreignKey: 'followingId', as: 'following' });

        // Sync models (alter: true updates the schema to match the model)
        // await sequelize.sync({ alter: true });
        console.log('Database synced (skipped).');

        httpServer.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();

export { io };
