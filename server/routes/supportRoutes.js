import express from 'express';
import { protect, requireProfileCompletion, authorize } from '../middleware/authMiddleware.js';
import {
  createSupportTicket,
  getMySupportTickets,
  getSupportTicketById,
  replyToSupportTicket,
  updateSupportTicketStatus,
  getAllSupportTicketsAdmin,
} from '../controllers/supportTicketController.js';

const router = express.Router();

router.use(protect);

router.post('/contact', requireProfileCompletion, createSupportTicket);
router.post('/tickets', requireProfileCompletion, createSupportTicket);
router.get('/tickets', getMySupportTickets);
router.get('/tickets/:id', getSupportTicketById);
router.post('/tickets/:id/reply', replyToSupportTicket);
router.patch('/tickets/:id/status', authorize('admin'), updateSupportTicketStatus);
router.get('/admin/tickets', authorize('admin'), getAllSupportTicketsAdmin);

export default router;
