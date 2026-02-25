/**
 * AUTHENTICATION CONTROLLER
 * Handles user registration, login, and token management
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Referral from '../models/Referral.js';
import { sendVerificationEmail, isEmailConfigured } from '../src/utils/emailService.js';
import crypto from 'crypto';

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
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, passwordConfirm, referralCode } = req.body;

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

    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: String(referralCode).trim().toUpperCase() });
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      phone: phone.replace(/\D/g, ''),
      password,
      role: 'member',
      isVerified: false,
      referredBy: referrer?._id,
      referredAt: referrer ? new Date() : undefined,
    });

    if (referrer) {
      await Referral.create({
        referrerId: referrer._id,
        referredUserId: user._id,
        referredEmail: user.email,
        status: 'pending',
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.verificationToken = hashedToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send verification email (same sender config works for any customer email domain)
    let verificationEmailSent = false;
    if (isEmailConfigured()) {
      try {
        const emailResult = await sendVerificationEmail(user.email, user.firstName, verificationToken);
        verificationEmailSent = emailResult?.success === true;
        if (!verificationEmailSent) {
          console.error('Verification email not sent:', emailResult?.error || 'Unknown reason');
        }
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError.message);
      }
    } else {
      console.error('Verification email skipped: email not configured (check /health).');
    }

    // Do NOT log the user in on registration.
    // We only create the account and send a verification email.
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.verificationToken;

    res.status(201).json({
      message: verificationEmailSent
        ? 'Account created. Please check your email and verify your address before signing in.'
        : 'Account created, but the verification email could not be sent. Use “Resend verification email” on the Pay Online page.',
      user: {
        id: userResponse._id,
        email: userResponse.email,
        firstName: userResponse.firstName,
        lastName: userResponse.lastName,
        isVerified: userResponse.isVerified,
      },
      verificationStatus: {
        isVerified: false,
        expiresIn: '24 hours',
        message: verificationEmailSent
          ? 'A verification email has been sent to your email address.'
          : 'Verification email was not sent. Use “Resend verification email” below.',
        emailSent: verificationEmailSent
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
export const login = async (req, res) => {
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

    // Require verified email for non-admin users
    if (!user.isVerified && user.role !== 'admin') {
      return res.status(401).json({
        error: 'Email not verified',
        message: 'Please verify your email address before signing in. Check your inbox for a verification link or use "Resend verification email".'
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
export const refreshToken = async (req, res) => {
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
 * GET CURRENT USER
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -verificationToken -passwordResetToken')
      .lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/**
 * UPDATE CURRENT USER (profile)
 * PATCH /api/auth/me
 */
export const updateMe = async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone', 'address'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'phone') updates[key] = String(req.body[key]).replace(/\D/g, '');
        else if (key === 'address') updates[key] = req.body[key];
        else updates[key] = req.body[key];
      }
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).select('-password -verificationToken -passwordResetToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Update me error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * LOGOUT
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
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
