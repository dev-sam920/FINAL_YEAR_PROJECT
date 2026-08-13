import mongoose from 'mongoose';
import Request from '../models/Request.js';
import User from '../models/User.js';
import Withdrawal from '../models/Withdrawal.js';
import { createNotification } from './notificationController.js';
import { getUploadedAssetUrl } from '../config/cloudinary.js';
import { paymentDueEmailTemplate, sendEmail } from '../config/emailConfig.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const MINIMUM_WITHDRAWAL_AMOUNT = 1000;

const getPaystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

const calculateTechnicianAvailableBalance = async (technicianId) => {
  const paidRequests = await Request.find({
    assignedTechnician: technicianId,
    paymentStatus: { $in: ['paid', 'confirmed'] },
    jobCost: { $ne: null },
  }).select('jobCost').lean();

  const earnedBalance = paidRequests.reduce((sum, request) => sum + Number(request.jobCost || 0), 0);

  const pendingWithdrawals = await Withdrawal.find({
    technician: technicianId,
    status: { $in: ['pending', 'success'] },
  }).select('amount').lean();

  const withdrawnAmount = pendingWithdrawals.reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);

  return Number((earnedBalance - withdrawnAmount).toFixed(2));
};

const resolveBankAccountDetails = async (accountNumber, bankCode) => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key is not configured');
  }

  const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`, {
    method: 'GET',
    headers: getPaystackHeaders(),
  });

  const paystackPayload = await paystackResponse.json();
  if (!paystackResponse.ok || !paystackPayload.status) {
    throw new Error(paystackPayload.message || 'Unable to verify the bank account');
  }

  return {
    accountName: paystackPayload.data?.account_name || '',
    bankName: paystackPayload.data?.bank_name || '',
  };
};

export const getTechnicianBankList = async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ message: 'Paystack secret key is not configured' });
    }

    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
      method: 'GET',
      headers: getPaystackHeaders(),
    });

    const paystackPayload = await paystackResponse.json();
    if (!paystackResponse.ok || !paystackPayload.status) {
      return res.status(502).json({ message: paystackPayload.message || 'Unable to load bank list' });
    }

    const banks = Array.isArray(paystackPayload.data)
      ? paystackPayload.data
          .filter((bank) => bank?.code && bank?.name)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((bank) => ({
            code: bank.code,
            name: bank.name,
          }))
      : [];

    res.status(200).json({ banks });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load bank list' });
  }
};

export const getTechnicianBalance = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const availableBalance = await calculateTechnicianAvailableBalance(technicianId);
    const technician = await User.findById(technicianId).select('bankName accountNumber accountName bankCode paystackRecipientCode');

    res.status(200).json({
      availableBalance,
      minimumWithdrawalAmount: MINIMUM_WITHDRAWAL_AMOUNT,
      bankAccount: technician ? {
        bankName: technician.bankName || '',
        accountNumber: technician.accountNumber || '',
        accountName: technician.accountName || '',
        bankCode: technician.bankCode || '',
      } : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load technician balance' });
  }
};

export const getTechnicianWithdrawals = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const withdrawals = await Withdrawal.find({ technician: technicianId }).sort({ createdAt: -1 }).lean();

    res.status(200).json({ withdrawals });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load withdrawal history' });
  }
};

export const submitTechnicianBankAccount = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { bankCode, accountNumber, bankName, confirmAccount } = req.body;
    const normalizedBankCode = String(bankCode || '').trim();
    const normalizedAccountNumber = String(accountNumber || '').trim();
    const normalizedBankName = String(bankName || '').trim();

    if (!normalizedBankCode || !normalizedAccountNumber) {
      return res.status(400).json({ message: 'Please provide a bank code and account number' });
    }

    const resolvedAccount = await resolveBankAccountDetails(normalizedAccountNumber, normalizedBankCode);
    if (!resolvedAccount.accountName) {
      return res.status(400).json({ message: 'Unable to verify this account' });
    }

    if (!confirmAccount) {
      return res.status(200).json({
        message: 'Account verified. Please confirm before saving.',
        accountName: resolvedAccount.accountName,
        requiresConfirmation: true,
      });
    }

    const technician = await User.findById(technicianId);
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    technician.bankName = normalizedBankName || resolvedAccount.bankName || technician.bankName || '';
    technician.accountNumber = normalizedAccountNumber;
    technician.accountName = resolvedAccount.accountName;
    technician.bankCode = normalizedBankCode;
    await technician.save();

    res.status(200).json({
      message: 'Bank account saved successfully',
      accountName: resolvedAccount.accountName,
      bankAccount: {
        bankName: technician.bankName,
        accountNumber: technician.accountNumber,
        accountName: technician.accountName,
        bankCode: technician.bankCode,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to verify bank account' });
  }
};

export const requestTechnicianWithdrawal = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { amount } = req.body;
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid withdrawal amount' });
    }

    const availableBalance = await calculateTechnicianAvailableBalance(technicianId);
    if (parsedAmount > availableBalance) {
      return res.status(400).json({ message: 'Withdrawal amount exceeds your available balance' });
    }

    if (parsedAmount < MINIMUM_WITHDRAWAL_AMOUNT) {
      return res.status(400).json({ message: `Minimum withdrawal amount is ₦${MINIMUM_WITHDRAWAL_AMOUNT.toLocaleString()}` });
    }

    const technician = await User.findById(technicianId).select('bankName accountNumber accountName bankCode paystackRecipientCode');
    if (!technician?.accountNumber || !technician?.bankCode || !technician?.accountName) {
      return res.status(400).json({ message: 'Please add and confirm your bank account first' });
    }

    const withdrawal = await Withdrawal.create({
      technician: technicianId,
      amount: parsedAmount,
      bankName: technician.bankName || '',
      accountNumber: technician.accountNumber,
      accountName: technician.accountName,
      bankCode: technician.bankCode,
      status: 'pending',
    });

    let recipientCode = technician.paystackRecipientCode || '';
    if (!recipientCode) {
      // SIMULATED: Skip the live Paystack transfer-recipient creation for demo mode.
      // The bank verification step still uses the real resolve-account endpoint.
      recipientCode = `SIMULATED-RECIPIENT-${Date.now()}`;
      technician.paystackRecipientCode = recipientCode;
      await technician.save();
    }

    // SIMULATED: Paystack starter accounts cannot initiate third-party transfers.
    // Replace this block with the commented-out real Paystack transfer call once
    // business verification is complete and the account can send payouts.
    withdrawal.status = 'success';
    const simulatedTransferTimestamp = Date.now();
    withdrawal.paystackTransferCode = `SIMULATED-${simulatedTransferTimestamp}`;
    withdrawal.paystackTransferReference = `SIMULATED-${simulatedTransferTimestamp}`;
    await withdrawal.save();

    /*
    const transferResponse = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
      method: 'POST',
      headers: getPaystackHeaders(),
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(parsedAmount * 100),
        recipient: recipientCode,
        reason: 'SmartMaint technician withdrawal',
      }),
    });

    const transferPayload = await transferResponse.json();
    if (!transferResponse.ok || !transferPayload.status) {
      withdrawal.status = 'failed';
      await withdrawal.save();
      return res.status(502).json({ message: transferPayload.message || 'Unable to initiate Paystack transfer' });
    }

    withdrawal.paystackTransferCode = transferPayload.data?.transfer_code || null;
    withdrawal.paystackTransferReference = transferPayload.data?.reference || null;
    await withdrawal.save();
    */

    res.status(200).json({
      message: 'Withdrawal successful',
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to request withdrawal' });
  }
};

export const handlePaystackWebhook = async (req, res) => {
  try {
    const event = req.body;
    if (!event?.event) {
      return res.status(200).json({ received: true });
    }

    const status = event.event === 'transfer.success' || event.data?.status === 'success'
      ? 'success'
      : event.event === 'transfer.failed' || event.data?.status === 'failed'
        ? 'failed'
        : null;

    if (!status) {
      return res.status(200).json({ received: true });
    }

    const reference = event.data?.reference || event.data?.transfer_code || null;
    const query = reference ? { $or: [{ paystackTransferReference: reference }, { paystackTransferCode: reference }] } : {};
    const withdrawal = await Withdrawal.findOne(query);

    if (!withdrawal) {
      return res.status(200).json({ received: true });
    }

    withdrawal.status = status;
    await withdrawal.save();

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to process webhook' });
  }
};

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
    const { status, note, jobCost } = req.body;

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

    if (status === 'in-progress' && request.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Cannot start work until payment has been completed' });
    }

    request.status = status;
    if (status === 'completed' && typeof note === 'string') {
      request.completionNote = note.trim();
    }

    if (status === 'completed') {
      if (request.paymentStatus === 'paid' && typeof request.jobCost === 'number' && typeof request.totalAmount === 'number') {
        // Preserve completed payment details when the request was already paid before work started.
      } else {
        const parsedJobCost = Number(jobCost);
        if (!Number.isFinite(parsedJobCost) || parsedJobCost <= 0) {
          return res.status(400).json({ message: 'Please enter a valid job cost before completing the request' });
        }

        const platformFee = Math.round(parsedJobCost * 0.10);
        const totalAmount = parsedJobCost + platformFee;

        request.jobCost = parsedJobCost;
        request.platformFee = platformFee;
        request.totalAmount = totalAmount;
        request.paymentStatus = 'unpaid';
        request.paymentReference = null;
        request.paidAt = null;
      }
    }

    await request.save();

    const populatedRequest = await Request.findById(id).populate('client', 'fullName email phone');

    if (populatedRequest?.client) {
      const clientId = typeof populatedRequest.client === 'string' ? populatedRequest.client : populatedRequest.client._id?.toString?.() || populatedRequest.client.toString();
      const requestTitle = populatedRequest.title || 'your request';
      const statusLabel = status === 'completed' ? 'completed' : status;

      if (status === 'completed') {
        await Promise.all([
          createNotification({
            recipientId: clientId,
            message: `Your request '${requestTitle}' is complete — please rate the service`,
            type: 'rating_prompt',
            relatedRequest: populatedRequest._id,
          }),
          createNotification({
            recipientId: clientId,
            message: `Your completed request '${requestTitle}' is ready for payment. Total amount due is ₦${Number(populatedRequest.totalAmount || 0).toLocaleString()} — please proceed to payment.`,
            type: 'payment',
            relatedRequest: populatedRequest._id,
          }),
        ]);

        try {
          const paymentLink = `${process.env.CLIENT_URL || 'https://smartmaint.app'}/my-requests`;
          await sendEmail({
            to: populatedRequest.client.email,
            subject: 'Payment Due - SmartMaint',
            html: paymentDueEmailTemplate(
              populatedRequest.client.fullName || populatedRequest.client.email,
              requestTitle,
              populatedRequest.jobCost,
              populatedRequest.platformFee,
              populatedRequest.totalAmount,
              paymentLink,
            ),
          });
        } catch (emailError) {
          console.error('Failed to send payment due email:', emailError?.message || emailError);
        }
      } else {
        await createNotification({
          recipientId: clientId,
          message: `Your request '${requestTitle}' is now ${statusLabel}`,
          type: 'status_update',
          relatedRequest: populatedRequest._id,
        });
      }
    }

    const updatedRequest = populatedRequest || await Request.findById(id).populate('client', 'fullName email phone');

    res.status(200).json({ message: 'Status updated', request: updatedRequest });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update request status' });
  }
};

export const setTechnicianRequestPrice = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;
    const { price } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request identifier' });
    }

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (String(request.assignedTechnician) !== String(technicianId)) {
      return res.status(403).json({ message: 'You are not assigned to this request' });
    }
    if (request.status !== 'acknowledged') {
      return res.status(400).json({ message: 'Price can only be set for requests in Acknowledged status' });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: 'Please enter a valid job price' });
    }

    request.jobPrice = parsedPrice;
    request.jobCost = parsedPrice;
    request.platformFee = Math.round(parsedPrice * 0.10);
    request.totalAmount = parsedPrice;
    request.paymentStatus = 'unpaid';
    request.paymentReference = null;
    request.paidAt = null;
    await request.save();

    const populatedRequest = await Request.findById(id).populate('client', 'fullName email phone');
    if (populatedRequest?.client) {
      const clientId = typeof populatedRequest.client === 'string'
        ? populatedRequest.client
        : populatedRequest.client._id?.toString?.() || populatedRequest.client.toString();

      await createNotification({
        recipientId: clientId,
        message: `A price quote of ₦${parsedPrice.toLocaleString()} is ready for your request '${populatedRequest.title || 'request'}'. Please pay now to continue.`,
        type: 'payment',
        relatedRequest: populatedRequest._id,
      });
    }

    res.status(200).json({ message: 'Price set successfully', request: populatedRequest });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to set request price' });
  }
};

export const acknowledgeTechnicianRequest = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request identifier' });
    }

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (String(request.assignedTechnician) !== String(technicianId)) {
      return res.status(403).json({ message: 'You are not assigned to this request' });
    }
    if (request.status !== 'assigned') {
      return res.status(400).json({ message: 'Request must be in Assigned status to acknowledge' });
    }

    request.status = 'acknowledged';
    await request.save();

    const populatedRequest = await Request.findById(id).populate('client', 'fullName email phone').populate('assignedTechnician', 'fullName');

    if (populatedRequest?.client) {
      const clientId = typeof populatedRequest.client === 'string' ? populatedRequest.client : populatedRequest.client._id?.toString?.() || populatedRequest.client.toString();
      await createNotification({
        recipientId: clientId,
        message: `Your assigned request '${populatedRequest.title || 'request'}' has been acknowledged by the technician.`,
        type: 'status_update',
        relatedRequest: populatedRequest._id,
      });
    }

    res.status(200).json({ message: 'Request acknowledged', request: populatedRequest });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to acknowledge request' });
  }
};
