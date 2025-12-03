import express from 'express';
import * as letterController from '../controllers/letterController';
import * as commentController from '../controllers/commentController';
import * as likeController from '../controllers/likeController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes (some might be accessible without auth, but we use auth middleware to check for user context)
router.get('/public', authenticateToken, letterController.getPublicLetters);
router.get('/:id/comments', commentController.getComments);
router.get('/:id/likes', likeController.getLikes);
router.get('/user/:username', authenticateToken, letterController.getUserPublicLetters);

// Protected routes
router.use(authenticateToken);
router.post('/', letterController.createLetter);
router.get('/mine', letterController.getMyLetters);
router.get('/drafts', letterController.getDrafts);

// Comment routes (protected)
router.post('/:id/comments', commentController.createComment);
router.delete('/:id/comments/:commentId', commentController.deleteComment);

// Like routes (protected)
router.post('/:id/like', likeController.toggleLike);

// Letter management routes (protected)
router.delete('/:id', letterController.deleteLetter);
router.put('/:id', letterController.updateLetter);

export default router;
