import express from 'express';
import { protect, authorize, requireProfileCompletion } from '../middleware/authMiddleware.js';
import { createRequest, getMyRequests, rateRequest, setEmojiFeedback } from '../controllers/requestController.js';
import { getTechnicianStats, getTechnicianRequests, updateTechnicianRequestStatus } from '../controllers/technicianController.js';
import { createUploadMiddleware } from '../config/cloudinary.js';

const router = express.Router();

const upload = createUploadMiddleware({
  fieldNameToFolder: {
    photo: 'request-photos',
    default: 'uploads',
  },
  allowedMimeTypes: {
    photo: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
  },
  fileSize: 4 * 1024 * 1024,
  errorMessage: 'Image must be under 4MB',
});

router.post('/', protect, requireProfileCompletion, upload.single('photo'), createRequest);
router.get('/my-requests', protect, requireProfileCompletion, getMyRequests);
router.patch('/:id/rating', protect, requireProfileCompletion, authorize('client'), rateRequest);
router.patch('/:id/emoji-feedback', protect, requireProfileCompletion, authorize('client'), setEmojiFeedback);

router.get('/technician/stats', protect, getTechnicianStats);
router.get('/technician/requests', protect, getTechnicianRequests);
router.patch('/technician/requests/:id/status', protect, updateTechnicianRequestStatus);

export default router;
