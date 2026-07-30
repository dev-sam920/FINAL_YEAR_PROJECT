import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail, welcomeEmailTemplate } from '../config/emailConfig.js';
import { getUploadedAssetUrl } from '../config/cloudinary.js';

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

  const isProduction = String(process.env.NODE_ENV).toLowerCase() === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge,
  });
};

const buildUserResponse = (user, req) => {
  const normalizeAssetUrl = (asset) => {
    if (!asset) return null;
    if (typeof asset === 'string' && /^(https?:)?\/\//i.test(asset)) return asset;
    if (typeof asset === 'string' && asset.startsWith('/')) {
      return `${req.protocol}://${req.get('host')}${asset}`;
    }
    return asset;
  };

  return {
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
    profileCompleted: user.profileCompleted ?? false,
    idDocument: normalizeAssetUrl(user.idDocument),
    yearsOfExperience: user.yearsOfExperience ?? null,
    bio: user.bio || '',
    accountStatus: user.accountStatus || 'approved',
    passwordChanged: user.passwordChanged ?? false,
    profilePicture: normalizeAssetUrl(user.profilePicture),
  };
};

/**
 * Sign up a new user
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
  try {
    const { fullName, email, password, role = 'client', specialty } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: 'Please provide fullName, email, and password',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedRole = String(role).toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists',
      });
    }

    if (normalizedRole === 'technician') {
      const user = await User.create({
        fullName: String(fullName).trim(),
        email: normalizedEmail,
        password,
        role: 'technician',
        specialty: specialty?.trim() || 'General',
        accountStatus: 'pending',
      });

      try {
        sendEmail({
          to: user.email,
          subject: 'Your SmartMaint technician application is under review',
          html: `<p>Hi ${user.fullName},</p><p>Thanks for applying to join SmartMaint as a technician. Your application is now under review by our admin team.</p><p>We will contact you once a decision has been made.</p>`,
        });
      } catch (err) {
        console.error('Unexpected error while sending technician signup email:', err?.message || err);
      }

      return res.status(201).json({
        message: 'Technician application submitted successfully. We will review it shortly.',
        user: buildUserResponse(user, req),
      });
    }

    const user = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole === 'admin' ? 'admin' : 'client',
      accountStatus: 'approved',
    });

    const token = generateToken(user._id, user.role);
    setTokenCookie(res, token);

    try {
      sendEmail({
        to: user.email,
        subject: 'Welcome to SmartMaint!',
        html: welcomeEmailTemplate(user.fullName),
      });
    } catch (err) {
      console.error('Unexpected error while sending welcome email:', err?.message || err);
    }

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

export const technicianSignup = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      state,
      lga,
      specialty,
      yearsOfExperience,
      bio,
    } = req.body;

    if (!fullName || !email || !password || !phone || !state || !lga || !specialty) {
      return res.status(400).json({
        message: 'Please provide fullName, email, password, phone, state, lga, and specialty',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists',
      });
    }

    const profilePictureFile = req.files?.profilePicture?.[0];
    const idDocumentFile = req.files?.idDocument?.[0];

    if (!profilePictureFile || !idDocumentFile) {
      return res.status(400).json({
        message: 'Please upload both your profile picture and ID document',
      });
    }

    const parsedYears = yearsOfExperience ? Number(yearsOfExperience) : null;
    if (yearsOfExperience && Number.isNaN(parsedYears)) {
      return res.status(400).json({
        message: 'Years of experience must be a number',
      });
    }

    const profilePictureUrl = getUploadedAssetUrl(profilePictureFile, `/uploads/profile-pictures/${profilePictureFile.filename}`);
    const idDocumentUrl = getUploadedAssetUrl(idDocumentFile, `/uploads/technician-documents/${idDocumentFile.filename}`);

    const user = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      password,
      phone: String(phone).trim(),
      state: String(state).trim(),
      lga: String(lga).trim(),
      specialty: String(specialty).trim(),
      yearsOfExperience: parsedYears,
      bio: String(bio || '').trim(),
      role: 'technician',
      profilePicture: profilePictureUrl,
      idDocument: idDocumentUrl,
      accountStatus: 'pending',
      profileCompleted: true,
    });

    try {
      sendEmail({
        to: user.email,
        subject: 'Your SmartMaint technician application is under review',
        html: `<p>Hi ${user.fullName},</p><p>Thanks for applying to join SmartMaint as a technician. Your application is now under review by our admin team.</p><p>We will contact you once a decision has been made.</p>`,
      });
    } catch (err) {
      console.error('Unexpected error while sending technician signup email:', err?.message || err);
    }

    return res.status(201).json({
      message: 'Application submitted! Check your email — we\'ll notify you once reviewed.',
      user: buildUserResponse(user, req),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error during technician signup',
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

    if (user.role === 'technician') {
      if (user.accountStatus === 'pending') {
        return res.status(403).json({
          message: 'Your technician application is still under review.',
        });
      }

      if (user.accountStatus === 'declined') {
        return res.status(403).json({
          message: 'Your technician application was declined. Please contact support for more information.',
        });
      }
    }

    const token = generateToken(user._id, user.role);
    setTokenCookie(res, token);

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
