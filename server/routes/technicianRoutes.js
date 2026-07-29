import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getTechnicianStats, getTechnicianRequests, changeTechnicianPassword, updateTechnicianRequestStatus } from '../controllers/technicianController.js';

const router = express.Router();

router.use(protect, authorize('technician'));

router.get('/stats', getTechnicianStats);
router.get('/requests', getTechnicianRequests);
router.patch('/change-password', changeTechnicianPassword);
router.patch('/requests/:id/status', updateTechnicianRequestStatus);

export default router;
