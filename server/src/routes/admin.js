import express from 'express';
import jwt from 'jsonwebtoken';
import Quote from '../models/Quote.js';
import User from '../../models/User.js';
import Referral from '../../models/Referral.js';
import QuotePayment from '../../models/QuotePayment.js';
import Staff from '../../models/Staff.js';
import StaffShift from '../../models/StaffShift.js';
import { createObjectCsvStringifier } from 'csv-writer';
import { sendQuoteApprovedEmail, sendTestEmail, isEmailConfigured } from '../utils/emailService.js';
import { sanitizeQuoteImagesForApi, resolveQuoteImageBuffer } from '../utils/quoteImages.js';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/** Admin JWT expiry (short-lived). Same as JWT_EXPIRE if set, otherwise 1h */
const ADMIN_JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
const ADMIN_JWT_EXPIRE_SECONDS = 3600; // 1h in seconds for client

/** GDPR retention: default minimum age (months) before a customer can be deleted */
const DEFAULT_RETENTION_MONTHS = 6;
/** Quote soft-delete retention window */
const QUOTE_RETENTION_DAYS = 30;

/** Allowed sort fields for users list (prevents prototype pollution / arbitrary sort) */
const USER_SORT_WHITELIST = ['createdAt', 'firstName', 'lastName', 'email', 'phone', 'role', 'lastLogin'];
/** Allowed sort fields for quotes list */
const QUOTE_SORT_WHITELIST = ['createdAt', 'reference', 'firstName', 'lastName', 'email', 'status', 'approvedAmount'];
const STAFF_SORT_WHITELIST = ['createdAt', 'firstName', 'lastName', 'role', 'status', 'hourlyRate'];
const STAFF_ROLES = ['cleaner', 'supervisor', 'admin'];
const STAFF_EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contractor'];
const STAFF_STATUSES = ['active', 'inactive', 'suspended'];
const SHIFT_STATUSES = ['scheduled', 'completed', 'approved', 'paid', 'cancelled'];

/** Escape a string for safe use in RegExp (prevents ReDoS / injection) */
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseMoney(value, fallback = 0) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return fallback;
  return Math.round(amount * 100) / 100;
}

function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
}

function minutesFromTime(value) {
  const [hours, minutes] = String(value).split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateShiftHours(startTime, endTime, breakMinutes = 0) {
  if (!isValidTime(startTime) || !isValidTime(endTime)) return null;
  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);
  const breakMins = Math.max(0, Number(breakMinutes) || 0);
  const workedMinutes = end - start - breakMins;
  if (workedMinutes <= 0) return null;
  return Math.round((workedMinutes / 60) * 100) / 100;
}

function getDateRange(query = {}) {
  const now = new Date();
  const from = parseDateOnly(query.from) || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const toBase = parseDateOnly(query.to) || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const to = new Date(toBase);
  to.setUTCHours(23, 59, 59, 999);
  return { from, to };
}

function normalizeStaffPayload(body = {}, existing = {}) {
  const firstName = String(body.firstName ?? existing.firstName ?? '').trim();
  const lastName = String(body.lastName ?? existing.lastName ?? '').trim();
  const phone = String(body.phone ?? existing.phone ?? '').trim();
  const email = String(body.email ?? existing.email ?? '').trim().toLowerCase();
  const role = STAFF_ROLES.includes(body.role) ? body.role : existing.role || 'cleaner';
  const employmentType = STAFF_EMPLOYMENT_TYPES.includes(body.employmentType)
    ? body.employmentType
    : existing.employmentType || 'part-time';
  const status = STAFF_STATUSES.includes(body.status) ? body.status : existing.status || 'active';
  const hourlyRate = parseMoney(body.hourlyRate ?? existing.hourlyRate, existing.hourlyRate ?? 0);
  const serviceAreas = Array.isArray(body.serviceAreas)
    ? body.serviceAreas.map((area) => String(area).trim()).filter(Boolean).slice(0, 20)
    : existing.serviceAreas || [];
  const availability = Array.isArray(body.availability)
    ? body.availability
        .filter((slot) => slot && slot.day)
        .map((slot) => ({
          day: String(slot.day).toLowerCase(),
          startTime: String(slot.startTime || '').trim(),
          endTime: String(slot.endTime || '').trim(),
        }))
        .slice(0, 14)
    : existing.availability || [];

  return {
    firstName,
    lastName,
    email: email || undefined,
    phone,
    role,
    employmentType,
    hourlyRate,
    serviceAreas,
    availability,
    emergencyContactName: String(body.emergencyContactName ?? existing.emergencyContactName ?? '').trim(),
    emergencyContactPhone: String(body.emergencyContactPhone ?? existing.emergencyContactPhone ?? '').trim(),
    status,
    notes: String(body.notes ?? existing.notes ?? '').trim(),
  };
}

/** Require valid admin JWT (short-lived). Use after exchanging static ADMIN_TOKEN via POST /api/admin/login */
const requireAdmin = [authMiddleware, adminMiddleware];

async function purgeExpiredDeletedQuotes() {
  const cutoff = new Date(Date.now() - QUOTE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await Quote.deleteMany({
    isDeleted: true,
    deletedAt: { $lte: cutoff },
  });
}

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
    await purgeExpiredDeletedQuotes();
    const status = req.query.status || 'new';
    const page = Math.max(1, Math.min(parseInt(req.query.page, 10) || 1, 100));
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 20, 100));
    const sortBy = QUOTE_SORT_WHITELIST.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
    const search = String(req.query.search || '').trim();
    
    const filter = { isDeleted: { $ne: true } };
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
    
    const safeQuotes = quotes.map((quote) => sanitizeQuoteImagesForApi(quote));

    return res.json({
      success: true,
      data: safeQuotes,
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

// Serve quote property image (admin auth — used by dashboard blob fetch)
router.get('/quotes/:id/images/:index', requireAdmin, async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    }).select('images');

    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    const index = parseInt(req.params.index, 10);
    const image = quote.images?.[index];
    if (!image) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    const resolved = resolveQuoteImageBuffer(image);
    if (!resolved?.buffer) {
      return res.status(404).json({ success: false, error: 'Image file not available' });
    }

    res.setHeader('Content-Type', resolved.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.send(resolved.buffer);
  } catch (error) {
    console.error('Error serving quote image:', error);
    return res.status(500).json({ success: false, error: 'Failed to load image' });
  }
});

// Get single quote details
router.get('/quotes/:id', requireAdmin, async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }
    
    return res.json({
      success: true,
      quote: sanitizeQuoteImagesForApi(quote),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error fetching quote'
    });
  }
});

// Send test email (verify IONOS / SMTP from production)
router.post('/test-email', requireAdmin, strictRateLimiter, async (req, res) => {
  try {
    const { to } = req.body;
    const target = to || process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
    if (!target) {
      return res.status(400).json({ success: false, error: 'Provide `to` or set NOTIFY_EMAIL on the server' });
    }

    if (!isEmailConfigured()) {
      return res.status(503).json({ success: false, error: 'Email not configured on server' });
    }

    const result = await sendTestEmail(target);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || 'Test email failed' });
    }

    return res.json({ success: true, message: `Test email sent to ${target}` });
  } catch (error) {
    console.error('Test email failed:', error);
    return res.status(500).json({ success: false, error: error.message || 'Test email failed' });
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
    
    const existingQuote = await Quote.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });
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
    
    const quote = await Quote.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
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

/**
 * DELETE /api/admin/quotes/:id
 * Soft-delete quote and retain for 30 days before purge.
 */
router.delete('/quotes/:id', requireAdmin, async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found',
      });
    }

    quote.isDeleted = true;
    quote.deletedAt = new Date();
    quote.deletedBy = req.user?.id || 'admin';
    await quote.save();

    return res.json({
      success: true,
      message: `Quote deleted. It will be permanently removed after ${QUOTE_RETENTION_DAYS} days.`,
    });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return res.status(500).json({
      success: false,
      error: 'Error deleting quote',
    });
  }
});

// Export quotes to CSV
router.get('/export/csv', requireAdmin, async (req, res) => {
  try {
    const { status = 'all', dateFrom, dateTo } = req.query;
    
    // Build filter
    const filter = { isDeleted: { $ne: true } };
    
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

// ================================
// STAFF, SHIFTS, PAYROLL
// ================================

router.get('/staff', requireAdmin, async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const status = STAFF_STATUSES.includes(req.query.status) ? req.query.status : 'all';
    const sortBy = STAFF_SORT_WHITELIST.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const filter = {};

    if (status !== 'all') filter.status = status;
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
        { serviceAreas: { $regex: regex } },
      ];
    }

    const staff = await Staff.find(filter).sort({ [sortBy]: sortOrder }).lean({ virtuals: true });
    return res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return res.status(500).json({ success: false, error: 'Error fetching staff' });
  }
});

router.post('/staff', requireAdmin, async (req, res) => {
  try {
    const payload = normalizeStaffPayload(req.body);
    if (!payload.firstName || !payload.lastName || !payload.phone) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and phone are required',
      });
    }
    const staff = await Staff.create(payload);
    return res.status(201).json({ success: true, staff });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'A staff member with this email already exists' });
    }
    console.error('Error creating staff:', error);
    return res.status(500).json({ success: false, error: 'Error creating staff member' });
  }
});

router.patch('/staff/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await Staff.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }
    const payload = normalizeStaffPayload(req.body, existing.toObject());
    if (!payload.firstName || !payload.lastName || !payload.phone) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and phone are required',
      });
    }
    Object.assign(existing, payload);
    await existing.save();
    return res.json({ success: true, staff: existing });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'A staff member with this email already exists' });
    }
    console.error('Error updating staff:', error);
    return res.status(500).json({ success: false, error: 'Error updating staff member' });
  }
});

router.get('/staff/shifts', requireAdmin, async (req, res) => {
  try {
    const { from, to } = getDateRange(req.query);
    const filter = { date: { $gte: from, $lte: to } };
    if (req.query.staffId) filter.staffId = req.query.staffId;
    if (SHIFT_STATUSES.includes(req.query.status)) filter.status = req.query.status;

    const shifts = await StaffShift.find(filter)
      .sort({ date: -1, startTime: -1 })
      .populate('staffId', 'firstName lastName role hourlyRate status')
      .populate('quoteId', 'reference firstName lastName serviceType address postcode approvedAmount')
      .lean();

    return res.json({ success: true, data: shifts });
  } catch (error) {
    console.error('Error fetching staff shifts:', error);
    return res.status(500).json({ success: false, error: 'Error fetching shifts' });
  }
});

router.post('/staff/shifts', requireAdmin, async (req, res) => {
  try {
    const staff = await Staff.findById(req.body.staffId).lean();
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }
    if (staff.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Only active staff can be assigned shifts' });
    }

    const date = parseDateOnly(req.body.date);
    const startTime = String(req.body.startTime || '').trim();
    const endTime = String(req.body.endTime || '').trim();
    const breakMinutes = Math.max(0, Number(req.body.breakMinutes) || 0);
    const hoursWorked = calculateShiftHours(startTime, endTime, breakMinutes);
    const status = SHIFT_STATUSES.includes(req.body.status) ? req.body.status : 'scheduled';
    const hourlyRateSnapshot = parseMoney(req.body.hourlyRateSnapshot, staff.hourlyRate || 0);

    if (!date || !hoursWorked) {
      return res.status(400).json({
        success: false,
        error: 'Valid date, start time, end time, and break duration are required',
      });
    }

    const shift = await StaffShift.create({
      staffId: staff._id,
      quoteId: req.body.quoteId || undefined,
      date,
      startTime,
      endTime,
      breakMinutes,
      hoursWorked,
      hourlyRateSnapshot,
      payAmount: Math.round(hoursWorked * hourlyRateSnapshot * 100) / 100,
      location: String(req.body.location || '').trim(),
      notes: String(req.body.notes || '').trim(),
      status,
      approvedAt: ['approved', 'paid'].includes(status) ? new Date() : undefined,
      paidAt: status === 'paid' ? new Date() : undefined,
      createdBy: req.user?.id || 'admin',
      updatedBy: req.user?.id || 'admin',
    });

    return res.status(201).json({ success: true, shift });
  } catch (error) {
    console.error('Error creating staff shift:', error);
    return res.status(500).json({ success: false, error: 'Error creating shift' });
  }
});

router.patch('/staff/shifts/:id', requireAdmin, async (req, res) => {
  try {
    const shift = await StaffShift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ success: false, error: 'Shift not found' });
    }
    if (shift.status === 'paid' && req.body.status !== 'paid') {
      return res.status(400).json({ success: false, error: 'Paid shifts cannot be moved back to unpaid status' });
    }

    const startTime = req.body.startTime !== undefined ? String(req.body.startTime).trim() : shift.startTime;
    const endTime = req.body.endTime !== undefined ? String(req.body.endTime).trim() : shift.endTime;
    const breakMinutes = req.body.breakMinutes !== undefined
      ? Math.max(0, Number(req.body.breakMinutes) || 0)
      : shift.breakMinutes;
    const hoursWorked = calculateShiftHours(startTime, endTime, breakMinutes);
    if (!hoursWorked) {
      return res.status(400).json({ success: false, error: 'Shift end time must be after start time and break' });
    }

    if (req.body.date !== undefined) {
      const date = parseDateOnly(req.body.date);
      if (!date) return res.status(400).json({ success: false, error: 'Valid shift date is required' });
      shift.date = date;
    }
    if (req.body.staffId !== undefined && String(req.body.staffId) !== String(shift.staffId)) {
      const staff = await Staff.findById(req.body.staffId).lean();
      if (!staff || staff.status !== 'active') {
        return res.status(400).json({ success: false, error: 'Replacement staff member must be active' });
      }
      shift.staffId = staff._id;
      shift.hourlyRateSnapshot = parseMoney(req.body.hourlyRateSnapshot, staff.hourlyRate || 0);
    } else if (req.body.hourlyRateSnapshot !== undefined) {
      shift.hourlyRateSnapshot = parseMoney(req.body.hourlyRateSnapshot, shift.hourlyRateSnapshot);
    }

    shift.startTime = startTime;
    shift.endTime = endTime;
    shift.breakMinutes = breakMinutes;
    shift.hoursWorked = hoursWorked;
    shift.payAmount = Math.round(hoursWorked * shift.hourlyRateSnapshot * 100) / 100;
    if (req.body.quoteId !== undefined) shift.quoteId = req.body.quoteId || undefined;
    if (req.body.location !== undefined) shift.location = String(req.body.location || '').trim();
    if (req.body.notes !== undefined) shift.notes = String(req.body.notes || '').trim();

    if (req.body.status !== undefined) {
      if (!SHIFT_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ success: false, error: 'Invalid shift status' });
      }
      shift.status = req.body.status;
      if (['approved', 'paid'].includes(req.body.status) && !shift.approvedAt) {
        shift.approvedAt = new Date();
      }
      if (req.body.status === 'paid' && !shift.paidAt) {
        shift.paidAt = new Date();
      }
    }
    shift.updatedBy = req.user?.id || 'admin';
    await shift.save();

    return res.json({ success: true, shift });
  } catch (error) {
    console.error('Error updating staff shift:', error);
    return res.status(500).json({ success: false, error: 'Error updating shift' });
  }
});

router.get('/staff/payroll', requireAdmin, async (req, res) => {
  try {
    const { from, to } = getDateRange(req.query);
    const filter = {
      date: { $gte: from, $lte: to },
      status: { $in: ['completed', 'approved', 'paid'] },
    };
    if (req.query.staffId) filter.staffId = req.query.staffId;

    const shifts = await StaffShift.find(filter)
      .sort({ date: -1, startTime: -1 })
      .populate('staffId', 'firstName lastName role hourlyRate status')
      .lean();

    const byStaff = new Map();
    for (const shift of shifts) {
      const staff = shift.staffId || {};
      const staffId = String(staff._id || shift.staffId);
      if (!byStaff.has(staffId)) {
        byStaff.set(staffId, {
          staffId,
          staffName: `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Unknown staff',
          role: staff.role || 'cleaner',
          shiftCount: 0,
          hours: 0,
          approvedHours: 0,
          paidHours: 0,
          grossPay: 0,
          approvedPay: 0,
          paidPay: 0,
          pendingPay: 0,
          shifts: [],
        });
      }
      const row = byStaff.get(staffId);
      row.shiftCount += 1;
      row.hours += shift.hoursWorked || 0;
      row.grossPay += shift.payAmount || 0;
      if (['approved', 'paid'].includes(shift.status)) {
        row.approvedHours += shift.hoursWorked || 0;
        row.approvedPay += shift.payAmount || 0;
      }
      if (shift.status === 'paid') {
        row.paidHours += shift.hoursWorked || 0;
        row.paidPay += shift.payAmount || 0;
      }
      row.pendingPay = row.approvedPay - row.paidPay;
      row.shifts.push(shift);
    }

    const summaries = Array.from(byStaff.values()).map((row) => ({
      ...row,
      hours: Math.round(row.hours * 100) / 100,
      approvedHours: Math.round(row.approvedHours * 100) / 100,
      paidHours: Math.round(row.paidHours * 100) / 100,
      grossPay: Math.round(row.grossPay * 100) / 100,
      approvedPay: Math.round(row.approvedPay * 100) / 100,
      paidPay: Math.round(row.paidPay * 100) / 100,
      pendingPay: Math.round(row.pendingPay * 100) / 100,
    }));

    return res.json({
      success: true,
      range: { from, to },
      summaries,
      totals: summaries.reduce(
        (acc, row) => ({
          shiftCount: acc.shiftCount + row.shiftCount,
          hours: Math.round((acc.hours + row.hours) * 100) / 100,
          approvedHours: Math.round((acc.approvedHours + row.approvedHours) * 100) / 100,
          grossPay: Math.round((acc.grossPay + row.grossPay) * 100) / 100,
          approvedPay: Math.round((acc.approvedPay + row.approvedPay) * 100) / 100,
          paidPay: Math.round((acc.paidPay + row.paidPay) * 100) / 100,
          pendingPay: Math.round((acc.pendingPay + row.pendingPay) * 100) / 100,
        }),
        { shiftCount: 0, hours: 0, approvedHours: 0, grossPay: 0, approvedPay: 0, paidPay: 0, pendingPay: 0 },
      ),
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return res.status(500).json({ success: false, error: 'Error fetching payroll' });
  }
});

router.get('/export/staff-payroll-csv', requireAdmin, async (req, res) => {
  try {
    const { from, to } = getDateRange(req.query);
    const filter = {
      date: { $gte: from, $lte: to },
      status: { $in: ['completed', 'approved', 'paid'] },
    };
    if (req.query.staffId) filter.staffId = req.query.staffId;

    const shifts = await StaffShift.find(filter)
      .sort({ date: 1, startTime: 1 })
      .populate('staffId', 'firstName lastName role')
      .populate('quoteId', 'reference serviceType')
      .lean();

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'Date', title: 'Date' },
        { id: 'Staff', title: 'Staff' },
        { id: 'Role', title: 'Role' },
        { id: 'Reference', title: 'Job Reference' },
        { id: 'Status', title: 'Status' },
        { id: 'Start', title: 'Start' },
        { id: 'End', title: 'End' },
        { id: 'Break', title: 'Break Minutes' },
        { id: 'Hours', title: 'Hours' },
        { id: 'Rate', title: 'Hourly Rate' },
        { id: 'Pay', title: 'Pay Amount' },
        { id: 'Location', title: 'Location' },
        { id: 'Notes', title: 'Notes' },
      ],
    });

    const rows = shifts.map((shift) => ({
      Date: new Date(shift.date).toLocaleDateString('en-GB'),
      Staff: `${shift.staffId?.firstName || ''} ${shift.staffId?.lastName || ''}`.trim(),
      Role: shift.staffId?.role || '',
      Reference: shift.quoteId?.reference || '',
      Status: shift.status,
      Start: shift.startTime,
      End: shift.endTime,
      Break: shift.breakMinutes || 0,
      Hours: shift.hoursWorked || 0,
      Rate: Number(shift.hourlyRateSnapshot || 0).toFixed(2),
      Pay: Number(shift.payAmount || 0).toFixed(2),
      Location: shift.location || '',
      Notes: (shift.notes || '').replace(/\n/g, ' '),
    }));

    const headerBlock = [
      'Apex Five Cleaning - Staff Payroll Export',
      `From: ${from.toLocaleDateString('en-GB')}`,
      `To: ${to.toLocaleDateString('en-GB')}`,
      `Total Shifts: ${rows.length}`,
      '',
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=staff_payroll_export.csv');
    return res.send(headerBlock + csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(rows));
  } catch (error) {
    console.error('Error exporting staff payroll:', error);
    return res.status(500).json({ success: false, error: 'Error exporting staff payroll' });
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
        { $match: { status: 'converted', isDeleted: { $ne: true } } },
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
    const activeQuotesFilter = { isDeleted: { $ne: true } };
    const totalQuotes = await Quote.countDocuments(activeQuotesFilter);
    const newQuotes = await Quote.countDocuments({ ...activeQuotesFilter, status: 'new' });
    const contactedQuotes = await Quote.countDocuments({ ...activeQuotesFilter, status: 'contacted' });
    const convertedQuotes = await Quote.countDocuments({ ...activeQuotesFilter, status: 'converted' });
    const rejectedQuotes = await Quote.countDocuments({ ...activeQuotesFilter, status: 'rejected' });
    
    // Get quotes from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentQuotes = await Quote.countDocuments({
      ...activeQuotesFilter,
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Get most common service type
    const serviceStats = await Quote.aggregate([
      { $match: activeQuotesFilter },
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
