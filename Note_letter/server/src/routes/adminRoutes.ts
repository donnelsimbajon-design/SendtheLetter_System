import express from 'express';
import * as adminController from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = express.Router();
router.use(authenticateToken, requireAdmin);
router.get('/overview', adminController.getOverview);
router.get('/users', adminController.listUsers);
router.patch('/users/:id', adminController.updateUser);
router.get('/letters', adminController.listLetters);
router.post('/letters/:id/remove', adminController.moderateLetter);

export default router;
