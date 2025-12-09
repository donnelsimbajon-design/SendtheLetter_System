"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const followController_1 = require("../controllers/followController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post('/:userId/toggle', authMiddleware_1.authenticateToken, followController_1.toggleFollow);
router.get('/profile/:username', authMiddleware_1.optionalAuth, followController_1.getUserProfile);
router.get('/id/:userId', followController_1.getUserById);
router.get('/:userId/followers', followController_1.getFollowers);
router.get('/:userId/following', followController_1.getFollowing);
exports.default = router;
