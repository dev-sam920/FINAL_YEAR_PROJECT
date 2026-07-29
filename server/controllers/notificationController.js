import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Request from '../models/Request.js';

export const createNotification = async ({ recipientId, message, type = 'status_update', relatedRequest = null }) => {
  if (!recipientId) return null;

  try {
    const recipient = await User.findById(recipientId);
    if (!recipient) return null;

    const notification = await Notification.create({
      recipient: recipientId,
      message,
      type,
      relatedRequest,
      isRead: false,
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load notifications' });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load unread count' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ notification });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update notification' });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to mark notifications as read' });
  }
};
