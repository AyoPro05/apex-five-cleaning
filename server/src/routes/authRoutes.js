/**
 * AUTHENTICATION ROUTES
 * /api/auth/*
 */

import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../../middleware/auth.js';
import {
  strictRateLimiter,
  authLoginRateLimiter,
  authRegisterRateLimiter,
} from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authRegisterRateLimiter, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLoginRateLimiter, authController.login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * @route   PATCH /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch('/me', authMiddleware, authController.updateMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public (rate limited)
 */
router.post('/forgot-password', strictRateLimiter, authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token from email
 * @access  Public (rate limited)
 */
router.post('/reset-password', strictRateLimiter, authController.resetPassword);

export default router;
