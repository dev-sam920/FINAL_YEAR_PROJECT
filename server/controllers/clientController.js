import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Change password for authenticated client
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to change password' });
  }
};

// Soft-delete account after confirming password
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required to confirm deletion' });

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Password is incorrect' });

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    // Clear auth cookie
    res.clearCookie('token');

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete account' });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req, res) => {
  try {
    const { emailNotifications, inAppNotifications } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (typeof emailNotifications === 'boolean') user.emailNotifications = emailNotifications;
    if (typeof inAppNotifications === 'boolean') user.inAppNotifications = inAppNotifications;

    await user.save();

    res.status(200).json({ message: 'Notification preferences updated', user: { emailNotifications: user.emailNotifications, inAppNotifications: user.inAppNotifications } });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update preferences' });
  }
};
