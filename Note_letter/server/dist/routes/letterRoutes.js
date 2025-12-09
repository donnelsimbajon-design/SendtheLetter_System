"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const letterController = __importStar(require("../controllers/letterController"));
const commentController = __importStar(require("../controllers/commentController"));
const likeController = __importStar(require("../controllers/likeController"));
const repostController = __importStar(require("../controllers/repostController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes (some might be accessible without auth, but we use auth middleware to check for user context)
router.get('/public', authMiddleware_1.authenticateToken, letterController.getPublicLetters);
router.get('/:id/comments', commentController.getComments);
router.get('/:id/likes', likeController.getLikes);
router.get('/user/:username', authMiddleware_1.authenticateToken, letterController.getUserPublicLetters);
// Protected routes
router.use(authMiddleware_1.authenticateToken);
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
router.put('/drafts/:id', letterController.updateDraft);
// New enhanced features routes
router.get('/scheduled', letterController.getScheduledLetters);
router.get('/time-capsules', letterController.getTimeCapsules);
router.get('/archived', letterController.getArchivedLetters);
router.post('/:id/archive', letterController.archiveLetter);
// Repost routes
router.get('/reposts', repostController.getUserReposts);
router.post('/:id/repost', repostController.toggleRepost);
router.get('/:id/repost/status', repostController.checkRepostStatus);
router.get('/user/:username/reposts', repostController.getPublicUserReposts);
exports.default = router;
