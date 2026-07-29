import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getAdminStats,
  getAllRequestsAdmin,
  getTechniciansAdmin,
  createTechnician,
  getClientsAdmin,
  assignTechnician,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/requests', getAllRequestsAdmin);
router.get('/technicians', getTechniciansAdmin);
router.post('/technicians', createTechnician);
router.get('/clients', getClientsAdmin);
router.patch('/requests/:id/assign', assignTechnician);

export default router;
