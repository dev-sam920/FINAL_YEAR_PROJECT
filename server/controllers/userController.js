import User from '../models/User.js';
import { getUploadedAssetUrl } from '../config/cloudinary.js';

export const buildUserResponse = (user, req) => {
  const normalizeAssetUrl = (asset) => {
    if (!asset) return null;
    if (typeof asset === 'string' && /^(https?:)?\/\//i.test(asset)) return asset;
    if (typeof asset === 'string' && asset.startsWith('/')) {
      return `${req.protocol}://${req.get('host')}${asset}`;
    }
    return asset;
  };

  const addressValue = user.unitAddress || user.address || '';
  const profileCompletionStatus = Boolean(
    user.profileCompleted ||
    (user.fullName && user.phone && addressValue && user.state && user.lga)
  );

  return {
    _id: user._id?.toString?.() || user._id,
    id: user._id?.toString?.() || user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role || 'client',
    phone: user.phone || '',
    address: user.address || user.unitAddress || '',
    unitAddress: user.unitAddress || user.address || '',
    state: user.state || '',
    lga: user.lga || '',
    specialty: user.specialty || 'General',
    profileCompleted: profileCompletionStatus,
    isProfileComplete: profileCompletionStatus,
    passwordChanged: user.passwordChanged ?? false,
    profilePicture: normalizeAssetUrl(user.profilePicture),
  };
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, unitAddress, address, state, specialty, lga } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fullName = fullName.trim();
    user.phone = phone?.trim() || '';
    user.unitAddress = (unitAddress || address || '')?.trim() || '';
    user.address = (address || unitAddress || '')?.trim() || '';
    user.state = state?.trim() || '';
    user.lga = lga?.trim() || '';
    user.specialty = specialty?.trim() || 'General';

    const profileCompletionStatus = Boolean(
      user.fullName &&
      user.phone &&
      (user.unitAddress || user.address) &&
      user.state &&
      user.lga
    );

    user.profileCompleted = profileCompletionStatus;
    user.isProfileComplete = profileCompletionStatus;

    await user.save();

    res.status(200).json({
      user: buildUserResponse(user, req),
      message: 'Profile updated successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update profile' });
  }
};

export const changePassword = async (req, res) => {
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

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update password' });
  }
};

export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No profile picture file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profilePictureUrl = getUploadedAssetUrl(req.file, `/uploads/profile-pictures/${req.file.filename}`);
    user.profilePicture = profilePictureUrl;
    await user.save();

    res.status(200).json({
      user: buildUserResponse(user, req),
      message: 'Profile picture uploaded successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to upload profile picture' });
  }
};
