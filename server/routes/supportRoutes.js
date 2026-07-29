import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { sendSupportMessage } from '../controllers/supportController.js';

const router = express.Router();

router.post('/contact', protect, sendSupportMessage);

export default router;
