import express from 'express';
import { toggleFollow, getUserProfile, getFollowers, getFollowing } from '../controllers/followController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/:userId/toggle', authenticateToken, toggleFollow);
router.get('/profile/:username', getUserProfile);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

export default router;
