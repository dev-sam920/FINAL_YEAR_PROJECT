import Request from '../models/Request.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';
import { getUploadedAssetUrl } from '../config/cloudinary.js';

export const getTechnicianStats = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const totalAssigned = await Request.countDocuments({ assignedTechnician: technicianId });
    const acknowledgedCount = await Request.countDocuments({ assignedTechnician: technicianId, status: 'acknowledged' });
    const inProgressCount = await Request.countDocuments({ assignedTechnician: technicianId, status: 'in-progress' });
    const completedCount = await Request.countDocuments({ assignedTechnician: technicianId, status: 'completed' });

    const ratedRequests = await Request.find({ assignedTechnician: technicianId, rating: { $ne: null } }).select('rating').lean();
    const totalRatedJobs = ratedRequests.length;
    const averageRating = totalRatedJobs > 0
      ? Number((ratedRequests.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / totalRatedJobs).toFixed(1))
      : null;

    res.status(200).json({ totalAssigned, acknowledgedCount, inProgressCount, completedCount, averageRating, totalRatedJobs });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load technician stats' });
  }
};

export const getTechnicianRequests = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { status } = req.query;
    const filter = { assignedTechnician: technicianId };

    if (status) {
      const normalizedStatus = status === 'In Progress' ? 'in-progress' : status.toLowerCase();
      filter.status = normalizedStatus;
    }

    const requests = await Request.find(filter)
      .populate('client', 'fullName email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load technician assignments' });
  }
};

export const changeTechnicianPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'technician') {
      return res.status(403).json({ message: 'Only technicians can use this endpoint' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.passwordChanged = true;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update password' });
  }
};

export const completeTechnicianProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'technician') {
      return res.status(403).json({ message: 'Only technicians can complete their profile' });
    }

    const fullName = String(req.body.fullName || '').trim();
    const phone = String(req.body.phone || '').trim();
    const address = String(req.body.address || '').trim();
    const state = String(req.body.state || '').trim();
    const lga = String(req.body.lga || '').trim();
    const specialty = String(req.body.specialty || '').trim();
    const yearsOfExperience = req.body.yearsOfExperience ? Number(req.body.yearsOfExperience) : null;
    const bio = String(req.body.bio || '').trim();

    if (!fullName || !phone || !address || !state || !lga || !specialty) {
      return res.status(400).json({ message: 'Please fill in all profile fields' });
    }

    if (Number.isNaN(yearsOfExperience)) {
      return res.status(400).json({ message: 'Years of experience must be a number' });
    }

    if (req.file && req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'ID document must be smaller than 5MB' });
    }

    const filePath = getUploadedAssetUrl(req.file, req.file ? `/uploads/technician-documents/${req.file.filename}` : null) || user.idDocument || null;

    user.fullName = fullName || user.fullName;
    user.phone = phone;
    user.address = address;
    user.state = state;
    user.lga = lga;
    user.specialty = specialty;
    user.yearsOfExperience = yearsOfExperience;
    user.bio = bio;
    user.idDocument = filePath;
    user.profileCompleted = true;
    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    res.status(200).json({
      message: 'Profile completed successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to complete profile' });
  }
};

export const updateTechnicianRequestStatus = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;
    const { status, note } = req.body;

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (String(request.assignedTechnician) !== String(technicianId)) {
      return res.status(403).json({ message: 'You are not assigned to this request' });
    }

    const allowedTransitions = {
      acknowledged: ['in-progress'],
      'in-progress': ['completed'],
      completed: [],
    };

    const currentStatus = request.status || 'submitted';
    if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(status)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    request.status = status;
    if (status === 'completed' && typeof note === 'string') {
      request.completionNote = note.trim();
    }

    await request.save();

    if (request.client) {
      const clientId = typeof request.client === 'string' ? request.client : request.client.toString();
      const requestTitle = request.title || 'your request';
      const statusLabel = status === 'completed' ? 'completed' : status;

      if (status === 'completed') {
        await createNotification({
          recipientId: clientId,
          message: `Your request '${requestTitle}' is complete — please rate the service`,
          type: 'rating_prompt',
          relatedRequest: request._id,
        });
      } else {
        await createNotification({
          recipientId: clientId,
          message: `Your request '${requestTitle}' is now ${statusLabel}`,
          type: 'status_update',
          relatedRequest: request._id,
        });
      }
    }

    const updatedRequest = await Request.findById(id).populate('client', 'fullName email phone');

    res.status(200).json({ message: 'Status updated', request: updatedRequest });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update request status' });
  }
};
