import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getTechnicianStats, getTechnicianRequests, changeTechnicianPassword, updateTechnicianRequestStatus, completeTechnicianProfile } from '../controllers/technicianController.js';
import { createUploadMiddleware } from '../config/cloudinary.js';

const router = express.Router();

const upload = createUploadMiddleware({
  fieldNameToFolder: {
    idDocument: 'technician-documents',
    default: 'uploads',
  },
  allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
  errorMessage: 'Only PDF, JPG, and PNG files are allowed',
});

router.use(protect, authorize('technician'));

router.get('/stats', getTechnicianStats);
router.get('/requests', getTechnicianRequests);
router.patch('/change-password', changeTechnicianPassword);
router.post('/complete-profile', upload.single('idDocument'), completeTechnicianProfile);
router.patch('/requests/:id/status', updateTechnicianRequestStatus);

export default router;
