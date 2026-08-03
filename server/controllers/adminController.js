import crypto from 'crypto';
import Request from '../models/Request.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { sendEmail, technicianWelcomeEmailTemplate } from '../config/emailConfig.js';
import { createNotification } from './notificationController.js';

const normalizeStatus = (value) => {
  if (!value) return '';

  const normalized = String(value).trim().toLowerCase();
  const mapping = {
    pending: 'submitted',
    submitted: 'submitted',
    'in progress': 'in-progress',
    'in-progress': 'in-progress',
    completed: 'completed',
  };

  return mapping[normalized] || normalized;
};

export const getAdminStats = async (req, res) => {
  try {
    const totalRequests = await Request.countDocuments();
    const pendingCount = await Request.countDocuments({ status: 'submitted' });
    const inProgressCount = await Request.countDocuments({ status: 'in-progress' });
    const completedCount = await Request.countDocuments({ status: 'completed' });

    const totalClients = await User.countDocuments({ role: 'client' });
    const totalTechnicians = await User.countDocuments({ role: 'technician' });

    res.status(200).json({
      totalRequests,
      pendingCount,
      pendingRequests: pendingCount,
      inProgressCount,
      inProgressRequests: inProgressCount,
      completedCount,
      completedRequests: completedCount,
      totalClients,
      totalTechnicians,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load admin stats' });
  }
};

export const getAllRequestsAdmin = async (req, res) => {
  try {
    const { status, category, priority, search } = req.query;
    const filter = {};

    if (status) {
      const normalizedStatus = normalizeStatus(status);
      if (normalizedStatus) filter.status = normalizedStatus;
    }
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    if (search) {
      const regex = new RegExp(search, 'i');
      const requestsAll = await Request.find(filter)
        .populate('client', 'fullName email')
        .populate('assignedTechnician', 'fullName')
        .sort({ createdAt: -1 })
        .lean();

      const requests = requestsAll.filter((r) => {
        if (regex.test(r.title || '')) return true;
        if (r.client && regex.test(r.client.fullName || '')) return true;
        return false;
      });

      return res.status(200).json({ requests });
    }

    const requests = await Request.find(filter)
      .populate('client', 'fullName email')
      .populate('assignedTechnician', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ requests });
  } catch (error) {
    console.error('Failed to load admin requests:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      response: error.response,
    });
    res.status(500).json({ message: error.message || 'Failed to load requests' });
  }
};

const generateTemporaryPassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const all = upper + lower + digits;

  let password = [
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    digits[crypto.randomInt(0, digits.length)],
  ].join('');

  while (password.length < 10) {
    password += all[crypto.randomInt(0, all.length)];
  }

  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

export const getTechniciansAdmin = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician', accountStatus: { $ne: 'pending' } }).select('fullName email specialty idDocument yearsOfExperience bio').lean();

    const techsWithCounts = await Promise.all(
      technicians.map(async (tech) => {
        const [assignedCount, ratedRequests] = await Promise.all([
          Request.countDocuments({ assignedTechnician: tech._id }),
          Request.find({ assignedTechnician: tech._id, rating: { $ne: null } }).select('rating').lean(),
        ]);

        const totalRatedJobs = ratedRequests.length;
        const averageRating = totalRatedJobs > 0
          ? Number((ratedRequests.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / totalRatedJobs).toFixed(1))
          : null;

        return {
          ...tech,
          assignedCount,
          averageRating,
          totalRatedJobs,
        };
      })
    );

    res.status(200).json({ technicians: techsWithCounts });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load technicians' });
  }
};

export const getPendingTechniciansAdmin = async (req, res) => {
  try {
    const pendingTechnicians = await User.find({ role: 'technician', accountStatus: 'pending' })
      .select('fullName email phone state lga specialty yearsOfExperience bio profilePicture idDocument createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const technicians = pendingTechnicians.map((tech) => {
      const normalizeAssetUrl = (asset) => {
        if (!asset) return null;
        if (typeof asset === 'string' && /^(https?:)?\/\//i.test(asset)) return asset;
        if (typeof asset === 'string' && asset.startsWith('/')) {
          return `${req.protocol}://${req.get('host')}${asset}`;
        }
        return asset;
      };

      return {
        ...tech,
        profilePicture: normalizeAssetUrl(tech.profilePicture),
        idDocument: normalizeAssetUrl(tech.idDocument),
        dateApplied: tech.createdAt,
      };
    });

    res.status(200).json({ technicians });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load pending technicians' });
  }
};

export const reviewTechnicianApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid technician ID' });
    }

    const technician = await User.findOne({ _id: id, role: 'technician' });
    if (!technician) {
      return res.status(404).json({ message: 'Technician application not found' });
    }

    if (technician.accountStatus === 'approved' && action === 'approve') {
      return res.status(200).json({ message: 'Technician is already approved', technician });
    }

    if (action === 'approve') {
      technician.accountStatus = 'approved';
      technician.passwordChanged = false;
      await technician.save();

      try {
        await sendEmail({
          to: technician.email,
          subject: 'Your SmartMaint technician account has been approved',
          html: `<p>Hi ${technician.fullName},</p><p>Your technician application has been approved. You can now sign in to SmartMaint.</p>`,
        });
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      return res.status(200).json({ message: 'Technician application approved', technician });
    }

    if (action === 'decline') {
      technician.accountStatus = 'declined';
      await technician.save();

      try {
        await sendEmail({
          to: technician.email,
          subject: 'Your SmartMaint technician application was declined',
          html: `<p>Hi ${technician.fullName},</p><p>We are unable to approve your technician application at this time. Please contact support for more information.</p>`,
        });
      } catch (emailError) {
        console.error('Failed to send decline email:', emailError);
      }

      return res.status(200).json({ message: 'Technician application declined', technician });
    }

    return res.status(400).json({ message: 'Invalid action' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update technician application' });
  }
};

export const createTechnician = async (req, res) => {
  try {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: 'Please provide full name and email' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const temporaryPassword = generateTemporaryPassword();
    const technician = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      password: temporaryPassword,
      role: 'technician',
      passwordChanged: false,
    });

    const loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login` : '#';
    try {
      await sendEmail({
        to: technician.email,
        subject: 'Your SmartMaint technician account is ready',
        html: technicianWelcomeEmailTemplate({
          fullName: technician.fullName,
          email: technician.email,
          password: temporaryPassword,
          loginUrl,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send technician credentials email:', emailError);
    }

    const technicianResponse = technician.toObject();
    delete technicianResponse.password;

    res.status(201).json({
      message: 'Technician added, login details sent to their email',
      technician: technicianResponse,
    });
  } catch (error) {
    console.error('Failed to create technician:', error);
    res.status(500).json({ message: error.message || 'Failed to create technician' });
  }
};

export const getClientsAdmin = async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' }).select('fullName email phone unitAddress').lean();
    res.status(200).json({ clients });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load clients' });
  }
};

export const setRequestCost = async (req, res) => {
  try {
    const { id } = req.params;
    const { cost } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const numericCost = Number(cost);
    if (!Number.isFinite(numericCost) || numericCost < 0) {
      return res.status(400).json({ message: 'Cost must be a non-negative number' });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed requests can receive a service cost' });
    }

    request.cost = numericCost;
    request.paymentStatus = numericCost > 0 ? 'unpaid' : 'unpaid';
    request.paymentReference = null;
    request.paidAt = null;
    await request.save();

    await createNotification({
      recipientId: request.client,
      message: `Your completed request now has a service fee of ₦${numericCost} — please proceed to payment.`,
      type: 'payment',
      relatedRequest: request._id,
    });

    const updatedRequest = await Request.findById(id).populate('client', 'fullName email');
    res.status(200).json({ message: 'Service cost set successfully', request: updatedRequest });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to set request cost' });
  }
};

export const assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(technicianId)) {
      return res.status(400).json({ message: 'Invalid identifiers provided' });
    }

    const tech = await User.findById(technicianId);
    if (!tech || tech.role !== 'technician') {
      return res.status(400).json({ message: 'Technician not found or invalid' });
    }

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const prevStatus = request.status;
    request.assignedTechnician = technicianId;
    if (prevStatus === 'submitted') request.status = 'acknowledged';

    await request.save();

    if (request.assignedTechnician) {
      await Promise.all([
        createNotification({
          recipientId: request.assignedTechnician,
          message: `You've been assigned: ${request.title}`,
          type: 'assignment',
          relatedRequest: request._id,
        }),
        createNotification({
          recipientId: request.client,
          message: 'A technician has been assigned to your request',
          type: 'assignment',
          relatedRequest: request._id,
        }),
      ]);
    }

    const populated = await Request.findById(id).populate('client', 'fullName email').populate('assignedTechnician', 'fullName');

    res.status(200).json({ request: populated });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to assign technician' });
  }
};
