import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User';

// A strict allowlist prevents arbitrary URLs or user-supplied paths from being saved.
const isApprovedAvatar = (value: unknown): value is string =>
    typeof value === 'string' && /^\/avatars\/sprite\.svg#(?:female|male)-0[1-5]$/.test(value);

const publicUser = (user: User) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    bio: user.bio,
    avatar: user.avatar,
    coverImage: user.coverImage,
    location: user.location,
});

const generateToken = (user: User) => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters.');
    return jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        secret,
        { expiresIn: '24h' }
    );
};

export const register = async (req: Request, res: Response) => {
    try {
        const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        const password = typeof req.body.password === 'string' ? req.body.password : '';
        const avatarPreset = req.body.avatarPreset;

        if (avatarPreset != null && !isApprovedAvatar(avatarPreset)) {
            return res.status(400).json({ message: 'Choose a valid profile character.' });
        }

        if (username.length < 2 || username.length > 128) {
            return res.status(400).json({ message: 'Username must be between 2 and 128 characters.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 128) {
            return res.status(400).json({ message: 'Enter a valid email address.' });
        }
        if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({ message: 'Password must be at least 8 characters and no more than 72 bytes.' });
        }

        const existing = await User.findOne({
            where: { [Op.or]: [{ email: { [Op.iLike]: email } }, { username: { [Op.iLike]: username } }] },
        });
        if (existing) {
            return res.status(409).json({
                message: existing.email.toLowerCase() === email ? 'An account with this email already exists.' : 'Username is already taken.',
            });
        }

        // Public registration can only create standard accounts. Admins are promoted out-of-band.
        const user = await User.create({ username, email, password_hash: password, role: 'user', isActive: true, ...(avatarPreset ? { avatar: avatarPreset } : {}) });
        const token = generateToken(user);
        return res.status(201).json({ message: 'User registered successfully.', token, user: publicUser(user) });
    } catch (error) {
        console.error('Registration failed:', error);
        return res.status(500).json({ message: 'Unable to complete registration.' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        const password = typeof req.body.password === 'string' ? req.body.password : '';
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

        const user = await User.findOne({ where: { email: { [Op.iLike]: email } } });
        if (!user || !(await user.validatePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        if (!user.isActive) return res.status(403).json({ message: 'This account has been suspended. Contact support.' });

        const token = generateToken(user);
        return res.json({ message: 'Login successful.', token, user: publicUser(user) });
    } catch (error) {
        console.error('Login failed:', error);
        return res.status(500).json({ message: 'Unable to complete login.' });
    }
};

export const updateProfile = async (req: Request & { user?: { id: number } }, res: Response) => {
    try {
        const user = await User.findByPk(req.user?.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const { bio, location, username, avatarPreset } = req.body;
        if (avatarPreset !== undefined && !isApprovedAvatar(avatarPreset)) {
            return res.status(400).json({ message: 'Choose a valid profile character.' });
        }
        if (bio !== undefined) {
            if (typeof bio !== 'string' || bio.length > 2000) return res.status(400).json({ message: 'Bio must be 2,000 characters or fewer.' });
            user.bio = bio;
        }
        if (location !== undefined) {
            if (typeof location !== 'string' || location.length > 128) return res.status(400).json({ message: 'Location must be 128 characters or fewer.' });
            user.location = location;
        }
        if (username !== undefined) {
            if (typeof username !== 'string' || username.trim().length < 2 || username.trim().length > 128) {
                return res.status(400).json({ message: 'Username must be between 2 and 128 characters.' });
            }
            const normalized = username.trim();
            const duplicate = await User.findOne({ where: { username: normalized } });
            if (duplicate && duplicate.id !== user.id) return res.status(409).json({ message: 'Username is already taken.' });
            user.username = normalized;
        }

        if (avatarPreset) user.avatar = avatarPreset;

        const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        if (files?.avatar?.[0]) user.avatar = `/uploads/${files.avatar[0].filename}`;
        if (files?.coverImage?.[0]) user.coverImage = `/uploads/${files.coverImage[0].filename}`;

        await user.save();
        return res.json({ message: 'Profile updated successfully.', user: publicUser(user) });
    } catch (error) {
        console.error('Profile update failed:', error);
        return res.status(500).json({ message: 'Unable to update profile.' });
    }
};

/**
 * Change password only after verifying the current password.
 * Sequelize's beforeUpdate hook hashes the new password with bcrypt.
 * Existing JWTs remain valid until their normal expiration (24 hours).
 */
export const changePassword = async (req: Request & { user?: { id: number } }, res: Response) => {
    try {
        const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
        const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
        if (!currentPassword || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
            return res.status(400).json({ message: 'Enter your current password and a new password of at least 8 characters (72-byte maximum).' });
        }
        if (currentPassword === newPassword) return res.status(400).json({ message: 'Choose a new password different from your current one.' });
        const user = await User.findByPk(req.user?.id);
        if (!user || !user.isActive) return res.status(401).json({ message: 'Please sign in again.' });
        if (!(await user.validatePassword(currentPassword))) return res.status(403).json({ message: 'Current password is incorrect.' });
        await user.update({ password_hash: newPassword });
        res.setHeader('Cache-Control', 'no-store');
        return res.json({ message: 'Password updated successfully. Use the new password when signing in again.' });
    } catch (error) {
        console.error('Password change failed:', error);
        return res.status(500).json({ message: 'Could not update your password. Please try again.' });
    }
};
