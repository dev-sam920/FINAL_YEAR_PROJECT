import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { updateProfile } from '../controllers/userController.js';
import { changePassword, deleteAccount, updateNotificationPreferences } from '../controllers/clientController.js';

const router = express.Router();

// These are actions performed by the authenticated user on their own account.
// Do not restrict to the 'client' role only; any authenticated user (technician/admin/client)
// should be able to update their own profile, change their password, manage notification
// preferences, or delete their own account. Authorization to modify other users is still
// enforced in controllers by using `req.user.id`.
router.patch('/profile', protect, updateProfile);
router.patch('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);
router.patch('/notification-preferences', protect, updateNotificationPreferences);

export default router;
