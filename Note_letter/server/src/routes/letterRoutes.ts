import express from 'express';
import * as letterController from '../controllers/letterController';
import * as commentController from '../controllers/commentController';
import * as likeController from '../controllers/likeController';
import * as repostController from '../controllers/repostController';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware';

const router = express.Router();

// Public reads may personalize counts when a valid token is supplied.
router.get('/public', optionalAuth, letterController.getPublicLetters);
router.get('/:id/comments', optionalAuth, commentController.getComments);
router.get('/:id/likes', optionalAuth, likeController.getLikes);
router.get('/user/:username', optionalAuth, letterController.getUserPublicLetters);
router.get('/user/:username/reposts', optionalAuth, repostController.getPublicUserReposts);

router.use(authenticateToken);
router.post('/', letterController.createLetter);
router.get('/mine', letterController.getMyLetters);
router.get('/drafts', letterController.getDrafts);
router.post('/:id/comments', commentController.createComment);
router.delete('/:id/comments/:commentId', commentController.deleteComment);
router.post('/:id/like', likeController.toggleLike);
router.delete('/:id', letterController.deleteLetter);
router.put('/:id', letterController.updateLetter);
router.put('/drafts/:id', letterController.updateDraft);
router.get('/scheduled', letterController.getScheduledLetters);
router.get('/time-capsules', letterController.getTimeCapsules);
router.get('/archived', letterController.getArchivedLetters);
router.post('/:id/archive', letterController.archiveLetter);
router.get('/reposts', repostController.getUserReposts);
router.post('/:id/repost', repostController.toggleRepost);
router.get('/:id/repost/status', repostController.checkRepostStatus);

export default router;
