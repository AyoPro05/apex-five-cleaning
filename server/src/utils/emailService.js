import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import User from '../../models/User.js';
import { notifyAdminAlert } from './leadWebhook.js';

/**
 * Email is sent FROM a single configured identity (your SMTP or SendGrid).
 * Recipients can be ANY email domain (gmail.com, yahoo.com, corporate, etc.)—
 * one config works for all customers. Deliverability depends on your sending
 * domain (SPF/DKIM/DMARC), not the recipient's domain.
 */

/** Only active mailbox — all defaults and fallbacks use this address */
const DEFAULT_MAILBOX = 'info@apexfivecleaning.co.uk';

const getNotificationInbox = () =>
  process.env.NOTIFY_EMAIL || process.env.COMPANY_EMAIL || DEFAULT_MAILBOX;

// Provider for send functions (evaluated when module loads, after dotenv in index.js)
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp';

let smtpTransport = null;
let sendGridReady = false;
let initialized = false;

/**
 * Lazy initialization - only called once when first needed
 */
function initializeEmailProvider() {
  if (initialized) return;
  initialized = true;

  const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp';

  if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sendGridReady = true;
    console.log('✓ SendGrid initialized');
  }

  if (EMAIL_PROVIDER === 'smtp' && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    const secure = port === 465;
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // IONOS and most providers on 587 use STARTTLS (not implicit SSL)
      requireTLS: !secure,
      tls: {
        minVersion: 'TLSv1.2',
      },
    });
    console.log(`✓ SMTP configured: ${process.env.SMTP_HOST}:${port} (secure=${secure})`);
  } else if (EMAIL_PROVIDER === 'smtp') {
    const missing = [];
    if (!process.env.SMTP_HOST) missing.push('SMTP_HOST');
    if (!process.env.SMTP_USER) missing.push('SMTP_USER');
    if (!process.env.SMTP_PASS) missing.push('SMTP_PASS');
    console.error(`❌ Email not configured. Missing: ${missing.join(', ')}. Verification and notification emails will not be sent.`);
  }
}

/** Returns true if outbound email can be sent (same config sends to any recipient domain). */
export function isEmailConfigured() {
  initializeEmailProvider();
  const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp';
  if (EMAIL_PROVIDER === 'sendgrid') return sendGridReady;
  if (EMAIL_PROVIDER === 'smtp') return smtpTransport != null;
  return false;
}

/**
 * Safe status for health checks and ops. No secrets.
 * @returns {{ configured: boolean, provider: string|null, hint?: string }}
 */
/** Verify SMTP connection at startup (logs IONOS/auth issues early). */
export async function verifyEmailTransport() {
  initializeEmailProvider();
  const provider = process.env.EMAIL_PROVIDER || 'smtp';
  if (provider === 'smtp' && smtpTransport) {
    try {
      await smtpTransport.verify();
      console.log('✓ SMTP connection verified');
      return { ok: true };
    } catch (error) {
      console.error('❌ SMTP verify failed:', error.message);
      return { ok: false, error: error.message };
    }
  }
  if (provider === 'sendgrid' && sendGridReady) {
    return { ok: true };
  }
  return { ok: false, error: 'Email not configured' };
}

export function getEmailConfigStatus() {
  initializeEmailProvider();
  const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp';
  const provider = EMAIL_PROVIDER === 'sendgrid' ? 'sendgrid' : EMAIL_PROVIDER === 'smtp' ? 'smtp' : null;
  const configured = isEmailConfigured();
  let hint;
  if (!configured && provider === 'smtp') hint = 'Set SMTP_HOST, SMTP_USER, SMTP_PASS (and optionally SMTP_PORT).';
  if (!configured && provider === 'sendgrid') hint = 'Set SENDGRID_API_KEY and optionally SENDGRID_FROM_EMAIL.';
  return { configured, provider, ...(hint && { hint }) };
}

// Get sender email based on provider
const getSenderEmail = () => {
  const provider = process.env.EMAIL_PROVIDER || 'smtp';
  if (provider === 'sendgrid') {
    return process.env.SENDGRID_FROM_EMAIL || DEFAULT_MAILBOX;
  }
  return process.env.SMTP_FROM_EMAIL || DEFAULT_MAILBOX;
};

// Get sender name
const getSenderName = () => {
  return process.env.SMTP_FROM_NAME || 'Apex Five Cleaning';
};

/** SendGrid / nodemailer often put useful details on error.response.body */
const formatOutboundEmailErrorDetail = (error) => {
  const body = error?.response?.body;
  if (body == null) return '';
  if (typeof body === 'string') return body;
  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
};

const logOutboundEmailError = (label, error) => {
  const detail = formatOutboundEmailErrorDetail(error);
  console.error(`❌ ${label}:`, error?.message || error, detail ? `\n   API detail: ${detail.slice(0, 1200)}` : '');
};

/**
 * Retry an outbound email send up to N times with backoff.
 * Use for critical mails (verification, password reset, client confirmation).
 * @param {string} label - human-readable label for logging
 * @param {() => Promise<void>} action - the actual send call (throws on failure)
 * @param {{ retries?: number, delaysMs?: number[] }} [options]
 */
// ─────────────────────────────────────────────────────────────────
// EMAIL DELIVERY TRACKING (bounce / hard-fail detection)
// Records per-user delivery health, alerts admin after repeated failures.
// Safe to call without await (fire-and-forget) — never throws.
// ─────────────────────────────────────────────────────────────────

const BOUNCE_ALERT_THRESHOLD = 3;

const recordEmailSuccess = (email) => {
  if (!email) return;
  User.updateOne(
    { email: String(email).toLowerCase() },
    {
      $set: {
        emailFailures: 0,
        emailDeliveryStatus: 'ok',
        emailLastFailureReason: '',
      },
    },
  ).catch(() => {});
};

const recordEmailFailure = async (email, reason) => {
  if (!email) return;
  try {
    const lower = String(email).toLowerCase();
    const updated = await User.findOneAndUpdate(
      { email: lower },
      {
        $inc: { emailFailures: 1 },
        $set: {
          emailLastFailedAt: new Date(),
          emailLastFailureReason: String(reason || '').slice(0, 240),
        },
      },
      { new: true, projection: { emailFailures: 1, email: 1, firstName: 1, lastName: 1 } },
    ).lean();
    if (!updated) return;

    if (updated.emailFailures >= BOUNCE_ALERT_THRESHOLD) {
      await User.updateOne(
        { _id: updated._id },
        { $set: { emailDeliveryStatus: 'bounced' } },
      );
      // Fire-and-forget admin alert
      notifyAdminAlert(
        'Email bouncing for a user',
        `User: ${updated.firstName || ''} ${updated.lastName || ''} <${updated.email}>\n` +
          `Failure count: ${updated.emailFailures}\n` +
          `Last error: ${String(reason || 'unknown').slice(0, 240)}`,
      ).catch(() => {});
    } else if (updated.emailFailures > 0) {
      await User.updateOne(
        { _id: updated._id },
        { $set: { emailDeliveryStatus: 'warning' } },
      );
    }
  } catch {
    // Never throw from a logging path
  }
};

async function sendWithRetry(label, action, options = {}) {
  const { retries = 2, delaysMs = [600, 2400], trackEmail } = options;
  const totalAttempts = retries + 1;
  let lastError = null;
  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      await action();
      if (attempt > 1) {
        console.log(`✓ ${label} succeeded on attempt ${attempt}/${totalAttempts}`);
      }
      if (trackEmail) recordEmailSuccess(trackEmail);
      return { success: true };
    } catch (error) {
      lastError = error;
      logOutboundEmailError(`${label} attempt ${attempt}/${totalAttempts} failed`, error);
      if (attempt === totalAttempts) {
        if (trackEmail) {
          recordEmailFailure(trackEmail, error?.message || 'unknown').catch(() => {});
        }
        return { success: false, error: error.message };
      }
      const wait = delaysMs[attempt - 1] ?? 2000;
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  return { success: false, error: lastError?.message || 'send failed' };
}

// ─── BRAND CONFIG (used across all email templates) ─────────────────────────
const getBrandConfig = () => {
  const baseUrl = (process.env.CLIENT_URL || 'https://apexfivecleaning.co.uk').replace(/\/$/, '');
  return {
    logoUrl: process.env.COMPANY_LOGO_URL || `${baseUrl}/apex-five-logo.png`,
    companyName: process.env.COMPANY_NAME || 'Apex Five Cleaning',
    legalName: process.env.COMPANY_LEGAL_NAME || 'Apex Five Capital Ltd',
    tagline: process.env.COMPANY_TAGLINE || 'Professional Eco-Friendly Cleaning Services in UK',
    website: process.env.COMPANY_WEBSITE || 'https://apexfivecleaning.co.uk',
    websiteDisplay: process.env.COMPANY_WEBSITE_DISPLAY || 'apexfivecleaning.co.uk',
    email: process.env.COMPANY_EMAIL || DEFAULT_MAILBOX,
    phone: process.env.COMPANY_PHONE || '020 3535 6331',
    phoneTel: process.env.COMPANY_PHONE_TEL || '+442035356331',
    address: process.env.COMPANY_ADDRESS || '91 Manor Road, Wallington SM6 0AP, Surrey',
    brandColor: '#14b8a6',
    brandColorDark: '#0d9488'
  };
};

const getEmailHeader = (brand, title, subtitle = '') => {
  return `
    <div class="email-header">
      <a href="${brand.website}" target="_blank" rel="noopener">
        <img src="${brand.logoUrl}" alt="${brand.companyName} Logo" class="email-logo" width="160" height="auto" style="max-height: 56px; display: block; margin: 0 auto;" />
      </a>
      <h1 class="email-header-title">${title}</h1>
      ${subtitle ? `<p class="email-header-subtitle">${subtitle}</p>` : ''}
    </div>
  `;
};

const getEmailFooter = (brand, extraNote = '') => {
  return `
    <div class="email-footer">
      <div class="email-footer-brand">${brand.companyName}</div>
      <p class="email-footer-tagline">${brand.tagline}</p>
      <p class="email-footer-contact">
        <a href="mailto:${brand.email}">${brand.email}</a> &nbsp;|&nbsp; 
        <a href="tel:${brand.phoneTel}">${brand.phone}</a> &nbsp;|&nbsp;
        <a href="${brand.website}">${brand.websiteDisplay}</a>
      </p>
      <p class="email-footer-address">${brand.address}</p>
      ${extraNote ? `<p class="email-footer-note">${extraNote}</p>` : ''}
      <p class="email-footer-copy">© ${new Date().getFullYear()} ${brand.legalName}. All rights reserved.</p>
    </div>
  `;
};

const getEmailBaseStyles = () => `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; }
  .email-header { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; padding: 28px 24px; text-align: center; border-radius: 8px 8px 0 0; }
  .email-logo { max-height: 56px; width: auto; }
  .email-header-title { margin: 16px 0 0 0; font-size: 22px; font-weight: 600; }
  .email-header-subtitle { margin: 6px 0 0 0; font-size: 14px; opacity: 0.95; }
  .email-content { background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
  .email-footer { background: #f3f4f6; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  .email-footer-brand { font-weight: 700; font-size: 14px; color: #14b8a6; margin-bottom: 4px; }
  .email-footer-tagline { margin: 4px 0; font-size: 12px; color: #6b7280; }
  .email-footer-contact { margin: 12px 0 4px 0; }
  .email-footer-contact a { color: #14b8a6; text-decoration: none; }
  .email-footer-address { margin: 4px 0; color: #9ca3af; font-size: 11px; }
  .email-footer-note { margin: 12px 0 0 0; color: #9ca3af; font-size: 11px; }
  .email-footer-copy { margin: 16px 0 0 0; color: #9ca3af; font-size: 11px; }
  .cta-button { display: inline-block; background: #14b8a6; color: white !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0; }
  .cta-button:hover { background: #0d9488; }
`;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Prevent SMTP header injection in subjects */
const sanitizeEmailHeader = (value) =>
  String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, 200);

export const getClientConfirmationTemplate = (firstName, quoteId) => {
  const safeName = escapeHtml(firstName);
  const safeQuoteId = escapeHtml(quoteId);
  const brand = getBrandConfig();
  return {
    subject: `Quote Request Received - ${brand.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quote Received</title><style>${getEmailBaseStyles()}
          .label { font-weight: 600; color: #14b8a6; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .quote-id { background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 14px; border: 1px solid #e5e7eb; }
          .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
        </style></head>
        <body>
          <div class="email-container">
            ${getEmailHeader(brand, '✓ Quote Request Received', 'We\'ve got your details and will be in touch soon')}
            <div class="email-content">
              <p>Hi ${safeName},</p>
              <p>Thank you for requesting a quote from <strong>${brand.companyName}</strong>! We've received your quote request and our team will review it shortly.</p>
              <div style="margin: 20px 0;">
                <div class="label">Your Quote Reference</div>
                <div class="quote-id">${safeQuoteId}</div>
              </div>
              <p><strong>What happens next:</strong></p>
              <ul>
                <li>Our team will review your requirements within 24 hours</li>
                <li>We'll calculate a personalized quote based on your property and service needs</li>
                <li>You'll receive an email with the quote and next steps</li>
              </ul>
              <div class="divider"></div>
              <p>If you have any urgent questions, feel free to contact us:</p>
              <p>📞 <a href="tel:${brand.phoneTel}">${brand.phone}</a> &nbsp;|&nbsp; 📧 <a href="mailto:${brand.email}">${brand.email}</a><br><small>Monday–Friday, 8am–6pm</small></p>
              <div style="text-align: center;">
                <a href="${brand.website}" class="cta-button">View Our Services</a>
              </div>
            </div>
            ${getEmailFooter(brand)}
          </div>
        </body>
      </html>
    `
  };
};

export const getAdminNotificationTemplate = (quoteData) => {
  const serviceMap = {
    'residential': 'Regular Residential Cleaning',
    'end-of-tenancy': 'End of Tenancy Cleaning',
    'airbnb': 'Airbnb Turnover Cleaning',
    'commercial': 'Commercial Cleaning'
  };
  
  const propertyMap = {
    'house': 'House',
    'flat': 'Flat/Apartment',
    'bungalow': 'Bungalow',
    'commercial': 'Commercial',
    'sharehouse-room': 'Sharehouse/Room'
  };
  const brand = getBrandConfig();
  const adminUrl = `${brand.website.replace(/\/?$/, '')}/admin/quotes/${quoteData._id}`;
  const safeFirst = escapeHtml(quoteData.firstName);
  const safeLast = escapeHtml(quoteData.lastName);
  const safeEmail = escapeHtml(quoteData.email);
  const safePhone = escapeHtml(quoteData.phone);
  const safeAddress = escapeHtml(quoteData.address);
  const safePostcode = quoteData.postcode ? escapeHtml(quoteData.postcode) : '';
  const safeNotes = quoteData.additionalNotes ? escapeHtml(quoteData.additionalNotes) : '';
  const safeIp = escapeHtml(quoteData.ipAddress);
  return {
    subject: `New Quote Request - ${sanitizeEmailHeader(quoteData.firstName)} ${sanitizeEmailHeader(quoteData.lastName)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${getEmailBaseStyles()}
          .email-header { background: #1e293b; }
          .admin-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; background: white; border-radius: 6px; overflow: hidden; }
          .admin-table td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; }
          .admin-table td:first-child { font-weight: 600; width: 32%; background: #f8fafc; color: #475569; }
          .section-title { font-weight: 700; color: #1e293b; margin-top: 20px; margin-bottom: 8px; background: #e0f2fe; padding: 8px 12px; border-radius: 4px; border-left: 4px solid #14b8a6; }
          .cta-button { background: #14b8a6 !important; }
        </style></head>
        <body>
          <div class="email-container">
            ${getEmailHeader(brand, '📋 New Quote Request Received', 'Review and respond from your admin dashboard')}
            <div class="email-content">
              <p><strong>A new quote request has been submitted. Details below:</strong></p>
              <div class="section-title">Customer Information</div>
              <table class="admin-table">
                <tr><td>Name</td><td>${safeFirst} ${safeLast}</td></tr>
                <tr><td>Email</td><td><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
                <tr><td>Phone</td><td><a href="tel:${safePhone}">${safePhone}</a></td></tr>
                <tr><td>Address</td><td>${safeAddress}</td></tr>
                ${safePostcode ? `<tr><td>Postcode</td><td>${safePostcode}</td></tr>` : ''}
              </table>
              <div class="section-title">Property Details</div>
              <table class="admin-table">
                <tr><td>Property Type</td><td>${escapeHtml(propertyMap[quoteData.propertyType] || quoteData.propertyType)}</td></tr>
                <tr><td>Bedrooms</td><td>${escapeHtml(quoteData.bedrooms)}</td></tr>
                <tr><td>Bathrooms</td><td>${escapeHtml(quoteData.bathrooms)}</td></tr>
              </table>
              <div class="section-title">Service Requirements</div>
              <table class="admin-table">
                <tr><td>Service Type</td><td>${escapeHtml(serviceMap[quoteData.serviceType] || quoteData.serviceType)}</td></tr>
                ${safeNotes ? `<tr><td>Additional Notes</td><td>${safeNotes}</td></tr>` : ''}
              </table>
              <div class="section-title">Security</div>
              <table class="admin-table">
                <tr><td>CAPTCHA Score</td><td>${(quoteData.captchaScore * 100).toFixed(0)}%</td></tr>
                <tr><td>CAPTCHA Verified</td><td>${quoteData.captchaVerified ? '✓ Yes' : '✗ No'}</td></tr>
                <tr><td>IP Address</td><td><code>${safeIp}</code></td></tr>
              </table>
              <div style="text-align: center; margin-top: 24px;">
                <a href="${adminUrl}" class="cta-button">View in Admin Dashboard</a>
              </div>
            </div>
            ${getEmailFooter(brand, `⏰ Submitted on ${new Date(quoteData.createdAt).toLocaleString('en-GB')}`)}
          </div>
        </body>
      </html>
    `
  };
};

export const sendClientConfirmationEmail = async (toEmail, firstName, quoteId) => {
  initializeEmailProvider();
  const template = getClientConfirmationTemplate(firstName, quoteId);
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();

  if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    return sendWithRetry(`Client confirmation -> ${toEmail}`, () =>
      sgMail.send({
        to: toEmail,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        subject: template.subject,
        html: template.html,
      }),
    );
  }
  if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
    return sendWithRetry(`Client confirmation -> ${toEmail}`, () =>
      smtpTransport.sendMail({
        to: toEmail,
        from: `"${senderName}" <${senderEmail}>`,
        subject: template.subject,
        html: template.html,
      }),
    );
  }
  console.warn('⚠️ No email provider configured. Email not sent.');
  return { success: false, error: 'No email provider configured' };
};

/**
 * QUOTE APPROVED - CREATE ACCOUNT INVITE
 * Sent when admin sets quote status to "converted"
 */
export const getQuoteApprovedTemplate = (firstName, quoteId) => {
  const brand = getBrandConfig();
  const clientUrl = (process.env.CLIENT_URL || brand.website).replace(/\/$/, '');
  const signupUrl = `${clientUrl}/?signup=1`;
  const safeName = escapeHtml(firstName);
  const safeQuoteId = escapeHtml(quoteId);

  return {
    subject: `✓ Your Quote Was Approved – Create Your Account | ${brand.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${getEmailBaseStyles()}
          .quote-ref { background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 14px; margin: 12px 0; border: 1px solid #e5e7eb; }
        </style></head>
        <body>
          <div class="email-container">
            ${getEmailHeader(brand, '✓ Your Quote Was Approved', 'Create your account to manage your booking')}
            <div class="email-content">
              <p>Hi ${safeName},</p>
              <p>Great news! Your quote request has been approved by our team. We're ready to help you with your cleaning needs.</p>
              <p><strong>Create your free account</strong> to:</p>
              <ul>
                <li>View and manage your quote</li>
                <li>Book and reschedule cleaning services</li>
                <li>Track payments and history</li>
                <li>Request new quotes if things change</li>
              </ul>
              <div class="quote-ref">Quote ref: ${safeQuoteId}</div>
              <div style="text-align: center;">
                <a href="${signupUrl}" class="cta-button">Create My Account</a>
              </div>
              <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
                Questions? Contact us:<br/>
                📧 <a href="mailto:${brand.email}">${brand.email}</a> &nbsp;|&nbsp; 📞 <a href="tel:${brand.phoneTel}">${brand.phone}</a>
              </p>
            </div>
            ${getEmailFooter(brand)}
          </div>
        </body>
      </html>
    `,
    text: `Hi ${firstName},\n\nYour quote was approved! Create your account to manage your booking: ${signupUrl}\n\nQuote ref: ${quoteId}\n\nContact: ${brand.email} | ${brand.phone}\n\n${brand.companyName}`
  };
};

export const sendQuoteApprovedEmail = async (toEmail, firstName, quoteId) => {
  const template = getQuoteApprovedTemplate(firstName, quoteId);
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();

  try {
    if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to: toEmail,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      console.log(`✓ Quote approved email sent to ${toEmail}`);
      return { success: true };
    } else if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      await smtpTransport.sendMail({
        to: toEmail,
        from: `"${senderName}" <${senderEmail}>`,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      console.log(`✓ Quote approved email sent to ${toEmail}`);
      return { success: true };
    } else {
      console.warn('⚠️ No email provider configured. Quote approved email not sent.');
      return { success: false, error: 'No email provider configured' };
    }
  } catch (error) {
    logOutboundEmailError('Error sending quote approved email', error);
    return { success: false, error: error.message };
  }
};

const CONTACT_SUBJECT_LABELS = {
  residential: 'Residential Cleaning',
  'end-of-tenancy': 'End of Tenancy',
  airbnb: 'Airbnb Cleaning',
  quote: 'Request a Quote',
  other: 'Other Inquiry',
};

export const getContactEnquiryTemplate = (enquiry) => {
  const brand = getBrandConfig();
  const subjectLabel =
    CONTACT_SUBJECT_LABELS[enquiry.subject] || enquiry.subject || 'General enquiry';
  const phoneRow = enquiry.phone
    ? `<tr><td>Phone</td><td><a href="tel:${escapeHtml(enquiry.phone)}">${escapeHtml(enquiry.phone)}</a></td></tr>`
    : '';

  return {
    subject: `Website enquiry — ${sanitizeEmailHeader(enquiry.name)}${enquiry.subject ? ` (${sanitizeEmailHeader(subjectLabel)})` : ''}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${getEmailBaseStyles()}
          .admin-table { width: 100%; border-collapse: collapse; margin: 16px 0; background: white; border-radius: 6px; overflow: hidden; }
          .admin-table td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          .admin-table td:first-child { font-weight: 600; width: 28%; background: #f8fafc; color: #475569; }
          .message-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; white-space: pre-wrap; }
        </style></head>
        <body>
          
          <div class="email-container">
            ${getEmailHeader(brand, 'New contact form message', 'Reply directly to the customer from your inbox')}
            
            <div class="email-content">
              <table class="admin-table">
                <tr><td>Name</td><td>${escapeHtml(enquiry.name)}</td></tr>
                <tr><td>Email</td><td><a href="mailto:${escapeHtml(enquiry.email)}">${escapeHtml(enquiry.email)}</a></td></tr>
                ${phoneRow}
                <tr><td>Subject</td><td>${escapeHtml(subjectLabel)}</td></tr>
              </table>
              <p><strong>Message</strong></p>
              
              <div class="message-box">${escapeHtml(enquiry.message)}</div>
            </div>
            ${getEmailFooter(brand, `Submitted ${new Date().toLocaleString('en-GB')}`)}
          </div>
        </body>
      </html>
    `,
    text: `New contact form message\n\nName: ${enquiry.name}\nEmail: ${enquiry.email}\nPhone: ${enquiry.phone || '—'}\nSubject: ${subjectLabel}\n\n${enquiry.message}`,
  };
};

export const sendContactEnquiryEmail = async (enquiry) => {
  initializeEmailProvider();
  const template = getContactEnquiryTemplate(enquiry);
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();
  const notifyEmail = getNotificationInbox();
  const customerEmail = enquiry.email;

  try {
    if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to: notifyEmail,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        replyTo: customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      console.log(`✓ Contact enquiry email sent to ${notifyEmail} via SendGrid`);
      return { success: true };
    }
    if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      await smtpTransport.sendMail({
        to: notifyEmail,
        from: `"${senderName}" <${senderEmail}>`,
        replyTo: customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      console.log(`✓ Contact enquiry email sent to ${notifyEmail} via SMTP`);
      return { success: true };
    }
    console.warn('⚠️ No email provider configured. Contact enquiry not sent.');
    return { success: false, error: 'No email provider configured' };
  } catch (error) {
    logOutboundEmailError('Error sending contact enquiry email', error);
    return { success: false, error: error.message };
  }
};

export const sendAdminNotificationEmail = async (quoteData) => {
  initializeEmailProvider();
  const template = getAdminNotificationTemplate(quoteData);
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();
  const notifyEmail = getNotificationInbox();

  try {
    if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      const msg = {
        to: notifyEmail,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        subject: template.subject,
        html: template.html
      };
      
      await sgMail.send(msg);
      console.log(`✓ Admin notification email sent to ${notifyEmail} via SendGrid`);
      return { success: true };
    } else if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      await smtpTransport.sendMail({
        to: notifyEmail,
        from: `"${senderName}" <${senderEmail}>`,
        subject: template.subject,
        html: template.html
      });
      console.log(`✓ Admin notification email sent to ${notifyEmail} via SMTP`);
      return { success: true };
    } else {
      console.warn('⚠️ No email provider configured. Email not sent.');
      return { success: false, error: 'No email provider configured' };
    }
  } catch (error) {
    logOutboundEmailError('Error sending admin notification email', error);
    return { success: false, error: error.message };
  }
};

/**
 * EMAIL VERIFICATION TEMPLATES & FUNCTIONS
 */

export const getVerificationEmailTemplate = (firstName, verificationLink, expiryHours = 24) => {
  const brand = getBrandConfig();
  const safeName = escapeHtml(firstName);
  return {
    subject: `🔐 Verify Your Email - ${brand.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${getEmailBaseStyles()}
          .verification-box { background: #ecfdf5; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .expiry-notice { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 13px; color: #b45309; }
          .info-section { background: white; padding: 16px; margin: 12px 0; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 13px; }
          .info-section h3 { margin: 0 0 8px 0; font-size: 14px; color: #374151; }
          .security-badge { background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 13px; color: #047857; }
        </style></head>
        <body>
          <div class="email-container">
            ${getEmailHeader(brand, 'Verify Your Email', `Welcome to ${brand.companyName}`)}
            <div class="email-content">
              <p>Hello <strong>${safeName}</strong>,</p>
              <p>Thank you for registering with <strong>${brand.companyName}</strong>! We're excited to help you with all your cleaning needs.</p>
              <div class="verification-box">
                <p style="margin: 0 0 12px 0;"><strong>To get started, please verify your email address:</strong></p>
                <a href="${verificationLink}" class="cta-button">✓ Verify Email Address</a>
              </div>
              <div class="expiry-notice">
                <p style="margin: 0;">⏰ <strong>Important:</strong> This link expires in <strong>${expiryHours} hours</strong> for security.</p>
              </div>
              <div class="info-section">
                <h3>What happens after verification?</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>✅ Your account will be fully activated</li>
                  <li>📊 Access your member dashboard</li>
                  <li>🧹 Book your first cleaning service</li>
                  <li>📧 Receive booking confirmations and reminders</li>
                </ul>
              </div>
              <div class="security-badge">
                <p style="margin: 0;">🔒 <strong>Security:</strong> We will never ask for your password via email.</p>
              </div>
              <p style="font-size: 13px; color: #6b7280;">Need help? Contact us at <a href="mailto:${brand.email}">${brand.email}</a> or <a href="tel:${brand.phoneTel}">${brand.phone}</a>.</p>
            </div>
            ${getEmailFooter(brand, `Sent because you registered at ${brand.websiteDisplay}`)}
          </div>
        </body>
      </html>
    `,
    text: `Verify Your Email - ${brand.companyName}\n\nHello ${firstName},\n\nThank you for registering! Verify your email:\n${verificationLink}\n\nLink expires in ${expiryHours} hours.\n\nIf you didn't create this account, please ignore this email.\n\n${brand.companyName}\n${brand.tagline}`
  };
};

export const getVerificationSuccessTemplate = (firstName) => {
  const brand = getBrandConfig();
  const safeName = escapeHtml(firstName);
  const dashboardUrl = `${(process.env.CLIENT_URL || brand.website).replace(/\/$/, '')}/dashboard`;
  return {
    subject: `✅ Email Verified - Welcome to ${brand.companyName}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${getEmailBaseStyles()}
          .success-icon { font-size: 42px; margin: 0; line-height: 1; }
          .action-box { background: #ecfdf5; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .action-box h3 { margin: 0 0 12px 0; font-size: 15px; }
          .action-box ul { margin: 8px 0 16px 0; padding-left: 20px; }
          .next-steps { background: white; padding: 16px; margin: 16px 0; border-radius: 6px; border: 1px solid #e5e7eb; }
          .next-steps h3 { margin: 0 0 8px 0; font-size: 14px; }
          .next-steps ol { margin: 8px 0 0 0; padding-left: 20px; }
        </style></head>
        <body>
          <div class="email-container">
            ${getEmailHeader(brand, '✅ Email Verified!', 'Your account is now active')}
            <div class="email-content">
              <p>Hello <strong>${safeName}</strong>,</p>
              <p>Congratulations! Your email has been verified. Your <strong>${brand.companyName}</strong> account is now fully activated.</p>
              <div class="action-box">
                <h3>You can now:</h3>
                <ul>
                  <li>✓ Access your member dashboard</li>
                  <li>✓ Book cleaning services</li>
                  <li>✓ Manage your profile and preferences</li>
                  <li>✓ Receive booking updates and reminders</li>
                </ul>
                <a href="${dashboardUrl}" class="cta-button">Go to Your Dashboard</a>
              </div>
              <div class="next-steps">
                <h3>Next steps:</h3>
                <p style="margin: 0;">Browse our services (Residential, End of Tenancy, Airbnb), choose your date and area, add any notes, and complete payment securely.</p>
              </div>
              <p style="margin-top: 20px;">Thank you for choosing ${brand.companyName}. We look forward to serving you!</p>
            </div>
            ${getEmailFooter(brand)}
          </div>
        </body>
      </html>
    `,
    text: `Email Verified - Welcome to ${brand.companyName}!\n\nHello ${firstName},\n\nYour email has been successfully verified!\n\nAccess your dashboard: ${dashboardUrl}\n\nThank you for choosing ${brand.companyName}.\n\n${brand.tagline}`
  };
};

export const getResendVerificationTemplate = (firstName, verificationLink, expiryHours = 24) => {
  const brand = getBrandConfig();
  const safeName = escapeHtml(firstName);
  return {
    subject: `📧 New Verification Link - ${brand.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${getEmailBaseStyles()}
          .verification-box { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .verification-box .expiry { font-size: 13px; color: #b45309; margin-top: 12px; }
          .info-section { background: white; padding: 16px; margin: 12px 0; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 13px; }
        </style></head>
        <body>
          <div class="email-container">
            ${getEmailHeader(brand, '📧 New Verification Link', 'Use this link to verify your email')}
            <div class="email-content">
              <p>Hello <strong>${safeName}</strong>,</p>
              <p>We've generated a new email verification link for you:</p>
              <div class="verification-box">
                <a href="${verificationLink}" class="cta-button">✓ Verify Email</a>
                <p class="expiry" style="margin: 12px 0 0 0;">⏰ This link expires in <strong>${expiryHours} hours</strong>.</p>
              </div>
              <div class="info-section">
                <p style="margin: 0 0 8px 0;">Having trouble?</p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Check your spam/junk folder</li>
                  <li>Copy the link into your browser manually</li>
                  <li>Contact us at <a href="mailto:${brand.email}">${brand.email}</a></li>
                </ul>
              </div>
            </div>
            ${getEmailFooter(brand)}
          </div>
        </body>
      </html>
    `,
    text: `New Verification Link - ${brand.companyName}\n\nHello ${firstName},\n\nVerify your email: ${verificationLink}\n\nLink expires in ${expiryHours} hours.\n\n${brand.companyName}\n${brand.tagline}`
  };
};

/**
 * Send verification email
 */
export const sendVerificationEmail = async (toEmail, firstName, verificationToken) => {
  initializeEmailProvider();
  const verificationLink = `${(process.env.CLIENT_URL || 'https://www.apexfivecleaning.co.uk').replace(/\/$/, '')}/verify-email?token=${verificationToken}`;
  const template = getVerificationEmailTemplate(firstName, verificationLink, 24);
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();

  if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    return sendWithRetry(
      `Verification email -> ${toEmail}`,
      () =>
        sgMail.send({
          to: toEmail,
          from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      { trackEmail: toEmail },
    );
  }
  if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
    return sendWithRetry(
      `Verification email -> ${toEmail}`,
      () =>
        smtpTransport.sendMail({
          to: toEmail,
          from: `"${senderName}" <${senderEmail}>`,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      { trackEmail: toEmail },
    );
  }
  console.error('❌ No email provider configured (set EMAIL_PROVIDER and SMTP_* or SENDGRID_API_KEY). Verification email not sent.');
  return { success: false, error: 'No email provider configured' };
};

/**
 * Send verification success email
 */
export const sendVerificationSuccessEmail = async (toEmail, firstName) => {
  const template = getVerificationSuccessTemplate(firstName);
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();

  try {
    if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      const msg = {
        to: toEmail,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      };
      
      await sgMail.send(msg);
      console.log(`✓ Verification success email sent to ${toEmail} via SendGrid`);
      return { success: true };
    } else if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      await smtpTransport.sendMail({
        to: toEmail,
        from: `"${senderName}" <${senderEmail}>`,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      console.log(`✓ Verification success email sent to ${toEmail} via SMTP`);
      return { success: true };
    } else {
      console.warn('⚠️ No email provider configured. Success email not sent.');
      return { success: false, error: 'No email provider configured' };
    }
  } catch (error) {
    logOutboundEmailError('Error sending verification success email', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send resend verification email
 */
export const sendResendVerificationEmail = async (toEmail, firstName, verificationToken) => {
  const verificationLink = `${(process.env.CLIENT_URL || 'https://www.apexfivecleaning.co.uk').replace(/\/$/, '')}/verify-email?token=${verificationToken}`;
  const template = getResendVerificationTemplate(firstName, verificationLink, 24);
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();

  try {
    if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      const msg = {
        to: toEmail,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      };
      
      await sgMail.send(msg);
      console.log(`✓ Resend verification email sent to ${toEmail} via SendGrid`);
      return { success: true };
    } else if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      await smtpTransport.sendMail({
        to: toEmail,
        from: `"${senderName}" <${senderEmail}>`,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      console.log(`✓ Resend verification email sent to ${toEmail} via SMTP`);
      return { success: true };
    } else {
      console.warn('⚠️ No email provider configured. Resend email not sent.');
      return { success: false, error: 'No email provider configured' };
    }
  } catch (error) {
    logOutboundEmailError('Error sending resend verification email', error);
    return { success: false, error: error.message };
  }
};

/**
 * Password reset email template
 */
function getPasswordResetTemplate(firstName, resetLink, expiryHours = 1) {
  const brand = getBrandConfig();
  const safeName = escapeHtml(firstName);
  return {
    subject: `🔐 Reset Your Password - ${brand.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${getEmailBaseStyles()}
          .reset-box { background: #ecfdf5; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .expiry { font-size: 13px; color: #0d9488; margin-top: 12px; }
          .security-note { background: #fef3c7; padding: 12px; margin: 16px 0; border-radius: 4px; font-size: 13px; }
        </style></head>
        <body>
          <div class="email-container">
            ${getEmailHeader(brand, '🔐 Reset Your Password', 'Use the link below to set a new password')}
            <div class="email-content">
              <p>Hello <strong>${safeName}</strong>,</p>
              <p>We received a request to reset the password for your ${brand.companyName} account.</p>
              <div class="reset-box">
                <a href="${resetLink}" class="cta-button">Reset Password</a>
                <p class="expiry">⏰ This link expires in <strong>${expiryHours} hour${expiryHours !== 1 ? 's' : ''}</strong>.</p>
              </div>
              <div class="security-note">
                <strong>Didn't request this?</strong> You can safely ignore this email. Your password will not be changed.
              </div>
              <p style="font-size: 13px; color: #6b7280;">Need help? Contact us at <a href="mailto:${brand.email}">${brand.email}</a>.</p>
            </div>
            ${getEmailFooter(brand)}
          </div>
        </body>
      </html>
    `,
    text: `Reset Your Password - ${brand.companyName}\n\nHello ${firstName},\n\nReset your password: ${resetLink}\n\nLink expires in ${expiryHours} hour(s).\n\nIf you didn't request this, ignore this email.\n\n${brand.companyName}`
  };
}

/**
 * Send password reset email
 */
export const sendTestEmail = async (toEmail) => {
  initializeEmailProvider();
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();

  if (!smtpTransport && !(EMAIL_PROVIDER === 'sendgrid' && sendGridReady)) {
    return { success: false, error: 'No email provider configured' };
  }

  try {
    if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      await smtpTransport.sendMail({
        to: toEmail,
        from: `"${senderName}" <${senderEmail}>`,
        subject: 'Apex Five Cleaning — SMTP test',
        text: 'If you received this, outbound email from your API is working.',
        html: '<p>If you received this, outbound email from your API is working.</p>',
      });
      console.log(`✓ Test email sent to ${toEmail}`);
      return { success: true };
    }
    return { success: false, error: 'SMTP transport not available' };
  } catch (error) {
    logOutboundEmailError('Test email failed', error);
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────────
// OPERATIONAL EMAILS (scheduler-driven)
// ─────────────────────────────────────────────────────────────────

const buildAdminBaseUrl = () => {
  const brand = getBrandConfig();
  return (process.env.CLIENT_URL || brand.website).replace(/\/$/, '');
};

/**
 * Stuck-quote reminder: sent to NOTIFY_EMAIL when one or more quotes
 * have been sitting in `new` status > 24h.
 */
export const sendStuckQuoteReminderEmail = async (quotes = []) => {
  initializeEmailProvider();
  if (!Array.isArray(quotes) || quotes.length === 0) {
    return { success: false, skipped: true };
  }
  const brand = getBrandConfig();
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();
  const notifyEmail = getNotificationInbox();
  const adminBase = buildAdminBaseUrl();

  const rows = quotes
    .slice(0, 50)
    .map((quote) => {
      const ref = escapeHtml(quote.reference || String(quote._id));
      const hours = Math.max(
        24,
        Math.round((Date.now() - new Date(quote.createdAt).getTime()) / (60 * 60 * 1000)),
      );
      return `
        <tr>
          <td><code>${ref}</code></td>
          <td>${escapeHtml(quote.firstName || '')} ${escapeHtml(quote.lastName || '')}</td>
          <td>${escapeHtml(quote.serviceType || '—')}</td>
          <td>${escapeHtml(quote.postcode || '—')}</td>
          <td>${hours}h ago</td>
        </tr>`;
    })
    .join('');

  const subject = `⏰ ${quotes.length} quote${quotes.length === 1 ? '' : 's'} need follow-up — ${brand.companyName}`;
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><style>${getEmailBaseStyles()}
      table.stuck { width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; }
      table.stuck th, table.stuck td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 13px; }
      table.stuck th { background: #f8fafc; color: #475569; font-weight: 600; }
    </style></head>
    <body>
      <div class="email-container">
        ${getEmailHeader(brand, '⏰ Stuck Quotes Reminder', 'Quotes waiting more than 24 hours for a first response')}
        <div class="email-content">
          <p>The following ${quotes.length} quote${quotes.length === 1 ? '' : 's'} have been sitting in the "new" status for more than 24 hours. A quick follow-up usually doubles conversion.</p>
          <table class="stuck">
            <thead><tr><th>Reference</th><th>Customer</th><th>Service</th><th>Postcode</th><th>Age</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${adminBase}/admin/quotes" class="cta-button">Open admin dashboard</a>
          </div>
        </div>
        ${getEmailFooter(brand, 'Automated reminder · sent once per stuck quote')}
      </div>
    </body></html>`;

  const action = () => {
    if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      return sgMail.send({
        to: notifyEmail,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        subject,
        html,
      });
    }
    if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      return smtpTransport.sendMail({
        to: notifyEmail,
        from: `"${senderName}" <${senderEmail}>`,
        subject,
        html,
      });
    }
    return Promise.reject(new Error('No email provider configured'));
  };
  return sendWithRetry(`Stuck-quote reminder -> ${notifyEmail}`, action);
};

/**
 * Daily ops digest. Pass in pre-aggregated stats.
 * @param {object} stats
 * @param {number} stats.newQuotes24h
 * @param {number} stats.newChatLeads24h
 * @param {number} stats.pendingPaymentsCount
 * @param {number} stats.pendingPaymentsTotal  (in pounds)
 * @param {number} stats.stuckQuotes
 */
export const sendDailyDigestEmail = async (stats = {}) => {
  initializeEmailProvider();
  const brand = getBrandConfig();
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();
  const notifyEmail = getNotificationInbox();
  const adminBase = buildAdminBaseUrl();
  const dateLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const card = (label, value, color = '#14b8a6') => `
    <td style="padding: 14px; background: white; border-radius: 6px; border-left: 4px solid ${color};">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #475569;">${label}</div>
      <div style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 6px;">${value}</div>
    </td>`;

  const subject = `📊 Daily ops digest — ${dateLabel} — ${brand.companyName}`;
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><style>${getEmailBaseStyles()}
      table.kpis { width: 100%; border-spacing: 8px 8px; border-collapse: separate; }
    </style></head>
    <body>
      <div class="email-container">
        ${getEmailHeader(brand, '📊 Daily Ops Digest', dateLabel)}
        <div class="email-content">
          <p>Here is your daily summary of activity across the platform.</p>
          <table class="kpis" cellpadding="0" cellspacing="0">
            <tr>
              ${card('New quotes (24h)', stats.newQuotes24h ?? 0)}
              ${card('Chat leads (24h)', stats.newChatLeads24h ?? 0, '#0ea5e9')}
            </tr>
            <tr>
              ${card('Pending payments', `${stats.pendingPaymentsCount ?? 0}`, '#8b5cf6')}
              ${card('Pending value', `£${Number(stats.pendingPaymentsTotal ?? 0).toFixed(2)}`, '#8b5cf6')}
            </tr>
            <tr>
              ${card('Stuck quotes (>24h)', stats.stuckQuotes ?? 0, '#f59e0b')}
              ${card('—', '—', '#e5e7eb')}
            </tr>
          </table>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${adminBase}/admin" class="cta-button">Open admin dashboard</a>
          </div>
        </div>
        ${getEmailFooter(brand, 'Automated daily digest · sent once per day')}
      </div>
    </body></html>`;

  const action = () => {
    if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      return sgMail.send({
        to: notifyEmail,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        subject,
        html,
      });
    }
    if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      return smtpTransport.sendMail({
        to: notifyEmail,
        from: `"${senderName}" <${senderEmail}>`,
        subject,
        html,
      });
    }
    return Promise.reject(new Error('No email provider configured'));
  };
  return sendWithRetry(`Daily digest -> ${notifyEmail}`, action);
};

const DEFAULT_GOOGLE_REVIEW_URL = 'https://share.google/ByNUvIHRlpT95uh09';

const getGoogleReviewUrl = () =>
  (process.env.GOOGLE_REVIEW_URL && process.env.GOOGLE_REVIEW_URL.trim()) ||
  DEFAULT_GOOGLE_REVIEW_URL;

/**
 * SATISFACTION FOLLOW-UP — sent 48h after a booking is marked "completed".
 * Asks for a Google review when happy; offers a private feedback path otherwise.
 */
export const sendSatisfactionFollowUpEmail = async (toEmail, firstName, reference) => {
  initializeEmailProvider();
  const brand = getBrandConfig();
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();
  const reviewUrl = getGoogleReviewUrl();
  const issueUrl = `mailto:${brand.email}?subject=${encodeURIComponent(
    `Feedback on my recent cleaning (${reference || 'booking'})`,
  )}`;
  const safeName = escapeHtml(firstName || 'there');
  const safeRef = reference ? escapeHtml(reference) : '';
  const subject = `How did we do? · ${brand.companyName}`;
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><style>${getEmailBaseStyles()}
      .review-card { background:#ecfdf5; border-left:4px solid #14b8a6; padding:20px; margin:18px 0; border-radius:4px; }
      .ghost-link { display:inline-block; margin-top:14px; font-size:13px; color:#475569; }
      .stars { font-size:22px; letter-spacing:4px; margin: 8px 0; }
      .ref-pill { display:inline-block; background:white; padding:6px 12px; border-radius:4px; font-family:monospace; font-size:12px; border:1px solid #e5e7eb; margin-bottom:8px; }
    </style></head>
    <body>
      <div class="email-container">
        ${getEmailHeader(brand, 'How did we do?', 'Your feedback helps us keep raising the bar')}
        <div class="email-content">
          <p>Hi ${safeName},</p>
          <p>Thank you for choosing <strong>${brand.companyName}</strong>. We hope your recent clean met the standard we promised.</p>
          ${safeRef ? `<div class="ref-pill">Ref: ${safeRef}</div>` : ''}
          <div class="review-card">
            <div class="stars">★★★★★</div>
            <p style="margin: 4px 0 12px 0;">If you were happy with our service, a short Google review would mean the world to our team and helps other local clients find us.</p>
            <a href="${reviewUrl}" class="cta-button" target="_blank" rel="noopener">Leave a Google review</a>
          </div>
          <p style="font-size:13px; color:#6b7280;">
            Was anything not quite right? Please reply directly — or
            <a href="${issueUrl}" style="color:${brand.brandColorDark};">let us know</a> and we will make it right.
          </p>
          <p style="margin-top:18px;">Thanks again for trusting us with your space.</p>
          <p style="margin-top:8px; font-size:13px; color:#6b7280;">— The ${brand.companyName} team</p>
        </div>
        ${getEmailFooter(brand, 'Automated follow-up · sent once after each completed clean')}
      </div>
    </body></html>`;

  const action = () => {
    if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      return sgMail.send({
        to: toEmail,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        replyTo: process.env.NOTIFY_EMAIL || senderEmail,
        subject,
        html,
      });
    }
    if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      return smtpTransport.sendMail({
        to: toEmail,
        from: `"${senderName}" <${senderEmail}>`,
        replyTo: process.env.NOTIFY_EMAIL || senderEmail,
        subject,
        html,
      });
    }
    return Promise.reject(new Error('No email provider configured'));
  };
  return sendWithRetry(`Satisfaction follow-up -> ${toEmail}`, action);
};

/**
 * CLIENT FOLLOW-UP — sent 24h after quote submission if still in "new" status.
 * Soft, friendly nudge to keep momentum and invite extra details.
 */
export const sendClientFollowUpEmail = async (toEmail, firstName, reference) => {
  initializeEmailProvider();
  const brand = getBrandConfig();
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();
  const safeName = escapeHtml(firstName);
  const safeRef = escapeHtml(reference);
  const subject = `Quick check-in on your quote · ${brand.companyName}`;
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><style>${getEmailBaseStyles()}
      .ref-pill { display:inline-block; background:white; padding:8px 14px; border-radius:4px; font-family:monospace; font-size:13px; border:1px solid #e5e7eb; margin:8px 0; }
    </style></head>
    <body>
      <div class="email-container">
        ${getEmailHeader(brand, 'Just checking in', 'We have your quote — anything to add?')}
        <div class="email-content">
          <p>Hi ${safeName},</p>
          <p>Thanks again for reaching out to <strong>${brand.companyName}</strong>. We received your quote request and our team is reviewing the details.</p>
          <div class="ref-pill">Quote ref: ${safeRef}</div>
          <p>If anything has changed since you submitted — preferred date, additional rooms, specific concerns — just reply to this email and we will update your quote.</p>
          <p>Need to chat?</p>
          <p>📞 <a href="tel:${brand.phoneTel}">${brand.phone}</a> &nbsp;|&nbsp; 📧 <a href="mailto:${brand.email}">${brand.email}</a></p>
          <p style="margin-top:20px;">We aim to respond to every request within a working day.</p>
        </div>
        ${getEmailFooter(brand, 'Sent because you requested a quote on ' + brand.websiteDisplay)}
      </div>
    </body></html>`;

  const action = () => {
    if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      return sgMail.send({
        to: toEmail,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        replyTo: process.env.NOTIFY_EMAIL || senderEmail,
        subject,
        html,
      });
    }
    if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      return smtpTransport.sendMail({
        to: toEmail,
        from: `"${senderName}" <${senderEmail}>`,
        replyTo: process.env.NOTIFY_EMAIL || senderEmail,
        subject,
        html,
      });
    }
    return Promise.reject(new Error('No email provider configured'));
  };
  return sendWithRetry(`Client follow-up -> ${toEmail}`, action);
};

/**
 * PAYMENT REMINDER — sent 48h after a quote is converted (approved) if no payment yet.
 */
export const sendPaymentReminderEmail = async (toEmail, firstName, reference, approvedAmount) => {
  initializeEmailProvider();
  const brand = getBrandConfig();
  const clientBase = (process.env.CLIENT_URL || brand.website).replace(/\/$/, '');
  const payUrl = `${clientBase}/pay-online`;
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();
  const safeName = escapeHtml(firstName);
  const safeRef = escapeHtml(reference);
  const amountLine = Number.isFinite(Number(approvedAmount)) && Number(approvedAmount) > 0
    ? `<p>Approved amount: <strong>£${Number(approvedAmount).toFixed(2)}</strong></p>`
    : '';
  const subject = `Reminder · complete payment for quote ${reference} · ${brand.companyName}`;
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><style>${getEmailBaseStyles()}
      .ref-pill { display:inline-block; background:white; padding:8px 14px; border-radius:4px; font-family:monospace; font-size:13px; border:1px solid #e5e7eb; margin:8px 0; }
      .pay-box { background:#ecfdf5; border-left:4px solid #14b8a6; padding:18px; margin:18px 0; border-radius:4px; }
    </style></head>
    <body>
      <div class="email-container">
        ${getEmailHeader(brand, 'Friendly reminder', 'Complete payment to lock in your booking')}
        <div class="email-content">
          <p>Hi ${safeName},</p>
          <p>Your quote has been approved and is ready to book. To secure your preferred slot, please complete payment using the link below.</p>
          <div class="ref-pill">Quote ref: ${safeRef}</div>
          ${amountLine}
          <div class="pay-box">
            <a href="${payUrl}" class="cta-button">Pay Online</a>
            <p style="margin:10px 0 0 0; font-size:13px; color:#0d9488;">Use your quote reference and email to retrieve payment details on the page.</p>
          </div>
          <p style="font-size:13px; color:#6b7280;">If you have already paid, please ignore this reminder. Need help?</p>
          <p>📞 <a href="tel:${brand.phoneTel}">${brand.phone}</a> &nbsp;|&nbsp; 📧 <a href="mailto:${brand.email}">${brand.email}</a></p>
        </div>
        ${getEmailFooter(brand, 'Automated payment reminder · sent once per approved quote')}
      </div>
    </body></html>`;

  const action = () => {
    if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      return sgMail.send({
        to: toEmail,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        replyTo: process.env.NOTIFY_EMAIL || senderEmail,
        subject,
        html,
      });
    }
    if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      return smtpTransport.sendMail({
        to: toEmail,
        from: `"${senderName}" <${senderEmail}>`,
        replyTo: process.env.NOTIFY_EMAIL || senderEmail,
        subject,
        html,
      });
    }
    return Promise.reject(new Error('No email provider configured'));
  };
  return sendWithRetry(`Payment reminder -> ${toEmail}`, action);
};

export const sendPasswordResetEmail = async (toEmail, firstName, resetToken) => {
  initializeEmailProvider();
  const resetLink = `${(process.env.CLIENT_URL || 'https://apexfivecleaning.co.uk').replace(/\/$/, '')}/reset-password?token=${resetToken}`;
  const template = getPasswordResetTemplate(firstName, resetLink, 1);
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();

  if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    return sendWithRetry(
      `Password reset -> ${toEmail}`,
      () =>
        sgMail.send({
          to: toEmail,
          from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      { trackEmail: toEmail },
    );
  }
  if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
    return sendWithRetry(
      `Password reset -> ${toEmail}`,
      () =>
        smtpTransport.sendMail({
          to: toEmail,
          from: `"${senderName}" <${senderEmail}>`,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      { trackEmail: toEmail },
    );
  }
  console.warn('⚠️ No email provider configured. Password reset email not sent.');
  return { success: false, error: 'No email provider configured' };
};
