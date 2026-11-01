import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
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
import messageRoutes from './routes/messageRoutes';
import friendRoutes from './routes/friendRoutes';
import Message from './models/Message';
import Friend from './models/Friend';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters before starting the API.');
}

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
    },
});

const PORT = Number(process.env.PORT || 5000);

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static('uploads'));
app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', followRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Authenticate every realtime connection before it can join application rooms.
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string' || !token) {
        return next(new Error('Unauthorized'));
    }

    try {
        const payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
        if (!payload.id) return next(new Error('Unauthorized'));
        socket.data.userId = Number(payload.id);
        return next();
    } catch {
        return next(new Error('Unauthorized'));
    }
});

io.on('connection', (socket) => {
    const userId = Number(socket.data.userId);
    socket.join(`user_${userId}`);

    socket.on('join_letter', async (letterId: string) => {
        try {
            if (!/^\d+$/.test(String(letterId))) return;
            const letter = await Letter.findByPk(letterId);
            if (!letter) return;

            const isOwner = Number(letter.userId) === userId;
            const isPublicPublished = letter.isPublic && letter.status === 'published';
            if (isOwner || isPublicPublished) {
                socket.join(`letter_${letter.id}`);
            }
        } catch (error) {
            console.error('Unable to authorize letter room access:', error);
        }
    });

    socket.on('leave_letter', (letterId: string) => {
        if (/^\d+$/.test(String(letterId))) socket.leave(`letter_${letterId}`);
    });
});

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
        Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
        User.hasMany(Notification, { foreignKey: 'actorId', as: 'triggeredNotifications' });
        Notification.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
        Notification.belongsTo(Letter, { foreignKey: 'entityId', as: 'letter' });

        // Existing associations are initialized by their model modules.
        void Message;
        void Friend;

        // TODO: replace alter-sync with versioned migrations before production rollout.
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');

        httpServer.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start the API:', error);
        process.exitCode = 1;
    }
};

startServer();

export { io };
