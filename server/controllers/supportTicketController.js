import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';
import { sendEmail } from '../config/emailConfig.js';

const statusBadgeMessages = {
  Open: 'Your support ticket is now open and awaiting review.',
  'In Review': 'Your support ticket is currently under review by an admin.',
  Resolved: 'Your support ticket has been resolved. Thank you for reaching out.',
};

export const createSupportTicket = async (req, res) => {
  try {
    const { subject, category, description, priority = 'Medium' } = req.body;

    if (!subject || !category || !description) {
      return res.status(400).json({ message: 'Subject, category, and description are required.' });
    }

    const ticket = await SupportTicket.create({
      client: req.user.id,
      subject: String(subject).trim(),
      category: String(category).trim(),
      description: String(description).trim(),
      priority: String(priority).trim() || 'Medium',
      replies: [],
    });

    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111111;">
        <h2 style="color: #111111;">New Support Ticket</h2>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Category:</strong> ${ticket.category}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Description:</strong></p>
        <p style="white-space: pre-wrap;">${ticket.description}</p>
      </div>
    `;

    try {
      await sendEmail({
        to: supportEmail,
        subject: `New SmartMaint Support Ticket - ${ticket.category}`,
        html,
      });
    } catch (error) {
      console.error('Failed to send support ticket email:', error?.message || error);
    }

    await ticket.populate('client', 'fullName email');
    res.status(201).json({ message: 'Support ticket submitted successfully.', ticket });
  } catch (error) {
    console.error('Failed to create support ticket:', error);
    res.status(500).json({ message: 'Unable to submit support ticket at this time.' });
  }
};

export const getMySupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ client: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({ tickets });
  } catch (error) {
    console.error('Failed to load client tickets:', error);
    res.status(500).json({ message: 'Unable to load support tickets.' });
  }
};

export const getSupportTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id)
      .populate('client', 'fullName email')
      .populate('replies.sender', 'fullName email role')
      .lean();

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found.' });
    }

    if (req.user.role !== 'admin' && String(ticket.client._id) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this ticket.' });
    }

    res.status(200).json({ ticket });
  } catch (error) {
    console.error('Failed to load support ticket:', error);
    res.status(500).json({ message: 'Unable to load support ticket.' });
  }
};

export const replyToSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Reply message is required.' });
    }

    const ticket = await SupportTicket.findById(id)
      .populate('client', 'fullName email')
      .populate('replies.sender', 'fullName email role');

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found.' });
    }

    if (req.user.role !== 'admin') {
      if (String(ticket.client._id || ticket.client) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to reply to this ticket.' });
      }
      if (ticket.status === 'Resolved') {
        return res.status(400).json({ message: 'Resolved tickets cannot be replied to.' });
      }
    }

    const senderRole = req.user.role === 'admin' ? 'admin' : 'client';

    ticket.replies.push({
      sender: req.user.id,
      senderRole,
      message: String(message).trim(),
    });

    ticket.updatedAt = new Date();
    await ticket.save();
    await ticket.populate('replies.sender', 'fullName email role');

    const sendTo = req.user.role === 'admin' ? ticket.client.email : process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
    const subject = req.user.role === 'admin'
      ? `Update on your SmartMaint support ticket: ${ticket.subject}`
      : `Client reply on ticket: ${ticket.subject}`;

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111111;">
        <h2 style="color: #111111;">Support Ticket Reply</h2>
        <p><strong>Ticket:</strong> ${ticket.subject}</p>
        <p><strong>From:</strong> ${req.user.role === 'admin' ? 'Admin Team' : ticket.client.fullName}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    `;

    try {
      await sendEmail({
        to: sendTo,
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send support ticket reply email:', error?.message || error);
    }

    res.status(200).json({ message: 'Reply added to ticket.', ticket });
  } catch (error) {
    console.error('Failed to add support ticket reply:', error);
    res.status(500).json({ message: 'Unable to add reply to the ticket.' });
  }
};

export const updateSupportTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Open', 'In Review', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const ticket = await SupportTicket.findById(id).populate('client', 'fullName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found.' });
    }

    ticket.status = status;
    ticket.updatedAt = new Date();
    await ticket.save();

    try {
      await sendEmail({
        to: ticket.client.email,
        subject: `Support Ticket Status Updated: ${ticket.subject}`,
        html: `
          <div style="font-family: Arial, Helvetica, sans-serif; color: #111111;">
            <h2 style="color: #111111;">Support Ticket Update</h2>
            <p>Your support ticket <strong>${ticket.subject}</strong> has been updated to <strong>${ticket.status}</strong>.</p>
            <p>${statusBadgeMessages[ticket.status] || ''}</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send status update email:', error?.message || error);
    }

    res.status(200).json({ message: 'Support ticket status updated.', ticket });
  } catch (error) {
    console.error('Failed to update support ticket status:', error);
    res.status(500).json({ message: 'Unable to update ticket status.' });
  }
};

export const getAllSupportTicketsAdmin = async (req, res) => {
  try {
    const { status, category, priority, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    let tickets = await SupportTicket.find(filter)
      .populate('client', 'fullName email')
      .sort({ updatedAt: -1 })
      .lean();

    if (search) {
      const regex = new RegExp(search, 'i');
      tickets = tickets.filter((ticket) => {
        if (regex.test(ticket.subject || '')) return true;
        if (regex.test(ticket.description || '')) return true;
        if (ticket.client && regex.test(ticket.client.fullName || '')) return true;
        return false;
      });
    }

    res.status(200).json({ tickets });
  } catch (error) {
    console.error('Failed to fetch admin support tickets:', error);
    res.status(500).json({ message: 'Unable to fetch support tickets.' });
  }
};
