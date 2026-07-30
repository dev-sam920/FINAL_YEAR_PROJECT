import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { updateProfile, changePassword, uploadProfilePicture } from '../controllers/userController.js';
import { createUploadMiddleware } from '../config/cloudinary.js';

const router = express.Router();

const upload = createUploadMiddleware({
  fieldNameToFolder: {
    profilePicture: 'profile-pictures',
    default: 'uploads',
  },
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  errorMessage: 'Only JPG and PNG images are allowed',
});

router.patch('/profile', protect, updateProfile);
router.patch('/change-password', protect, changePassword);
router.post('/profile-picture', protect, upload.single('profilePicture'), uploadProfilePicture);

export default router;
