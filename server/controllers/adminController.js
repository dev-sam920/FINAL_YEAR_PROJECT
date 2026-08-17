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

      const requests = requestsAll
        .filter((r) => {
          if (regex.test(r.title || '')) return true;
          if (r.client && regex.test(r.client.fullName || '')) return true;
          return false;
        })
        .map((request) => ({
          ...request,
          clientName: request.client?.fullName || request.clientName || null,
        }));

      return res.status(200).json({ requests });
    }

    let requests = await Request.find(filter)
      .populate('client', 'fullName email')
      .populate('assignedTechnician', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    requests = requests.map((request) => ({
      ...request,
      clientName: request.client?.fullName || request.clientName || null,
    }));

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

export const getAdminPayments = async (req, res) => {
  try {
    const payments = await Request.find({
      paymentStatus: { $in: ['paid', 'unpaid'] },
      jobCost: { $ne: null },
    })
      .populate('client', 'fullName email')
      .populate('assignedTechnician', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    const paidRequests = payments.filter((payment) => payment.paymentStatus === 'paid');
    const unpaidWithCost = payments.filter(
      (payment) => payment.paymentStatus === 'unpaid' && Number(payment.totalAmount) > 0
    );

    const totalRevenue = paidRequests.reduce(
      (sum, payment) => sum + (Number(payment.platformFee) || 0),
      0
    );
    const totalTransactionValue = paidRequests.reduce(
      (sum, payment) => sum + (Number(payment.totalAmount) || 0),
      0
    );
    const pendingPaymentsCount = unpaidWithCost.length;

    res.status(200).json({
      payments,
      summary: {
        totalRevenue,
        totalTransactionValue,
        pendingPaymentsCount,
      },
    });
  } catch (error) {
    console.error('Failed to load admin payments:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({ message: error.message || 'Failed to load admin payments' });
  }
};

// --- Analytics endpoints ---
export const getAnalyticsOverview = async (req, res) => {
  try {
    const totalRequests = await Request.countDocuments();

    const paidRequests = await Request.find({ paymentStatus: 'paid' }).select('totalAmount platformFee').lean();
    const totalRevenue = paidRequests.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
    const totalPlatformFees = paidRequests.reduce((sum, r) => sum + (Number(r.platformFee) || 0), 0);

    const activeTechnicians = await User.countDocuments({ role: 'technician', accountStatus: { $ne: 'pending' } });

    const ratingAgg = await Request.aggregate([
      { $match: { rating: { $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);
    const averageRequestRating = ratingAgg[0] ? Number(ratingAgg[0].avgRating.toFixed(1)) : null;

    res.status(200).json({ totalRequests, totalRevenue, totalPlatformFees, activeTechnicians, averageRequestRating });
  } catch (error) {
    console.error('Failed to load analytics overview', error);
    res.status(500).json({ message: error.message || 'Failed to load analytics overview' });
  }
};

const fillDateSeries = (startDate, days, map) => {
  const series = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, value: map[key] || 0 });
  }
  return series;
};

export const getRequestsOverTime = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const agg = await Request.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const map = {};
    agg.forEach((r) => { map[r._id] = r.count; });
    const series = fillDateSeries(start, days, map).map((s) => ({ date: s.date, count: s.value }));

    res.status(200).json({ series });
  } catch (error) {
    console.error('Failed to load requests over time', error);
    res.status(500).json({ message: error.message || 'Failed to load requests over time' });
  }
};

export const getRevenueOverTime = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const agg = await Request.aggregate([
      { $match: { createdAt: { $gte: start }, paymentStatus: 'paid' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: { $ifNull: ['$totalAmount', 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    const map = {};
    agg.forEach((r) => { map[r._id] = r.revenue; });
    const series = fillDateSeries(start, days, map).map((s) => ({ date: s.date, revenue: s.value }));

    res.status(200).json({ series });
  } catch (error) {
    console.error('Failed to load revenue over time', error);
    res.status(500).json({ message: error.message || 'Failed to load revenue over time' });
  }
};

export const getRequestsByCategory = async (req, res) => {
  try {
    const agg = await Request.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const data = agg.map((a) => ({ category: a._id || 'Unspecified', count: a.count }));
    res.status(200).json({ data });
  } catch (error) {
    console.error('Failed to load requests by category', error);
    res.status(500).json({ message: error.message || 'Failed to load requests by category' });
  }
};

export const getRequestsByStatus = async (req, res) => {
  try {
    const agg = await Request.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const map = {};
    agg.forEach((a) => { map[a._id] = a.count; });
    const statuses = ['submitted', 'assigned', 'acknowledged', 'in-progress', 'completed'];
    const data = statuses.map((s) => ({ status: s, count: map[s] || 0 }));
    res.status(200).json({ data });
  } catch (error) {
    console.error('Failed to load requests by status', error);
    res.status(500).json({ message: error.message || 'Failed to load requests by status' });
  }
};

export const getTopTechnicians = async (req, res) => {
  try {
    const agg = await Request.aggregate([
      { $match: { assignedTechnician: { $ne: null } } },
      { $group: { _id: '$assignedTechnician', avgRating: { $avg: '$rating' }, completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
      { $sort: { avgRating: -1, completedCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { technicianId: '$_id', avgRating: { $ifNull: ['$avgRating', null] }, completedCount: 1, fullName: '$user.fullName', profilePicture: '$user.profilePicture' } },
    ]);

    res.status(200).json({ technicians: agg });
  } catch (error) {
    console.error('Failed to load top technicians', error);
    res.status(500).json({ message: error.message || 'Failed to load top technicians' });
  }
};

export const getCompletedGrowth = async (req, res) => {
  try {
    // Weekly: last 12 weeks (starting Monday)
    const weeks = 12;
    const now = new Date();
    // compute earliest date for weeks: start of week (Monday) 11 weeks ago
    const tmp = new Date(now);
    const day = (tmp.getDay() + 6) % 7; // 0..6 where 0 is Monday
    tmp.setHours(0, 0, 0, 0);
    tmp.setDate(tmp.getDate() - day); // start of current week (Monday)
    const weekStart = new Date(tmp);
    weekStart.setDate(weekStart.getDate() - (weeks - 1) * 7);

    // Monthly: last 12 months, earliest month start
    const months = 12;
    const monthStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    // Query completed requests since earliest of weekStart or monthStart
    const earliest = weekStart < monthStart ? weekStart : monthStart;

    const completed = await Request.find({ status: 'completed', updatedAt: { $gte: earliest } }).select('updatedAt').lean();

    // Bucket weekly
    const weekMap = {};
    const weekLabels = [];
    for (let i = 0; i < weeks; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i * 7);
      const key = d.toISOString().slice(0, 10);
      weekMap[key] = 0;
      weekLabels.push(key);
    }

    completed.forEach((r) => {
      const d = new Date(r.updatedAt || r.createdAt);
      // find Monday of that week
      const dayOfWeek = (d.getDay() + 6) % 7;
      const monday = new Date(d);
      monday.setHours(0, 0, 0, 0);
      monday.setDate(monday.getDate() - dayOfWeek);
      const key = monday.toISOString().slice(0, 10);
      if (Object.prototype.hasOwnProperty.call(weekMap, key)) {
        weekMap[key] += 1;
      }
    });

    const weeklySeries = weekLabels.map((k) => ({ weekStart: k, count: weekMap[k] || 0 }));

    // compute week over week growth (compare last two weeks)
    const last = weeklySeries[weeklySeries.length - 1]?.count || 0;
    const prev = weeklySeries[weeklySeries.length - 2]?.count || 0;
    let weekOverWeekGrowth = null;
    if (prev === 0) {
      weekOverWeekGrowth = prev === last ? 0 : null;
    } else {
      weekOverWeekGrowth = Number((((last - prev) / prev) * 100).toFixed(1));
    }

    // Bucket monthly
    const monthMap = {};
    const monthLabels = [];
    for (let i = 0; i < months; i++) {
      const m = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = 0;
      monthLabels.push(key);
    }

    completed.forEach((r) => {
      const d = new Date(r.updatedAt || r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (Object.prototype.hasOwnProperty.call(monthMap, key)) {
        monthMap[key] += 1;
      }
    });

    const monthlySeries = monthLabels.map((k) => ({ month: k, count: monthMap[k] || 0 }));

    const lastMonth = monthlySeries[monthlySeries.length - 1]?.count || 0;
    const prevMonth = monthlySeries[monthlySeries.length - 2]?.count || 0;
    let monthOverMonthGrowth = null;
    if (prevMonth === 0) {
      monthOverMonthGrowth = prevMonth === lastMonth ? 0 : null;
    } else {
      monthOverMonthGrowth = Number((((lastMonth - prevMonth) / prevMonth) * 100).toFixed(1));
    }

    res.status(200).json({
      weekly: { series: weeklySeries, weekOverWeekGrowth },
      monthly: { series: monthlySeries, monthOverMonthGrowth },
    });
  } catch (error) {
    console.error('Failed to load completed growth', error);
    res.status(500).json({ message: error.message || 'Failed to load completed growth' });
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

    request.assignedTechnician = technicianId;
    if (request.status === 'submitted') {
      request.status = 'assigned';
    }

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
