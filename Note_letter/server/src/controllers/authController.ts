import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';

const generateToken = (user: User) => {
    return jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
    );
};

export const register = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username is already taken.' });
        }

        const newUser = await User.create({
            username,
            email,
            password_hash: password,
        });

        const token = generateToken(newUser);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                bio: newUser.bio,
                avatar: newUser.avatar,
                coverImage: newUser.coverImage,
                location: newUser.location,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.', error: (error as Error).message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
                coverImage: user.coverImage,
                location: user.location,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.', error: (error as Error).message });
    }
};

export const updateProfile = async (req: any, res: Response) => {
    try {
        console.log('=== UPDATE PROFILE REQUEST ===');
        console.log('User ID:', req.user?.id);
        console.log('Body:', req.body);
        console.log('Files:', req.files);

        const userId = req.user.id;
        const { bio, location, username } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            console.error('User not found:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        // Update text fields
        if (bio !== undefined) user.bio = bio;
        if (location !== undefined) user.location = location;
        if (username !== undefined) user.username = username;

        // Update image fields if files were uploaded
        if (req.files) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            console.log('Processing files:', Object.keys(files));
            if (files.avatar && files.avatar[0]) {
                user.avatar = `/uploads/${files.avatar[0].filename}`;
                console.log('Avatar updated:', user.avatar);
            }
            if (files.coverImage && files.coverImage[0]) {
                user.coverImage = `/uploads/${files.coverImage[0].filename}`;
                console.log('Cover image updated:', user.coverImage);
            }
        }

        await user.save();
        console.log('Profile saved successfully');

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
                coverImage: user.coverImage,
                location: user.location,
            },
        });
    } catch (error) {
        console.error('===Profile UPDATE ERROR===');
        console.error('Error details:', error);
        console.error('Error stack:', (error as Error).stack);
        console.error('========end');
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};
