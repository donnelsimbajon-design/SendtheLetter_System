import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.put('/read', authenticateToken, markAsRead);

export default router;
