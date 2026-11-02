import express from 'express';
import { toggleFollow, getUserProfile, getFollowers, getFollowing, getUserById } from '../controllers/followController';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware';
import { getBlockStatus, blockWriter, unblockWriter } from '../controllers/blockController';

const router = express.Router();

router.post('/:userId/toggle', authenticateToken, toggleFollow);
router.get('/:userId/block-status', authenticateToken, getBlockStatus);
router.post('/:userId/block', authenticateToken, blockWriter);
router.delete('/:userId/block', authenticateToken, unblockWriter);
router.get('/profile/:username', optionalAuth, getUserProfile);
router.get('/id/:userId', getUserById);
router.get('/:userId/profile', getUserById);  // Alias for frontend compatibility
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

export default router;
