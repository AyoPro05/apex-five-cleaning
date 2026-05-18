import express from 'express';
import {
  validateContactData,
  sanitizeEmail,
  sanitizePhoneNumber,
} from '../utils/validation.js';
import { sendContactEnquiryEmail, isEmailConfigured } from '../utils/emailService.js';
import {
  contactRateLimiter,
  contactEmailRateLimiter,
} from '../middleware/rateLimiter.js';

const router = express.Router();

router.post(
  '/',
  contactRateLimiter,
  contactEmailRateLimiter,
  async (req, res) => {
    try {
      // Honeypot — bots often fill hidden fields
      if (req.body._website) {
        return res.json({
          success: true,
          message: 'Thank you for your message. We will get back to you within 24 hours.',
        });
      }

      const validation = validateContactData(req.body);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return res.status(400).json({
          success: false,
          error: firstError || 'Please check the form and try again.',
          errors: validation.errors,
        });
      }

      const { name, email, phone, subject, message } = validation.value;
      const enquiry = {
        name: name.trim(),
        email: sanitizeEmail(email),
        phone: phone?.trim() ? sanitizePhoneNumber(phone.trim()) : '',
        subject: subject || '',
        message: message.trim(),
      };

      if (!isEmailConfigured()) {
        console.error('Contact form submitted but email is not configured');
        return res.status(503).json({
          success: false,
          error:
            'We could not send your message right now. Please email info@apexfivecleaning.co.uk or call us directly.',
        });
      }

      const emailResult = await sendContactEnquiryEmail(enquiry);
      if (!emailResult.success) {
        console.error('Contact enquiry email failed:', emailResult.error);
        return res.status(500).json({
          success: false,
          error:
            'We could not send your message. Please try again or contact us at info@apexfivecleaning.co.uk.',
        });
      }

      return res.json({
        success: true,
        message: 'Thank you for your message. We will get back to you within 24 hours.',
      });
    } catch (error) {
      console.error('Contact form error:', error);
      return res.status(500).json({
        success: false,
        error: 'Something went wrong. Please try again later.',
      });
    }
  },
);

export default router;
