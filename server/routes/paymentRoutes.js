import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { initializePayment, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/initialize', protect, authorize('client'), initializePayment);
router.get('/verify/:reference', protect, authorize('client'), verifyPayment);

export default router;
