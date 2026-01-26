/**
 * AUTHENTICATION CONTROLLER
 * Handles user registration, login, and token management
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

/**
 * USER REGISTRATION
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, passwordConfirm } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !password || !passwordConfirm) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Please provide all required fields'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Passwords do not match'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Password must be at least 8 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered',
        message: 'An account with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      phone: phone.replace(/\D/g, ''),
      password,
      role: 'member',
      isVerified: false // Email verification would happen here
    });

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      tokens: {
        accessToken: token,
        refreshToken: refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '1h'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
};

/**
 * USER LOGIN
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Please provide email and password'
      });
    }

    // Find user and select password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      return res.status(401).json({
        error: 'Account locked',
        message: 'Too many failed login attempts. Please try again later.'
      });
    }

    // Verify password
    const passwordMatch = await user.matchPassword(password);
    if (!passwordMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRE || '1h');
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn }
    );
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Remove sensitive fields from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'Login successful',
      user: userResponse,
      tokens: {
        accessToken: token,
        refreshToken: refreshToken,
        expiresIn
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
};

/**
 * REFRESH TOKEN
 * POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User associated with token no longer exists'
      });
    }

    // Generate new access token
    const newToken = generateToken(user._id, user.role);

    res.status(200).json({
      message: 'Token refreshed',
      tokens: {
        accessToken: newToken,
        expiresIn: process.env.JWT_EXPIRE || '1h'
      }
    });
  } catch (error) {
    res.status(401).json({
      error: 'Token refresh failed',
      message: 'Invalid or expired refresh token'
    });
  }
};

/**
 * LOGOUT
 * POST /api/auth/logout
 */
exports.logout = (req, res) => {
  // In a real app, you would:
  // 1. Add token to a blacklist
  // 2. Clear any server-side sessions
  // For now, we'll just send success response
  // Client should delete tokens from localStorage

  res.status(200).json({
    message: 'Logout successful',
    info: 'Token has been invalidated. Please delete it from client.'
  });
};

module.exports = exports;
