import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/authMiddleware.js';
import { updateProfile, changePassword, uploadProfilePicture } from '../controllers/userController.js';

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'profile-pictures');
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname);
      cb(null, `${req.user.id}-${Date.now()}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed'));
    }
  },
});

router.patch('/profile', protect, updateProfile);
router.patch('/change-password', protect, changePassword);
router.post('/profile-picture', protect, upload.single('profilePicture'), uploadProfilePicture);

export default router;
