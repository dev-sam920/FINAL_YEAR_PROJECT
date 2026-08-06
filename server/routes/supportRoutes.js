import express from 'express';
import { protect, requireProfileCompletion } from '../middleware/authMiddleware.js';
import { sendSupportMessage } from '../controllers/supportController.js';

const router = express.Router();

router.post('/contact', protect, requireProfileCompletion, sendSupportMessage);

export default router;
