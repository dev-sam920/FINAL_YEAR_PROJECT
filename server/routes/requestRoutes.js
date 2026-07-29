import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createRequest, getMyRequests, rateRequest } from '../controllers/requestController.js';
import { getTechnicianStats, getTechnicianRequests, updateTechnicianRequestStatus } from '../controllers/technicianController.js';

const router = express.Router();

router.post('/', protect, createRequest);
router.get('/my-requests', protect, getMyRequests);
router.patch('/:id/rating', protect, rateRequest);

router.get('/technician/stats', protect, getTechnicianStats);
router.get('/technician/requests', protect, getTechnicianRequests);
router.patch('/technician/requests/:id/status', protect, updateTechnicianRequestStatus);

export default router;
