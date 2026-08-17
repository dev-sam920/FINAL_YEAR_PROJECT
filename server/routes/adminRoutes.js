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
  getAnalyticsOverview,
  getRequestsOverTime,
  getRevenueOverTime,
  getRequestsByCategory,
  getRequestsByStatus,
  getTopTechnicians,
  getCompletedGrowth,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/requests', getAllRequestsAdmin);
router.get('/payments', getAdminPayments);
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/requests-over-time', getRequestsOverTime);
router.get('/analytics/revenue-over-time', getRevenueOverTime);
router.get('/analytics/requests-by-category', getRequestsByCategory);
router.get('/analytics/requests-by-status', getRequestsByStatus);
router.get('/analytics/top-technicians', getTopTechnicians);
router.get('/analytics/completed-growth', getCompletedGrowth);
router.get('/technicians', getTechniciansAdmin);
router.get('/technicians/pending', getPendingTechniciansAdmin);
router.post('/technicians', createTechnician);
router.patch('/technicians/:id/review', reviewTechnicianApplication);
router.get('/clients', getClientsAdmin);
router.patch('/requests/:id/assign', assignTechnician);

export default router;
