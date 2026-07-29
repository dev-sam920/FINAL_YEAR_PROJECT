import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadNotificationCount);
router.patch('/:id/read', protect, markNotificationAsRead);
router.patch('/mark-all-read', protect, markAllNotificationsAsRead);

export default router;
