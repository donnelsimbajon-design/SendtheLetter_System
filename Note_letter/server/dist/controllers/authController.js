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
exports.updateProfile = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
};
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        const existingUser = yield User_1.default.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }
        const existingUsername = yield User_1.default.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username is already taken.' });
        }
        const newUser = yield User_1.default.create({
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield User_1.default.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }
        const isValidPassword = yield user.validatePassword(password);
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});
exports.login = login;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('=== UPDATE PROFILE REQUEST ===');
        console.log('User ID:', (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        console.log('Body:', req.body);
        console.log('Files:', req.files);
        const userId = req.user.id;
        const { bio, location, username } = req.body;
        const user = yield User_1.default.findByPk(userId);
        if (!user) {
            console.error('User not found:', userId);
            return res.status(404).json({ message: 'User not found' });
        }
        // Update text fields
        if (bio !== undefined)
            user.bio = bio;
        if (location !== undefined)
            user.location = location;
        if (username !== undefined)
            user.username = username;
        // Update image fields if files were uploaded
        if (req.files) {
            const files = req.files;
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
        yield user.save();
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
    }
    catch (error) {
        console.error('===Profile UPDATE ERROR===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        console.error('========end');
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.updateProfile = updateProfile;
