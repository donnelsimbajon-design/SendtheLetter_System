import { Request, Response } from 'express';
import { createHash, randomBytes } from 'crypto';
import axios from 'axios';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import User from '../models/User';
import PasswordResetToken from '../models/PasswordResetToken';

const successMessage = 'If an eligible account exists, password reset instructions will be sent to that address.';
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const validPassword = (value: unknown): value is string =>
    typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= 72;

export const requestPasswordReset = async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 128) {
        return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    const key = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    const base = process.env.APP_BASE_URL || (process.env.CLIENT_ORIGIN || '').split(',')[0].trim();
    let origin: string;
    try {
        const url = new URL(base);
        if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw new Error('HTTPS required');
        origin = url.origin;
    } catch {
        return res.status(503).json({ message: 'Account recovery is temporarily unavailable.' });
    }
    if (!key || !from) return res.status(503).json({ message: 'Account recovery is temporarily unavailable.' });
    try {
        const user = await User.findOne({ where: { email: { [Op.iLike]: email }, isActive: true } });
        if (user) {
            // Limit messages to one per account every five minutes, even across API restarts.
            const recent = await PasswordResetToken.findOne({
                where: { userId: user.id, createdAt: { [Op.gt]: new Date(Date.now() - 5 * 60_000) } },
            });
            if (!recent) {
                const token = randomBytes(32).toString('hex');
                const record = await PasswordResetToken.create({
                    userId: user.id, tokenHash: tokenHash(token),
                    expiresAt: new Date(Date.now() + 30 * 60_000), consumedAt: null,
                });
                try {
                    const resetUrl = `${origin}/reset-password?token=${token}`;
                    await axios.post('https://api.resend.com/emails', {
                        from, to: [email], subject: 'Reset your SendTheLetter password',
                        text: `A password reset was requested for your SendTheLetter account. Open this link within 30 minutes:\n\n${resetUrl}\n\nIf this was not you, ignore this message.`,
                    }, { headers: { Authorization: `Bearer ${key}` }, timeout: 15000 });
                } catch (error) {
                    // The provider did not accept the email. Invalidate the unused token.
                    await record.destroy().catch(() => undefined);
                    console.error('Password recovery provider request failed.');
                }
            }
        }
        return res.status(202).json({ message: successMessage });
    } catch (error) {
        console.error('Password reset request failed:', error);
        return res.status(503).json({ message: 'Account recovery is temporarily unavailable.' });
    }
};

export const confirmPasswordReset = async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const newPassword = req.body?.newPassword;
    if (!/^[a-f0-9]{64}$/.test(token) || !validPassword(newPassword)) {
        return res.status(400).json({ message: 'Invalid reset link or password. Use 8 or more characters (72-byte limit).' });
    }
    try {
        const userId = await sequelize.transaction(async (transaction) => {
            const record = await PasswordResetToken.findOne({
                where: { tokenHash: tokenHash(token), consumedAt: null, expiresAt: { [Op.gt]: new Date() } },
                transaction, lock: transaction.LOCK.UPDATE,
            });
            if (!record) return null;
            const user = await User.findByPk(record.userId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!user || !user.isActive) return null;
            await user.update({ password_hash: newPassword, tokenVersion: user.tokenVersion + 1 }, { transaction });
            await PasswordResetToken.update({ consumedAt: new Date() }, {
                where: { userId: user.id, consumedAt: null }, transaction,
            });
            return user.id;
        });
        if (!userId) return res.status(400).json({ message: 'This reset link is invalid or has expired. Request another.' });
        const io = req.app.get('io');
        if (io) io.in(`user_${userId}`).disconnectSockets(true);
        return res.json({ message: 'Your password has been changed. Sign in with the new password.' });
    } catch (error) {
        console.error('Password reset confirmation failed:', error);
        return res.status(503).json({ message: 'Could not reset your password right now.' });
    }
};
