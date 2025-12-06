
import express from 'express';
import * as messageController from '../controllers/messageController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.post('/send', messageController.sendMessage);
router.get('/conversations', messageController.getConversations);
router.get('/:otherUserId', messageController.getMessages);
router.post('/read', messageController.markAsRead);

export default router;
