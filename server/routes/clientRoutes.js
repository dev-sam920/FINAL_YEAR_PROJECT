import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { updateProfile } from '../controllers/userController.js';

const router = express.Router();

router.patch('/profile', protect, authorize('client'), updateProfile);

export default router;
