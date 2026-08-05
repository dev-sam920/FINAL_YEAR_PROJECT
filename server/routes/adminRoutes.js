import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getAdminStats,
  getAllRequestsAdmin,
  getTechniciansAdmin,
  getPendingTechniciansAdmin,
  createTechnician,
  getClientsAdmin,
  assignTechnician,
  reviewTechnicianApplication,
  getAdminPayments,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/requests', getAllRequestsAdmin);
router.get('/payments', getAdminPayments);
router.get('/technicians', getTechniciansAdmin);
router.get('/technicians/pending', getPendingTechniciansAdmin);
router.post('/technicians', createTechnician);
router.patch('/technicians/:id/review', reviewTechnicianApplication);
router.get('/clients', getClientsAdmin);
router.patch('/requests/:id/assign', assignTechnician);

export default router;
