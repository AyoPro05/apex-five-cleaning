import express from 'express';
import jwt from 'jsonwebtoken';
import Quote from '../models/Quote.js';
import User from '../../models/User.js';
import Referral from '../../models/Referral.js';
import QuotePayment from '../../models/QuotePayment.js';
import { createObjectCsvStringifier } from 'csv-writer';
import { sendQuoteApprovedEmail } from '../utils/emailService.js';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/** Admin JWT expiry (short-lived). Same as JWT_EXPIRE if set, otherwise 1h */
const ADMIN_JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
const ADMIN_JWT_EXPIRE_SECONDS = 3600; // 1h in seconds for client

/** GDPR retention: default minimum age (months) before a customer can be deleted */
const DEFAULT_RETENTION_MONTHS = 6;

/** Allowed sort fields for users list (prevents prototype pollution / arbitrary sort) */
const USER_SORT_WHITELIST = ['createdAt', 'firstName', 'lastName', 'email', 'phone', 'role', 'lastLogin'];
/** Allowed sort fields for quotes list */
const QUOTE_SORT_WHITELIST = ['createdAt', 'reference', 'firstName', 'lastName', 'email', 'status', 'approvedAmount'];

/** Escape a string for safe use in RegExp (prevents ReDoS / injection) */
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Require valid admin JWT (short-lived). Use after exchanging static ADMIN_TOKEN via POST /api/admin/login */
const requireAdmin = [authMiddleware, adminMiddleware];

/**
 * POST /api/admin/login
 * Exchange static ADMIN_TOKEN for a short-lived JWT. Body: { token }.
 * Rate-limited to prevent brute force.
 */
router.post('/login', strictRateLimiter, (req, res) => {
  const secret = process.env.ADMIN_TOKEN;
  const { token } = req.body || {};
  if (!secret || !token || token !== secret) {
    return res.status(401).json({ success: false, error: 'Invalid admin token' });
  }
  const jwtToken = jwt.sign(
    { id: 'admin', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: ADMIN_JWT_EXPIRE }
  );
  return res.json({
    success: true,
    token: jwtToken,
    expiresIn: ADMIN_JWT_EXPIRE_SECONDS,
  });
});

// ================================
// USERS (REGISTERED CUSTOMERS)
// ================================

// Get registered users (customers) with basic search and pagination
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Math.min(parseInt(req.query.page, 10) || 1, 100));
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 20, 100));
    const search = String(req.query.search || '').trim();
    const sortBy = USER_SORT_WHITELIST.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const filter = {};

    if (search) {
      const pattern = escapeRegex(search);
      const regex = new RegExp(pattern, 'i');
      filter.$or = [
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(
          'firstName lastName email phone role isVerified createdAt lastLogin referralCode referralPoints'
        )
        .lean(),
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching users',
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a customer (GDPR). Optional query: olderThanMonths=6 (default) – only allow delete if user created at least this long ago.
 * Optional query: force=true – temporarily skip retention (for deleting test accounts; remove when enforcing GDPR).
 */
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const force = req.query.force === 'true';
    const retentionMonths = parseInt(req.query.olderThanMonths, 10) || DEFAULT_RETENTION_MONTHS;
    const userId = req.params.id;

    const user = await User.findById(userId).select('createdAt role').lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, error: 'Cannot delete an admin user' });
    }

    if (!force) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - retentionMonths);
      const createdAt = user.createdAt ? new Date(user.createdAt) : new Date(0);
      if (createdAt > cutoff) {
        return res.status(400).json({
          success: false,
          error: `GDPR retention: customer can only be deleted after ${retentionMonths} months. Account is not yet ${retentionMonths} months old.`,
        });
      }
    }

    await Referral.deleteMany({ $or: [{ referrerId: userId }, { referredUserId: userId }] });
    await User.findByIdAndDelete(userId);

    return res.json({
      success: true,
      message: force ? 'Customer deleted.' : 'Customer deleted in line with GDPR retention policy.',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Error deleting customer',
    });
  }
});

// Get all quotes with filtering, sorting, and pagination
router.get('/quotes', requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || 'new';
    const page = Math.max(1, Math.min(parseInt(req.query.page, 10) || 1, 100));
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 20, 100));
    const sortBy = QUOTE_SORT_WHITELIST.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
    const search = String(req.query.search || '').trim();
    
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      const searchUpper = search.toUpperCase();
      const pattern = escapeRegex(search);
      const regex = new RegExp(pattern, 'i');
      filter.$or = [
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
        ...(searchUpper ? [{ reference: searchUpper }] : [])
      ];
    }
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Get total count
    const total = await Quote.countDocuments(filter);
    
    const quotes = await Quote.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    return res.json({
      success: true,
      data: quotes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching quotes'
    });
  }
});

// Get single quote details
router.get('/quotes/:id', requireAdmin, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }
    
    return res.json({
      success: true,
      quote
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error fetching quote'
    });
  }
});

// Update quote status and notes
router.patch('/quotes/:id', requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes, approvedAmount } = req.body;
    
    if (status && !['new', 'contacted', 'converted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    const existingQuote = await Quote.findById(req.params.id);
    if (!existingQuote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }
    
    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (approvedAmount !== undefined) updateData.approvedAmount = Number(approvedAmount) || 0;
    
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    // When status changes to "converted", send "create your account" email
    if (status === 'converted' && existingQuote.status !== 'converted') {
      try {
        await sendQuoteApprovedEmail(
          quote.email,
          quote.firstName,
          quote.reference || quote._id.toString()
        );
      } catch (emailErr) {
        console.warn('Quote approved email failed:', emailErr.message);
      }
    }
    
    return res.json({
      success: true,
      message: 'Quote updated successfully',
      quote
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error updating quote'
    });
  }
});

// Export quotes to CSV
router.get('/export/csv', requireAdmin, async (req, res) => {
  try {
    const { status = 'all', dateFrom, dateTo } = req.query;
    
    // Build filter
    const filter = {};
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    // Fetch quotes
    const quotes = await Quote.find(filter).lean();
    
    if (quotes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No quotes found matching the criteria'
      });
    }
    
    const additionalServiceLabels = {
      'interior-fridge-freezer': 'Fridge & Freezer',
      'oven-hob-extractor': 'Oven, Hob & Extractor',
      'microwave-deep-cleaning': 'Microwave Deep Clean',
      'washing-machine-cleaning': 'Washing Machine',
      'interior-window-blind': 'Window & Blind',
      'deep-tile-grout': 'Tile & Grout',
      'skirting-board-cleaning': 'Skirting Board',
      'changing-bedsheet': 'Changing Bedsheet',
      'carpet-rug-cleaning': 'Carpet & Rug',
      'cabinet-cupboard-organization': 'Cabinet Organization',
      'sanitizing-high-touch': 'Sanitizing'
    };
    const propertyTypeLabels = { house: 'House', flat: 'Flat/Apartment', bungalow: 'Bungalow', commercial: 'Commercial', 'sharehouse-room': 'Sharehouse/Room' };
    const serviceTypeLabels = {
      residential: 'Residential Cleaning',
      'end-of-tenancy': 'End of Tenancy',
      airbnb: 'Airbnb Turnover',
      commercial: 'Commercial Cleaning'
    };
    const statusLabels = { new: 'New', contacted: 'Contacted', converted: 'Converted', rejected: 'Rejected' };

    const exportDate = new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' });
    const headerBlock = [
      'Apex Five Cleaning - Quote Export',
      `Exported: ${exportDate}`,
      `Total Records: ${quotes.length}`,
      ''
    ].join('\n');

    const csvData = quotes.map((quote, idx) => ({
      '#': idx + 1,
      'Reference': quote.reference || quote._id.toString(),
      'Quote ID': quote._id.toString(),
      'Received': new Date(quote.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      'Customer': `${(quote.firstName || '').trim()} ${(quote.lastName || '').trim()}`.trim(),
      'Email': quote.email || '',
      'Phone': quote.phone || '',
      'Property': propertyTypeLabels[quote.propertyType] || quote.propertyType,
      'Beds': quote.bedrooms,
      'Baths': quote.bathrooms,
      'Service': serviceTypeLabels[quote.serviceType] || quote.serviceType,
      'Add-ons': (quote.additionalServices || []).map(id => additionalServiceLabels[id] || id).join('; ') || '-',
      'Address': (quote.address || '').replace(/\n/g, ', ').trim(),
      'Postcode': (quote.postcode || '').trim(),
      'Status': statusLabels[quote.status] || quote.status,
      'Verification': quote.captchaScore != null ? `${Math.round((quote.captchaScore || 0) * 100)}%` : '-',
      'Photos': (quote.images || []).length,
      'Notes': (quote.adminNotes || '').replace(/\n/g, ' ').trim() || '-'
    }));

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: '#', title: '#' },
        { id: 'Reference', title: 'Reference' },
        { id: 'Quote ID', title: 'Quote ID' },
        { id: 'Received', title: 'Received' },
        { id: 'Customer', title: 'Customer' },
        { id: 'Email', title: 'Email' },
        { id: 'Phone', title: 'Phone' },
        { id: 'Property', title: 'Property' },
        { id: 'Beds', title: 'Beds' },
        { id: 'Baths', title: 'Baths' },
        { id: 'Service', title: 'Service' },
        { id: 'Add-ons', title: 'Add-ons' },
        { id: 'Address', title: 'Address' },
        { id: 'Postcode', title: 'Postcode' },
        { id: 'Status', title: 'Status' },
        { id: 'Verification', title: 'Verification' },
        { id: 'Photos', title: 'Photos' },
        { id: 'Notes', title: 'Notes' }
      ]
    });

    const csvString = headerBlock +
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(csvData);
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=quotes_export.csv');
    
    return res.send(csvString);
  } catch (error) {
    console.error('Error exporting quotes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error exporting quotes'
    });
  }
});

// Export registered users (customers) to CSV
router.get('/export/users-csv', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('firstName lastName email phone role isVerified createdAt lastLogin referralCode referralPoints')
      .lean();

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No users found to export'
      });
    }

    const exportDate = new Date().toLocaleString('en-GB', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const headerBlock = [
      'Apex Five Cleaning - Customers Export',
      `Exported: ${exportDate}`,
      `Total Records: ${users.length}`,
      '',
    ].join('\n');

    const csvData = users.map((u, idx) => ({
      '#': idx + 1,
      'First Name': u.firstName || '',
      'Last Name': u.lastName || '',
      'Email': u.email || '',
      'Phone': u.phone || '',
      'Role': u.role || 'member',
      'Verified': u.isVerified ? 'Yes' : 'No',
      'Referral Code': u.referralCode || '',
      'Referral Points': u.referralPoints ?? 0,
      'Joined': u.createdAt
        ? new Date(u.createdAt).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '',
      'Last Login': u.lastLogin
        ? new Date(u.lastLogin).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '',
    }));

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: '#', title: '#' },
        { id: 'First Name', title: 'First Name' },
        { id: 'Last Name', title: 'Last Name' },
        { id: 'Email', title: 'Email' },
        { id: 'Phone', title: 'Phone' },
        { id: 'Role', title: 'Role' },
        { id: 'Verified', title: 'Verified' },
        { id: 'Referral Code', title: 'Referral Code' },
        { id: 'Referral Points', title: 'Referral Points' },
        { id: 'Joined', title: 'Joined' },
        { id: 'Last Login', title: 'Last Login' },
      ],
    });

    const csvString =
      headerBlock +
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=customers_export.csv',
    );

    return res.send(csvString);
  } catch (error) {
    console.error('Error exporting users:', error);
    return res.status(500).json({
      success: false,
      error: 'Error exporting users',
    });
  }
});

/**
 * GET /api/admin/analytics
 * Analytics for dashboard: KPIs, revenue over time, service distribution, recent payments.
 */
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      totalBookings,
      pendingPaymentsAgg,
      completedPaymentsAgg,
      revenueByMonthAgg,
      serviceDistributionAgg,
      recentPayments,
    ] = await Promise.all([
      QuotePayment.countDocuments(),
      QuotePayment.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      QuotePayment.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      QuotePayment.aggregate([
        { $match: { status: 'succeeded', createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            income: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Quote.aggregate([
        { $match: { status: 'converted' } },
        { $group: { _id: '$serviceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      QuotePayment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('quoteId', 'firstName lastName email serviceType reference')
        .lean(),
    ]);

    const pendingPayments = pendingPaymentsAgg[0] || { count: 0, total: 0 };
    const completedPayments = completedPaymentsAgg[0] || { count: 0, total: 0 };
    const totalRevenue = completedPayments.total || 0;

    const revenueByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = { year: d.getFullYear(), month: d.getMonth() + 1 };
      const found = revenueByMonthAgg.find(
        (x) => x._id.year === key.year && x._id.month === key.month
      );
      revenueByMonth.push({
        label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        income: found ? found.income : 0,
      });
    }

    const recentBookings = recentPayments.map((p) => ({
      id: p._id,
      customer: p.quoteId
        ? `${p.quoteId.firstName || ''} ${p.quoteId.lastName || ''}`.trim() || p.email
        : p.email,
      email: p.email,
      service: p.quoteId ? p.quoteId.serviceType?.replace(/-/g, ' ') || '—' : '—',
      date: p.createdAt,
      amount: p.amount,
      amountDisplay: `£${Number(p.amount).toFixed(2)}`,
      status: p.status,
    }));

    return res.json({
      success: true,
      analytics: {
        totalBookings,
        pendingPaymentsCount: pendingPayments.count,
        pendingPaymentsTotal: pendingPayments.total,
        completedPaymentsCount: completedPayments.count,
        completedPaymentsTotal: completedPayments.total,
        totalRevenue,
        revenueByMonth,
        serviceDistribution: serviceDistributionAgg.map((s) => ({
          name: (s._id || '').replace(/-/g, ' '),
          count: s.count,
        })),
        recentBookings,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching analytics',
    });
  }
});

// Get dashboard statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const totalQuotes = await Quote.countDocuments();
    const newQuotes = await Quote.countDocuments({ status: 'new' });
    const contactedQuotes = await Quote.countDocuments({ status: 'contacted' });
    const convertedQuotes = await Quote.countDocuments({ status: 'converted' });
    const rejectedQuotes = await Quote.countDocuments({ status: 'rejected' });
    
    // Get quotes from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentQuotes = await Quote.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Get most common service type
    const serviceStats = await Quote.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    return res.json({
      success: true,
      stats: {
        totalQuotes,
        newQuotes,
        contactedQuotes,
        convertedQuotes,
        rejectedQuotes,
        recentQuotes,
        serviceStats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching statistics'
    });
  }
});

export default router;
