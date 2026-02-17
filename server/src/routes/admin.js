import express from 'express';
import Quote from '../models/Quote.js';
import User from '../../models/User.js';
import { createObjectCsvStringifier } from 'csv-writer';
import { sendQuoteApprovedEmail } from '../utils/emailService.js';

const router = express.Router();

// Middleware to verify admin token (basic implementation - replace with proper JWT)
const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (!adminToken || !token || token !== adminToken) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
  
  next();
};

// ================================
// USERS (REGISTERED CUSTOMERS)
// ================================

// Get registered users (customers) with basic search and pagination
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (search) {
      const term = String(search).trim();
      const regex = new RegExp(term, 'i');
      filter.$or = [
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
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
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit) || 1),
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

// Get all quotes with filtering, sorting, and pagination
router.get('/quotes', verifyAdminToken, async (req, res) => {
  try {
    const {
      status = 'new',
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = req.query;
    
    // Build filter
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      const searchUpper = search.trim().toUpperCase();
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        ...(searchUpper ? [{ reference: searchUpper }] : [])
      ];
    }
    
    // Calculate skip
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Get total count
    const total = await Quote.countDocuments(filter);
    
    // Get quotes
    const quotes = await Quote.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    return res.json({
      success: true,
      data: quotes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
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
router.get('/quotes/:id', verifyAdminToken, async (req, res) => {
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
router.patch('/quotes/:id', verifyAdminToken, async (req, res) => {
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
router.get('/export/csv', verifyAdminToken, async (req, res) => {
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
router.get('/export/users-csv', verifyAdminToken, async (req, res) => {
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

// Get dashboard statistics
router.get('/stats', verifyAdminToken, async (req, res) => {
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
