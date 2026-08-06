import express from 'express';
import { protect, authorize, requireProfileCompletion } from '../middleware/authMiddleware.js';
import { initializePayment, verifyPayment, getMyPayments } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/initialize', protect, requireProfileCompletion, authorize('client'), initializePayment);
router.get('/verify/:reference', protect, requireProfileCompletion, authorize('client'), verifyPayment);
router.get('/my-payments', protect, requireProfileCompletion, authorize('client'), getMyPayments);

export default router;
