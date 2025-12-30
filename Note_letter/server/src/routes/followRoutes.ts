import express from 'express';
import { toggleFollow, getUserProfile, getFollowers, getFollowing, getUserById } from '../controllers/followController';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/:userId/toggle', authenticateToken, toggleFollow);
router.get('/profile/:username', optionalAuth, getUserProfile);
router.get('/id/:userId', getUserById);
router.get('/:userId/profile', getUserById);  // Alias for frontend compatibility
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

export default router;
