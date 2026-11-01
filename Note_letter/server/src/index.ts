import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import sequelize from './config/database';
import authRoutes from './routes/authRoutes';
import letterRoutes from './routes/letterRoutes';
import notificationRoutes from './routes/notificationRoutes';
import followRoutes from './routes/followRoutes';
import adminRoutes from './routes/adminRoutes';
import User from './models/User';
import Letter from './models/Letter';
import Notification from './models/Notification';
import messageRoutes from './routes/messageRoutes';
import friendRoutes from './routes/friendRoutes';
import Message from './models/Message';
import Friend from './models/Friend';

dotenv.config();

const app = express();
app.disable('x-powered-by');
fs.mkdirSync(path.resolve(process.cwd(), 'uploads'), { recursive: true });
const httpServer = createServer(app);
const allowedOrigins = new Set(
    [process.env.CLIENT_URL, process.env.FRONTEND_URL, 'http://localhost:5173']
        .filter((origin): origin is string => Boolean(origin))
);
const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error('Origin is not allowed by CORS.'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use('/uploads', express.static('uploads', { dotfiles: 'deny', index: false }));

const io = new Server(httpServer, {
    cors: { origin: Array.from(allowedOrigins), methods: ['GET', 'POST'] },
});

app.set('io', io);
app.use('/api/auth', authRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', followRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use((error: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(error);
    const status = Number(error?.status || error?.statusCode || 500);
    console.error('Request failed:', error);
    return res.status(status >= 400 && status < 500 ? status : 500).json({
        message: status >= 400 && status < 500 ? 'Request could not be processed.' : 'Internal server error.',
    });
});

io.use(async (socket, next) => {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32) return next(new Error('Authentication is not configured.'));
        const token = socket.handshake.auth?.token;
        if (typeof token !== 'string' || !token) return next(new Error('Authentication required.'));
        const decoded = jwt.verify(token, secret) as JwtPayload;
        if (!decoded || typeof decoded === 'string' || !Number.isInteger(Number(decoded.id))) {
            return next(new Error('Invalid authentication token.'));
        }
        const user = await User.findByPk(Number(decoded.id));
        if (!user || !user.isActive) return next(new Error('Account unavailable.'));
        socket.data.userId = user.id;
        return next();
    } catch {
        return next(new Error('Invalid or expired authentication token.'));
    }
});

io.on('connection', (socket) => {
    const userId = socket.data.userId as number;
    socket.join(`user_${userId}`);

    socket.on('join_letter', async (letterId: string) => {
        if (!/^\d+$/.test(String(letterId))) return;
        const letter = await Letter.findByPk(Number(letterId));
        if (letter && (letter.userId === userId || (letter.isPublic && letter.status === 'published' && !letter.isArchived))) {
            socket.join(`letter_${letter.id}`);
        }
    });

    socket.on('leave_letter', (letterId: string) => {
        if (/^\d+$/.test(String(letterId))) socket.leave(`letter_${letterId}`);
    });
});

const startServer = async () => {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32) {
            throw new Error('Set JWT_SECRET to a random value of at least 32 characters before starting the server.');
        }
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
        Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
        User.hasMany(Notification, { foreignKey: 'actorId', as: 'triggeredNotifications' });
        Notification.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
        Notification.belongsTo(Letter, { foreignKey: 'entityId', as: 'letter' });

        // Existing schema synchronization is retained for compatibility with current deployments.
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');

        const port = Number(process.env.PORT || 5000);
        httpServer.listen(port, () => console.log(`API listening on port ${port}`));
    } catch (error) {
        console.error('Unable to start the server:', error);
        process.exitCode = 1;
    }
};

void startServer();
export { io };
