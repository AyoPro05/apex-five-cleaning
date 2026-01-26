import express from 'express';
import Quote from '../models/Quote.js';
import { createObjectCsvStringifier } from 'csv-writer';

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
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
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
    const { status, adminNotes } = req.body;
    
    if (status && !['new', 'contacted', 'converted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
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
    
    // Prepare data for CSV
    const csvData = quotes.map(quote => ({
      'Quote ID': quote._id.toString(),
      'Created Date': new Date(quote.createdAt).toLocaleString('en-GB'),
      'First Name': quote.firstName,
      'Last Name': quote.lastName,
      'Email': quote.email,
      'Phone': quote.phone,
      'Property Type': quote.propertyType,
      'Bedrooms': quote.bedrooms,
      'Bathrooms': quote.bathrooms,
      'Service Type': quote.serviceType,
      'Address': quote.address,
      'Status': quote.status,
      'CAPTCHA Score': (quote.captchaScore * 100).toFixed(0) + '%',
      'Admin Notes': quote.adminNotes || ''
    }));
    
    // Create CSV string
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'Quote ID', title: 'Quote ID' },
        { id: 'Created Date', title: 'Created Date' },
        { id: 'First Name', title: 'First Name' },
        { id: 'Last Name', title: 'Last Name' },
        { id: 'Email', title: 'Email' },
        { id: 'Phone', title: 'Phone' },
        { id: 'Property Type', title: 'Property Type' },
        { id: 'Bedrooms', title: 'Bedrooms' },
        { id: 'Bathrooms', title: 'Bathrooms' },
        { id: 'Service Type', title: 'Service Type' },
        { id: 'Address', title: 'Address' },
        { id: 'Status', title: 'Status' },
        { id: 'CAPTCHA Score', title: 'CAPTCHA Score' },
        { id: 'Admin Notes', title: 'Admin Notes' }
      ]
    });
    
    const csvString = csvStringifier.getHeaderString() + 
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
