import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as friendController from '../controllers/friendController';

const router = express.Router();

// All routes protected
router.use(authenticateToken);

router.post('/request', friendController.sendFriendRequest);
router.post('/accept', friendController.acceptFriendRequest);
router.get('/', friendController.getFriends);
router.get('/status/:otherUserId', friendController.checkFriendStatus);
router.post('/cancel', friendController.cancelFriendRequest);
router.post('/decline', friendController.declineFriendRequest);

export default router;
