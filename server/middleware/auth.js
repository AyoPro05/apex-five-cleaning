/**
 * AUTHENTICATION MIDDLEWARE
 * Protects routes and verifies JWT tokens
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Verify JWT token, load user, and enforce verification
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');
    const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Please provide an authentication token'
      });
    }

    // Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Your token is invalid or malformed'
      });
    }

    // Load user to enforce current status (role, isVerified, etc.)
    const user = await User.findById(userId).select('role isVerified');

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'The account associated with this token no longer exists'
      });
    }

    // Enforce email verification for non-admin users on every authenticated request
    if (!user.isVerified && user.role !== 'admin') {
      return res.status(401).json({
        error: 'Email not verified',
        message: 'Please verify your email address before accessing your account. Check your inbox for a verification link or use "Resend verification email".'
      });
    }

    // Attach up-to-date user info to the request
    req.user = {
      ...decoded,
      id: userId,
      role: user.role,
      isVerified: user.isVerified,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    }
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Your token is invalid or malformed'
    });
  }
};

/**
 * Verify user is admin
 */
export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to access this resource'
    });
  }

  req.isAdmin = true; // for rate limiter skip
  next();
};

/**
 * Verify user owns the resource
 */
export const ownershipMiddleware = (paramName = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceUserId = req.params[paramName];

    // Admins can access any user's data
    if (req.user.role === 'admin') {
      return next();
    }

    // Regular users can only access their own data
    if (req.user.id !== resourceUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own data'
      });
    }

    next();
  };
};

/**
 * Error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Your token is invalid or malformed'
    });
  }

  // Validation errors
  if (err.status === 400) {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message,
      details: err.details || []
    });
  }

  // Not found
  if (err.status === 404) {
    return res.status(404).json({
      error: 'Not found',
      message: err.message
    });
  }

  // Server error
  return res.status(500).json({
    success: false,
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};
