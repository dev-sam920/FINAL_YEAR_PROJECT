import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail, welcomeEmailTemplate } from '../config/emailConfig.js';

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} - JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Set JWT in httpOnly cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 */
const setTokenCookie = (res, token) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  // Convert expiry to milliseconds (simple conversion for common formats)
  let maxAge = 7 * 24 * 60 * 60 * 1000; // Default 7 days in ms
  
  if (expiresIn.endsWith('d')) {
    maxAge = parseInt(expiresIn) * 24 * 60 * 60 * 1000;
  } else if (expiresIn.endsWith('h')) {
    maxAge = parseInt(expiresIn) * 60 * 60 * 1000;
  }

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge,
  });
};

const buildUserResponse = (user, req) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  address: user.address || user.unitAddress || '',
  unitAddress: user.unitAddress || user.address || '',
  state: user.state || '',
  lga: user.lga || '',
  specialty: user.specialty || 'General',
  passwordChanged: user.passwordChanged ?? false,
  profilePicture: user.profilePicture
    ? `${req.protocol}://${req.get('host')}${user.profilePicture}`
    : null,
});

/**
 * Sign up a new user
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate all fields are present
    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: 'Please provide fullName, email, and password',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists',
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password,
    });

    // Generate JWT
    const token = generateToken(user._id, user.role);

    // Set cookie
    setTokenCookie(res, token);

    // Fire-and-forget welcome email (do not block signup response)
    try {
      sendEmail({
        to: user.email,
        subject: 'Welcome to SmartMaint!',
        html: welcomeEmailTemplate(user.fullName),
      });
    } catch (err) {
      // sendEmail internally logs errors; ensure any unexpected error doesn't affect signup
      console.error('Unexpected error while sending welcome email:', err?.message || err);
    }

    // Return user data (exclude password)
    res.status(201).json({
      message: 'User created successfully',
      user: buildUserResponse(user, req),
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error during signup',
    });
  }
};

/**
 * Login a user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password',
      });
    }

    // Find user by email (include password field for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    // Generate JWT
    const token = generateToken(user._id, user.role);

    // Set cookie
    setTokenCookie(res, token);

    // Return user data (exclude password)
    res.status(200).json({
      message: 'Login successful',
      user: buildUserResponse(user, req),
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error during login',
    });
  }
};

/**
 * Logout a user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    res.clearCookie('token');

    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error during logout',
    });
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 * Protected route - requires valid JWT
 */
export const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authorized to access this route',
      });
    }

    // Fetch full user from database (exclude password)
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.status(200).json({
      user: buildUserResponse(user, req),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error fetching user',
    });
  }
};
