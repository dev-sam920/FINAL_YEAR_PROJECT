import Request from '../models/Request.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';
import { paymentReceivedEmailTemplate, sendEmail } from '../config/emailConfig.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const getPaystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

export const initializePayment = async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (String(request.client) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You are not authorized to pay for this request' });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed requests can be paid for' });
    }

    const totalAmount = Number(request.totalAmount ?? request.jobCost ?? 0);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: 'This request does not have a valid service cost yet' });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ message: 'Paystack secret key is not configured' });
    }

    const client = await User.findById(req.user.id).select('email fullName');
    if (!client?.email) {
      return res.status(400).json({ message: 'A valid client email is required for payment' });
    }

    const amountInKobo = Math.round(totalAmount * 100);
    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: getPaystackHeaders(),
      body: JSON.stringify({
        email: client.email,
        amount: amountInKobo,
        reference: `${Date.now()}-${request._id}`,
        metadata: {
          requestId: request._id.toString(),
          clientName: client.fullName || client.email,
        },
      }),
    });

    const paystackPayload = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackPayload.status) {
      console.error('Paystack init failed:', paystackPayload);
      return res.status(502).json({ message: paystackPayload.message || 'Payment initialization failed' });
    }

    request.paymentStatus = 'pending';
    request.paymentReference = paystackPayload.data.reference;
    request.paidAt = null;
    await request.save();

    res.status(200).json({
      message: 'Payment initialized successfully',
      authorizationUrl: paystackPayload.data.authorization_url,
      reference: paystackPayload.data.reference,
      request,
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ message: error.message || 'Failed to initialize payment' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ message: 'Payment reference is required' });
    }

    const request = await Request.findOne({ paymentReference: reference });
    if (!request) {
      return res.status(404).json({ message: 'Payment reference not found' });
    }

    if (String(request.client) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You are not authorized to verify this payment' });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ message: 'Paystack secret key is not configured' });
    }

    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: getPaystackHeaders(),
    });

    const paystackPayload = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackPayload.status) {
      console.error('Paystack verify failed:', paystackPayload);
      return res.status(502).json({ message: paystackPayload.message || 'Payment verification failed' });
    }

    if (paystackPayload.data?.status === 'success') {
      request.paymentStatus = 'paid';
      request.paymentReference = reference;
      request.paidAt = new Date();
      await request.save();

      await createNotification({
        recipientId: request.client,
        message: `Payment received for your completed request '${request.title || 'service'}' — thank you for paying.`,
        type: 'payment_received',
        relatedRequest: request._id,
      });

      const client = await User.findById(request.client).select('fullName email');
      if (client?.email) {
        try {
          await sendEmail({
            to: client.email,
            subject: 'Payment Received - SmartMaint',
            html: paymentReceivedEmailTemplate(client.fullName || client.email, request.title || 'your maintenance request', request.totalAmount),
          });
        } catch (emailError) {
          console.error('Failed to send payment received email:', emailError?.message || emailError);
        }
      }

      const updatedRequest = await Request.findById(request._id).lean();
      return res.status(200).json({ message: 'Payment verified successfully', request: updatedRequest });
    }

    return res.status(400).json({ message: 'Payment was not successful' });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: error.message || 'Failed to verify payment' });
  }
};
