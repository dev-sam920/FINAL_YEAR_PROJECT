import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['client', 'admin'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const supportTicketSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'A subject is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Billing', 'Technical Issue', 'Complaint', 'General Inquiry', 'Other'],
      default: 'General Inquiry',
    },
    description: {
      type: String,
      required: [true, 'A description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Open', 'In Review', 'Resolved'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    replies: [replySchema],
  },
  {
    timestamps: true,
  }
);

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;
