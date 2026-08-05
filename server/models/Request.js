import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the request'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['submitted', 'acknowledged', 'in-progress', 'completed'],
      default: 'submitted',
    },
    photos: [String],
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completionNote: {
      type: String,
      trim: true,
      default: '',
    },
    jobCost: {
      type: Number,
      default: null,
    },
    platformFee: {
      type: Number,
      default: null,
    },
    totalAmount: {
      type: Number,
      default: null,
    },
    emojiFeedback: {
      type: String,
      enum: ['angry', 'confused', 'neutral', 'happy', 'love', null],
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid'],
      default: 'unpaid',
    },
    paymentReference: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Request = mongoose.model('Request', requestSchema);

export default Request;
