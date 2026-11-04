import express from 'express';
import * as letterController from '../controllers/letterController';
import * as commentController from '../controllers/commentController';
import * as likeController from '../controllers/likeController';
import * as repostController from '../controllers/repostController';
import * as guestController from '../controllers/guestInteractionController';
import * as publicThreadController from '../controllers/publicThreadController';
import * as recipientShare from '../controllers/recipientShareController';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware';

const router = express.Router();

// Recipient bearer links are separate from discoverable/public letters.
router.get('/recipient/:token', recipientShare.readRecipientLetter);
router.post('/recipient/:token/reply', recipientShare.limitRecipientReplies, recipientShare.replyToRecipientLetter);

// Public reads allow anonymous visitors while optionally personalizing engagement state.
router.get('/public', optionalAuth, letterController.getPublicLetters);
router.get('/public/:token/share', letterController.getPublicLetterSharePreview);
router.get('/public/:token/thread', publicThreadController.getPublicThread);
router.post('/public/:token/thread', optionalAuth, publicThreadController.limitThreadPosts, publicThreadController.postPublicThread);
router.get('/public/:token/guest', guestController.getGuestInteractions);
router.post('/public/:token/guest', guestController.guestRateLimit, guestController.postGuestInteraction);
router.get('/public/:token', letterController.getPublicLetterById);
router.get('/:id/comments', optionalAuth, commentController.getComments);
router.get('/:id/likes', optionalAuth, likeController.getLikes);
router.get('/user/:username', optionalAuth, letterController.getUserPublicLetters);
router.get('/user/:username/reposts', optionalAuth, repostController.getPublicUserReposts);

router.use(authenticateToken);
router.post('/', letterController.createLetter);
router.post('/drafts/:id/publish', letterController.publishDraft);
router.post('/:id/recipient-link', recipientShare.createRecipientLink);
router.get('/:id/recipient-link', recipientShare.getRecipientLinkStatus);
router.delete('/:id/recipient-link', recipientShare.revokeRecipientLinks);
router.get('/:id/recipient-replies', recipientShare.getRecipientReplies);
router.get('/mine', letterController.getMyLetters);
router.post('/:id/email', letterController.sendLetterByEmail);
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
router.post('/:id/restore', letterController.restoreArchivedLetter);
router.get('/reposts', repostController.getUserReposts);
router.post('/:id/repost', repostController.toggleRepost);
router.get('/:id/repost/status', repostController.checkRepostStatus);

export default router;
