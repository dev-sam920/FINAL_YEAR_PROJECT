import jwt from 'jsonwebtoken';

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
