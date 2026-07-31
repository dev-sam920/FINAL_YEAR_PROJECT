import express from 'express';
import { signup, technicianSignup, login, logout, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { createUploadMiddleware } from '../config/cloudinary.js';

const router = express.Router();

const upload = createUploadMiddleware({
  fieldNameToFolder: {
    profilePicture: 'profile-pictures',
    idDocument: 'technician-documents',
    default: 'uploads',
  },
  allowedMimeTypes: {
    profilePicture: ['image/png', 'image/jpeg', 'image/jpg'],
    idDocument: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
  },
  errorMessage: 'Unsupported file type',
});

/**
 * Public routes
 */
router.post('/signup', signup);
router.get('/debug-env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    isProd: process.env.NODE_ENV === 'production',
  });
});
router.post('/technician-signup', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'idDocument', maxCount: 1 },
]), technicianSignup);
router.post('/login', login);

/**
 * Protected routes
 */
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
