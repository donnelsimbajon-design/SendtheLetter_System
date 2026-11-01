import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/User';

interface AuthRequest extends Request {
    user?: { id: number; username: string; email: string; role: 'user' | 'admin' };
}

const jwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('JWT_SECRET must be configured with at least 32 characters.');
    }
    return secret;
};

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    try {
        const decoded = jwt.verify(token, jwtSecret()) as JwtPayload;
        if (!decoded || typeof decoded === 'string' || !Number.isInteger(Number(decoded.id))) {
            return res.status(401).json({ message: 'Invalid authentication token.' });
        }
        const user = await User.findByPk(Number(decoded.id));
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'This account is unavailable.' });
        }
        req.user = { id: user.id, username: user.username, email: user.email, role: user.role };
        return next();
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('JWT_SECRET')) {
            return res.status(503).json({ message: 'Authentication is not configured on the server.' });
        }
        return res.status(401).json({ message: 'Invalid or expired authentication token.' });
    }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required.' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Administrator access required.' });
    return next();
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return next();
    try {
        const decoded = jwt.verify(token, jwtSecret()) as JwtPayload;
        if (decoded && typeof decoded !== 'string' && Number.isInteger(Number(decoded.id))) {
            const user = await User.findByPk(Number(decoded.id));
            if (user?.isActive) {
                req.user = { id: user.id, username: user.username, email: user.email, role: user.role };
            }
        }
    } catch {
        // Public endpoints remain public when an optional token is invalid.
    }
    return next();
};
