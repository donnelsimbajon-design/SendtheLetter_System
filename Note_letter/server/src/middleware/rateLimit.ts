import { Request, Response, NextFunction } from 'express';

type WindowEntry = { count: number; resetAt: number };

export const createRateLimiter = (windowMs: number, max: number) => {
    const windows = new Map<string, WindowEntry>();

    return (req: Request, res: Response, next: NextFunction) => {
        const now = Date.now();
        const key = req.ip || req.socket.remoteAddress || 'unknown';
        let entry = windows.get(key);

        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            windows.set(key, entry);
        }

        entry.count += 1;
        if (windows.size > 10000) {
            for (const [client, value] of windows) {
                if (value.resetAt <= now) windows.delete(client);
            }
        }

        res.setHeader('RateLimit-Limit', String(max));
        res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
        res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

        if (entry.count > max) {
            return res.status(429).json({ message: 'Too many attempts. Please wait before trying again.' });
        }
        return next();
    };
};
