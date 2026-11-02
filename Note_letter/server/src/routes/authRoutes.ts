import express from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload';
import { createRateLimiter } from '../middleware/rateLimit';

const router = express.Router();
const loginLimiter = createRateLimiter(15 * 60 * 1000, 10);
const registerLimiter = createRateLimiter(60 * 60 * 1000, 5);

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
const passwordLimiter = createRateLimiter(15 * 60 * 1000, 5);
router.put('/change-password', authenticateToken, passwordLimiter, authController.changePassword);
router.put('/profile', authenticateToken, upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
]), authController.updateProfile);

export default router;
