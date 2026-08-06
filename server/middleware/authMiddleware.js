import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to verify JWT and attach user to request
 * Checks for JWT token in cookies
 */
export const protect = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: 'Not authorized, no token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: error.message === 'jwt expired' ? 'Token expired' : 'Invalid token',
    });
  }
};

/**
 * Higher-order middleware to authorize specific roles
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'technician')
 * @returns {Function} - Middleware function
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authorized, no user found',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role "${req.user.role}" is not authorized to access this resource`,
      });
    }

    next();
  };
};

export const requireProfileCompletion = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user found' });
    }

    if (req.user.role !== 'client') {
      return next();
    }

    const user = await User.findById(req.user.id).select('profileCompleted fullName phone unitAddress address state lga');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addressValue = user.unitAddress || user.address || '';
    const isCompleted = typeof user.profileCompleted === 'boolean'
      ? user.profileCompleted
      : Boolean(user.fullName && user.phone && addressValue && user.state && user.lga);

    if (!isCompleted) {
      return res.status(403).json({
        message: 'Please complete your profile before continuing',
        requiresProfileCompletion: true,
      });
    }

    next();
  } catch (error) {
    console.error('Profile completion middleware error:', error);
    return res.status(500).json({ message: 'Unable to verify profile completion status' });
  }
};
