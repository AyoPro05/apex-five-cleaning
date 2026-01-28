import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { Queue } from 'bull';
import redis from 'redis';
import {
  paymentReceiptTemplate,
  bookingConfirmationTemplate,
  refundNotificationTemplate,
} from '../templates/emailTemplates.js';

/**
 * ENHANCED EMAIL SERVICE
 * Comprehensive email handling with queue system, retry logic, and templates
 */

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds base delay for exponential backoff

// Initialize Redis client for queue
let redisClient = null;
let emailQueue = null;

try {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  });
  
  redisClient.on('connect', () => {
    console.log('✓ Redis connected for email queue');
  });
  
  redisClient.on('error', (err) => {
    console.warn('⚠ Redis connection failed, email queue disabled:', err.message);
  });
} catch (error) {
  console.warn('⚠ Redis initialization failed, email queue disabled');
}

// Initialize email queue (if Redis available)
if (redisClient) {
  emailQueue = new Queue('email-queue', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    },
  });

  // Process email jobs from queue
  emailQueue.process(async (job) => {
    return await sendEmailWithRetry(job.data);
  });

  emailQueue.on('failed', (job, err) => {
    console.error(`❌ Email job failed: ${job.id}`, err.message);
  });

  emailQueue.on('completed', (job) => {
    console.log(`✓ Email job completed: ${job.id}`);
  });
}

// Initialize SendGrid if using SendGrid
let sgMailClient = null;
if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  sgMailClient = sgMail;
  console.log('✓ SendGrid initialized');
}

// Initialize SMTP transport if using SMTP
let smtpTransport = null;
if (EMAIL_PROVIDER === 'smtp' && process.env.SMTP_HOST) {
  smtpTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log(`✓ SMTP configured: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
}

/**
 * Get sender email address
 */
const getSenderEmail = () => {
  if (EMAIL_PROVIDER === 'sendgrid') {
    return process.env.SENDGRID_FROM_EMAIL || 'no-reply@apexfivecleaning.co.uk';
  }
  return process.env.SMTP_FROM_EMAIL || 'no-reply@apexfivecleaning.co.uk';
};

/**
 * Get sender name
 */
const getSenderName = () => {
  return process.env.SMTP_FROM_NAME || 'Apex Five Cleaning';
};

/**
 * Validate email address format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Calculate exponential backoff delay
 * @param {number} retryCount - Number of retries attempted
 * @returns {number} Delay in milliseconds
 */
const getRetryDelay = (retryCount) => {
  return RETRY_DELAY * Math.pow(2, retryCount);
};

/**
 * Send email with retry logic using SendGrid
 * @param {object} mailData - Email data
 * @param {number} retryCount - Current retry count
 * @returns {Promise<object>}
 */
const sendViasendGrid = async (mailData, retryCount = 0) => {
  try {
    const response = await sgMailClient.send({
      to: mailData.to,
      from: {
        email: getSenderEmail(),
        name: getSenderName(),
      },
      subject: mailData.subject,
      html: mailData.html,
      replyTo: mailData.replyTo || 'support@apexfivecleaning.co.uk',
      categories: [mailData.category || 'general'],
      metadata: mailData.metadata || {},
    });

    console.log(`✓ Email sent via SendGrid to ${mailData.to}`);
    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      provider: 'sendgrid',
    };
  } catch (error) {
    if (retryCount < MAX_RETRIES && shouldRetry(error)) {
      const delay = getRetryDelay(retryCount);
      console.log(`⚠ Retrying email to ${mailData.to} after ${delay}ms (attempt ${retryCount + 1})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendViasenGrid(mailData, retryCount + 1);
    }

    throw error;
  }
};

/**
 * Send email with retry logic using SMTP
 * @param {object} mailData - Email data
 * @param {number} retryCount - Current retry count
 * @returns {Promise<object>}
 */
const sendViaSMTP = async (mailData, retryCount = 0) => {
  try {
    const response = await smtpTransport.sendMail({
      from: `${getSenderName()} <${getSenderEmail()}>`,
      to: mailData.to,
      subject: mailData.subject,
      html: mailData.html,
      replyTo: mailData.replyTo || 'support@apexfivecleaning.co.uk',
      headers: {
        'X-Email-Category': mailData.category || 'general',
        'X-Email-Type': mailData.type || 'transactional',
      },
    });

    console.log(`✓ Email sent via SMTP to ${mailData.to}`);
    return {
      success: true,
      messageId: response.messageId,
      provider: 'smtp',
    };
  } catch (error) {
    if (retryCount < MAX_RETRIES && shouldRetry(error)) {
      const delay = getRetryDelay(retryCount);
      console.log(`⚠ Retrying email to ${mailData.to} after ${delay}ms (attempt ${retryCount + 1})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendViaSMTP(mailData, retryCount + 1);
    }

    throw error;
  }
};

/**
 * Determine if error is retryable
 * @param {Error} error - Error object
 * @returns {boolean}
 */
const shouldRetry = (error) => {
  const retryableErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];
  const retryableCodes = [429, 500, 502, 503, 504];

  if (retryableErrors.includes(error.code)) return true;
  if (retryableCodes.includes(error.response?.status)) return true;

  return false;
};

/**
 * Send email with retry logic
 * @param {object} mailData - Email data
 * @returns {Promise<object>}
 */
export const sendEmailWithRetry = async (mailData) => {
  // Validate input
  if (!mailData.to || !validateEmail(mailData.to)) {
    throw new Error(`Invalid email address: ${mailData.to}`);
  }

  if (!mailData.subject || !mailData.html) {
    throw new Error('Email must have subject and HTML content');
  }

  // Log attempt (in test/debug mode)
  if (process.env.LOG_EMAILS === 'true') {
    console.log(`📧 Sending email to ${mailData.to}`);
    console.log(`   Subject: ${mailData.subject}`);
    console.log(`   Category: ${mailData.category || 'general'}`);
  }

  // Send via appropriate provider
  if (EMAIL_PROVIDER === 'sendgrid' && sgMailClient) {
    return sendViasenGrid(mailData);
  } else if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
    return sendViaSMTP(mailData);
  } else {
    throw new Error('No email provider configured');
  }
};

/**
 * Queue email for async delivery
 * @param {object} mailData - Email data
 * @returns {Promise<object>}
 */
export const queueEmail = async (mailData) => {
  // If Redis/queue not available, send synchronously
  if (!emailQueue) {
    console.warn('⚠ Email queue not available, sending synchronously');
    return sendEmailWithRetry(mailData);
  }

  try {
    const job = await emailQueue.add(mailData, {
      attempts: MAX_RETRIES,
      backoff: {
        type: 'exponential',
        delay: RETRY_DELAY,
      },
      removeOnComplete: true,
    });

    console.log(`✓ Email queued (Job ID: ${job.id})`);
    return {
      success: true,
      queued: true,
      jobId: job.id,
    };
  } catch (error) {
    console.error('Error queueing email:', error);
    // Fallback to synchronous send
    return sendEmailWithRetry(mailData);
  }
};

/**
 * PAYMENT RECEIPT EMAIL
 */
export const sendPaymentReceipt = async (payment, booking, queueIfPossible = true) => {
  const mailData = {
    to: booking.customerEmail || booking.email,
    subject: `Payment Receipt - Apex Five Cleaning (${payment.id})`,
    html: paymentReceiptTemplate(payment, booking),
    category: 'payment-receipt',
    type: 'transactional',
    metadata: {
      paymentId: payment.id,
      bookingId: booking.id,
      emailType: 'payment-receipt',
    },
  };

  if (queueIfPossible && emailQueue) {
    return queueEmail(mailData);
  }
  return sendEmailWithRetry(mailData);
};

/**
 * BOOKING CONFIRMATION EMAIL
 */
export const sendBookingConfirmation = async (booking, payment = null, queueIfPossible = true) => {
  const mailData = {
    to: booking.customerEmail || booking.email,
    subject: `✓ Booking Confirmed - ${new Date(booking.date).toLocaleDateString('en-GB')}`,
    html: bookingConfirmationTemplate(booking, payment),
    category: 'booking-confirmation',
    type: 'transactional',
    metadata: {
      bookingId: booking.id,
      emailType: 'booking-confirmation',
    },
  };

  if (queueIfPossible && emailQueue) {
    return queueEmail(mailData);
  }
  return sendEmailWithRetry(mailData);
};

/**
 * REFUND NOTIFICATION EMAIL
 */
export const sendRefundNotification = async (payment, booking, reason = null, queueIfPossible = true) => {
  const mailData = {
    to: booking.customerEmail || booking.email,
    subject: `Refund Processed - ${payment.id}`,
    html: refundNotificationTemplate(payment, booking, reason),
    category: 'refund-notification',
    type: 'transactional',
    metadata: {
      paymentId: payment.id,
      bookingId: booking.id,
      emailType: 'refund-notification',
    },
  };

  if (queueIfPossible && emailQueue) {
    return queueEmail(mailData);
  }
  return sendEmailWithRetry(mailData);
};

/**
 * ADMIN NOTIFICATION EMAIL
 */
export const sendAdminNotification = async (subject, data, adminEmail = null, queueIfPossible = true) => {
  const toEmail = adminEmail || process.env.ADMIN_EMAIL || 'admin@apexfivecleaning.co.uk';

  const html = `
    <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h2 style="color: #14b8a6;">${subject}</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            <pre style="overflow-x: auto; color: #555;">${JSON.stringify(data, null, 2)}</pre>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Auto-generated email | Do not reply
          </p>
        </div>
      </body>
    </html>
  `;

  const mailData = {
    to: toEmail,
    subject: `[ADMIN] ${subject}`,
    html,
    category: 'admin-notification',
    type: 'system',
  };

  if (queueIfPossible && emailQueue) {
    return queueEmail(mailData);
  }
  return sendEmailWithRetry(mailData);
};

/**
 * Get email queue stats
 */
export const getEmailQueueStats = async () => {
  if (!emailQueue) {
    return { available: false };
  }

  try {
    const counts = await emailQueue.getJobCounts();
    return {
      available: true,
      ...counts,
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return { available: false, error: error.message };
  }
};

/**
 * Clear failed email jobs
 */
export const clearFailedEmails = async () => {
  if (!emailQueue) {
    return { success: false, message: 'Queue not available' };
  }

  try {
    const failed = await emailQueue.getFailed();
    for (const job of failed) {
      await job.remove();
    }
    return {
      success: true,
      cleared: failed.length,
    };
  } catch (error) {
    console.error('Error clearing failed emails:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Health check for email service
 */
export const healthCheckEmailService = async () => {
  const health = {
    provider: EMAIL_PROVIDER,
    sendGrid: sgMailClient ? 'configured' : 'not configured',
    smtp: smtpTransport ? 'configured' : 'not configured',
    queue: emailQueue ? 'available' : 'not available',
    redis: redisClient ? 'connected' : 'not connected',
  };

  if (emailQueue) {
    try {
      const stats = await getEmailQueueStats();
      health.queueStats = stats;
    } catch (error) {
      health.queueError = error.message;
    }
  }

  return health;
};

export default {
  sendPaymentReceipt,
  sendBookingConfirmation,
  sendRefundNotification,
  sendAdminNotification,
  sendEmailWithRetry,
  queueEmail,
  getEmailQueueStats,
  clearFailedEmails,
  healthCheckEmailService,
};
