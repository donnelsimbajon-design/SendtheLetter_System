import express from 'express';
import { getNotifications, markAsRead, markOneAsRead } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.put('/read', authenticateToken, markAsRead);
router.put('/:id/read', authenticateToken, markOneAsRead);

export default router;
