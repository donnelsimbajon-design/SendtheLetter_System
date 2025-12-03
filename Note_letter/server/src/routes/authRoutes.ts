import express from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/profile', authenticateToken, upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]), authController.updateProfile);

export default router;
