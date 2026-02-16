/**
 * CUSTOMER DASHBOARD ROUTES
 * All routes require auth - users can only access their own data
 * GDPR: No sensitive data in logs, authorization checks on every request
 */

import express from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../../middleware/auth.js';
import User from '../../models/User.js';
import Booking from '../../models/Booking.js';
import Payment from '../../models/Payment.js';
import Quote from '../models/Quote.js';
import Referral from '../../models/Referral.js';
import Address from '../../models/Address.js';

const router = express.Router();

router.use(authMiddleware);

const POINTS_PER_REFERRAL = 5;
const POINTS_FOR_10_PERCENT = 20;

/**
 * GET /api/customer/dashboard
 * Overview stats for customer dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const oid = new mongoose.Types.ObjectId(userId);
    const [bookingsCount, paymentsCount, totalResult, referrals, addressCount] = await Promise.all([
      Booking.countDocuments({ userId }),
      Payment.countDocuments({ userId, status: 'succeeded' }),
      Payment.aggregate([
        { $match: { userId: oid, status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Referral.countDocuments({ referrerId: userId, status: 'completed' }),
      Address.countDocuments({ userId }),
    ]);

    const user = await User.findById(userId)
      .select('referralPoints referralCode firstName')
      .lean();

    const totalSpent = totalResult[0]?.total || 0;

    res.json({
      success: true,
      dashboard: {
        bookingsCount,
        paymentsCount,
        totalSpent,
        referralsCompleted: referrals,
        referralPoints: user?.referralPoints || 0,
        referralCode: user?.referralCode,
        discountPercent: Math.floor(((user?.referralPoints || 0) / POINTS_FOR_10_PERCENT) * 10),
        savedAddressesCount: addressCount,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to load dashboard' });
  }
});

/**
 * GET /api/customer/referral
 * Referral code, link, points, and history
 */
router.get('/referral', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('referralCode referralPoints').lean();
    const referrals = await Referral.find({ referrerId: userId })
      .sort({ createdAt: -1 })
      .lean();

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const referralLink = `${baseUrl}/request-a-quote?ref=${user?.referralCode || ''}`;

    res.json({
      success: true,
      referral: {
        code: user?.referralCode,
        points: user?.referralPoints || 0,
        pointsPerReferral: POINTS_PER_REFERRAL,
        pointsFor10Percent: POINTS_FOR_10_PERCENT,
        discountPercent: Math.floor(((user?.referralPoints || 0) / POINTS_FOR_10_PERCENT) * 10),
        link: referralLink,
        referrals,
      },
    });
  } catch (error) {
    console.error('Referral error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to load referral info' });
  }
});

/**
 * CRUD Saved Addresses
 */
router.get('/addresses', async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1 }).lean();
    res.json({ success: true, addresses });
  } catch (error) {
    console.error('Addresses list error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to load addresses' });
  }
});

router.post('/addresses', async (req, res) => {
  try {
    const { label, street, city, postCode, country, isDefault } = req.body;
    if (!street || !city || !postCode) {
      return res.status(400).json({ success: false, error: 'Street, city, and postcode are required' });
    }
    if (isDefault) {
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }
    const address = await Address.create({
      userId: req.user.id,
      label: label || 'Home',
      street: street.trim(),
      city: city.trim(),
      postCode: postCode.trim().toUpperCase(),
      country: country || 'UK',
      isDefault: isDefault || false,
    });
    res.status(201).json({ success: true, address });
  } catch (error) {
    console.error('Address create error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to add address' });
  }
});

router.patch('/addresses/:id', async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }
    const { label, street, city, postCode, country, isDefault } = req.body;
    if (street) address.street = street.trim();
    if (city) address.city = city.trim();
    if (postCode) address.postCode = postCode.trim().toUpperCase();
    if (country) address.country = country.trim();
    if (label !== undefined) address.label = label;
    if (isDefault) {
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
      address.isDefault = true;
    }
    address.updatedAt = new Date();
    await address.save();
    res.json({ success: true, address });
  } catch (error) {
    console.error('Address update error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update address' });
  }
});

router.delete('/addresses/:id', async (req, res) => {
  try {
    const result = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    console.error('Address delete error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to delete address' });
  }
});

/**
 * PATCH /api/customer/preferences
 * Notification preferences
 */
router.patch('/preferences', async (req, res) => {
  try {
    const { notificationsEnabled, emailNotifications } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;
    if (emailNotifications && typeof emailNotifications === 'object') {
      user.emailNotifications = { ...user.emailNotifications, ...emailNotifications };
    }
    await user.save();
    const sanitized = user.toObject();
    delete sanitized.password;
    res.json({ success: true, user: sanitized });
  } catch (error) {
    console.error('Preferences error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
});

/**
 * GET /api/customer/quotes
 * User's quote requests (by email match for now - Quote has no userId)
 */
router.get('/quotes', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email').lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const quotes = await Quote.find({ email: user.email })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, quotes });
  } catch (error) {
    console.error('Quotes error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to load quotes' });
  }
});

export default router;
