/**
 * EMAIL VERIFICATION ROUTES
 * /api/auth/verify-email/*
 */

import express from 'express';
import crypto from 'crypto';
import User from '../../models/User.js';
import { sendVerificationEmail, sendVerificationSuccessEmail, sendResendVerificationEmail } from '../utils/emailService.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/send-verification-email
 * @desc    Send verification email to user
 * @access  Private (authenticated users only)
 */
router.post('/send-verification-email', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The user account could not be found.'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Already verified',
        message: 'Your email is already verified.'
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Set token and expiry
    user.verificationToken = hashedToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.save();

    // Send email
    const emailResult = await sendVerificationEmail(user.email, user.firstName, verificationToken);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Email send failed',
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      data: {
        email: user.email,
        expiresIn: '24 hours'
      }
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/verify-email-token
 * @desc    Verify email with token (called from frontend)
 * @access  Public
 */
router.post('/verify-email-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Missing token',
        message: 'Verification token is required.'
      });
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with token
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'The verification link is invalid or has expired. Please request a new one.'
      });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;

    await user.save();

    // Send success email
    await sendVerificationSuccessEmail(user.email, user.firstName);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/resend-verification-email
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Missing email',
        message: 'Email address is required.'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Already verified',
        message: 'This email is already verified.'
      });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.verificationToken = hashedToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.save();

    // Send email
    const emailResult = await sendResendVerificationEmail(user.email, user.firstName, verificationToken);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Email send failed',
        message: 'Failed to send verification email.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a verification link has been sent.'
    });
  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/auth/verify-status
 * @desc    Check email verification status
 * @access  Private
 */
router.get('/verify-status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isVerified: user.isVerified,
        email: user.email,
        verifiedAt: user.verifiedAt
      }
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

export default router;
