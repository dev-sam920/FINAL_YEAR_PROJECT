import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { createRequest, getMyRequests, rateRequest, setEmojiFeedback } from '../controllers/requestController.js';
import { getTechnicianStats, getTechnicianRequests, updateTechnicianRequestStatus } from '../controllers/technicianController.js';

const router = express.Router();

router.post('/', protect, createRequest);
router.get('/my-requests', protect, getMyRequests);
router.patch('/:id/rating', protect, authorize('client'), rateRequest);
router.patch('/:id/emoji-feedback', protect, authorize('client'), setEmojiFeedback);

router.get('/technician/stats', protect, getTechnicianStats);
router.get('/technician/requests', protect, getTechnicianRequests);
router.patch('/technician/requests/:id/status', protect, updateTechnicianRequestStatus);

export default router;
