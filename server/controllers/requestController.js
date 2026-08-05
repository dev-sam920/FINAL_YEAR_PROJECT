import Request from '../models/Request.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

const ALLOWED_EMOJI_FEEDBACK = ['angry', 'confused', 'neutral', 'happy', 'love'];

/**
 * Create a new client maintenance request
 * POST /api/requests
 */
export const createRequest = async (req, res) => {
  try {
    const { title, category, priority, description, location, photos } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({
        message: 'Please provide title, category, and description',
      });
    }

    const request = await Request.create({
      client: req.user.id,
      title,
      category,
      priority: priority || 'Medium',
      description,
      location: location || '',
      photos: Array.isArray(photos) ? photos : [],
    });

    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(
      admins.map((admin) => createNotification({
        recipientId: admin._id,
        message: `New request submitted: ${title}`,
        type: 'new_request',
        relatedRequest: request._id,
      }))
    );

    res.status(201).json({ request });
  } catch (error) {
    if (error.name === 'ValidationError') {
      console.error('❌ Request validation error:', error);
      return res.status(400).json({
        message: 'Something went wrong while saving your request. Please try again.',
      });
    }

    res.status(500).json({
      message: error.message || 'Failed to create request',
    });
  }
};

/**
 * Get requests belonging to the authenticated client
 * GET /api/requests/my-requests
 */
export const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ client: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to load requests',
    });
  }
};

/**
 * Update rating for a completed request owned by the authenticated client
 * PATCH /api/requests/:id/rating
 */
export const rateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Rating must be a number between 1 and 5',
      });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({
        message: 'Request not found',
      });
    }

    if (request.client.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'You are not authorized to rate this request',
      });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({
        message: 'Only completed requests can be rated',
      });
    }

    request.rating = rating;
    await request.save();

    res.status(200).json({ request });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to update request rating',
    });
  }
};

export const setEmojiFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { emojiFeedback } = req.body;

    if (!emojiFeedback || !ALLOWED_EMOJI_FEEDBACK.includes(emojiFeedback)) {
      return res.status(400).json({
        message: 'emojiFeedback must be one of: angry, confused, neutral, happy, love',
      });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({
        message: 'Request not found',
      });
    }

    if (request.client.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'You are not authorized to update emoji feedback for this request',
      });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({
        message: 'Emoji feedback can only be submitted for completed requests',
      });
    }

    request.emojiFeedback = emojiFeedback;
    await request.save();

    res.status(200).json({ request });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to update emoji feedback',
    });
  }
};
