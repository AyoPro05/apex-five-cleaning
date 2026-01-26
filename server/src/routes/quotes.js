import express from 'express';
import Quote from '../models/Quote.js';
import { validateQuoteData, sanitizeEmail, sanitizePhoneNumber } from '../utils/validation.js';
import { sendClientConfirmationEmail, sendAdminNotificationEmail } from '../utils/emailService.js';
import { quoteRateLimiter, emailRateLimiter } from '../middleware/rateLimiter.js';
import { verifyCaptcha } from '../middleware/captchaMiddleware.js';

const router = express.Router();

// Submit a new quote request
router.post(
  '/submit',
  quoteRateLimiter,
  emailRateLimiter,
  verifyCaptcha,
  async (req, res) => {
    try {
      // Validate form data
      const { isValid, errors, value } = validateQuoteData(req.body);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          errors: errors
        });
      }
      
      // Sanitize data
      value.email = sanitizeEmail(value.email);
      value.phone = sanitizePhoneNumber(value.phone);
      
      // Check for duplicate recent submissions (prevent accidental duplicates)
      const recentQuote = await Quote.findOne({
        email: value.email,
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
      });
      
      if (recentQuote) {
        return res.status(409).json({
          success: false,
          error: 'A quote request from this email was already submitted recently. Please check your email or wait a few minutes before submitting again.'
        });
      }
      
      // Create quote document
      const quote = new Quote({
        ...value,
        captchaScore: req.captcha?.score || 0,
        captchaVerified: req.captcha?.verified || false,
        ipAddress: req.ip || req.connection.remoteAddress
      });
      
      // Save to database
      await quote.save();
      
      // Send confirmation email to client
      await sendClientConfirmationEmail(
        quote.email,
        quote.firstName,
        quote._id.toString()
      );
      
      // Send notification to admin
      await sendAdminNotificationEmail(quote);
      
      // Mark emails as sent
      quote.confirmationEmailSent = true;
      quote.adminEmailSent = true;
      await quote.save();
      
      return res.status(201).json({
        success: true,
        message: 'Quote request submitted successfully. Please check your email for confirmation.',
        quoteId: quote._id
      });
    } catch (error) {
      console.error('Error submitting quote:', error);
      return res.status(500).json({
        success: false,
        error: 'An error occurred while submitting your quote request. Please try again later or contact support.'
      });
    }
  }
);

// Get quote by ID (for reference checking)
router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).select(
      'firstName email serviceType status createdAt'
    );
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }
    
    return res.json({
      success: true,
      quote: {
        id: quote._id,
        firstName: quote.firstName,
        email: quote.email,
        serviceType: quote.serviceType,
        status: quote.status,
        submittedAt: quote.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error retrieving quote'
    });
  }
});

export default router;
