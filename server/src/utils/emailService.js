import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

/**
 * Email is sent FROM a single configured identity (your SMTP or SendGrid).
 * Recipients can be ANY email domain (gmail.com, yahoo.com, corporate, etc.)—
 * one config works for all customers. Deliverability depends on your sending
 * domain (SPF/DKIM/DMARC), not the recipient's domain.
 */
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp';

let smtpTransport = null;
let sendGridReady = false;

if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  sendGridReady = true;
  console.log('✓ SendGrid initialized');
}

if (EMAIL_PROVIDER === 'smtp' && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log(`✓ SMTP configured: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
} else if (EMAIL_PROVIDER === 'smtp') {
  const missing = [];
  if (!process.env.SMTP_HOST) missing.push('SMTP_HOST');
  if (!process.env.SMTP_USER) missing.push('SMTP_USER');
  if (!process.env.SMTP_PASS) missing.push('SMTP_PASS');
  console.error(`❌ Email not configured. Missing: ${missing.join(', ')}. Verification and notification emails will not be sent.`);
}

/** Returns true if outbound email can be sent (same config sends to any recipient domain). */
export function isEmailConfigured() {
  if (EMAIL_PROVIDER === 'sendgrid') return sendGridReady;
  if (EMAIL_PROVIDER === 'smtp') return smtpTransport != null;
  return false;
}

/**
 * Safe status for health checks and ops. No secrets.
 * @returns {{ configured: boolean, provider: string|null, hint?: string }}
 */
export function getEmailConfigStatus() {
  const provider = EMAIL_PROVIDER === 'sendgrid' ? 'sendgrid' : EMAIL_PROVIDER === 'smtp' ? 'smtp' : null;
  const configured = isEmailConfigured();
  let hint;
  if (!configured && provider === 'smtp') hint = 'Set SMTP_HOST, SMTP_USER, SMTP_PASS (and optionally SMTP_PORT).';
  if (!configured && provider === 'sendgrid') hint = 'Set SENDGRID_API_KEY and optionally SENDGRID_FROM_EMAIL.';
  return { configured, provider, ...(hint && { hint }) };
}

// Get sender email based on provider
const getSenderEmail = () => {
  if (EMAIL_PROVIDER === 'sendgrid') {
    return process.env.SENDGRID_FROM_EMAIL || 'no-reply@apexfivecleaning.co.uk';
  }
  return process.env.SMTP_FROM_EMAIL || 'no-reply@apexfivecleaning.co.uk';
};

// Get sender name
const getSenderName = () => {
  return process.env.SMTP_FROM_NAME || 'Apex Five Cleaning';
};

// ─── BRAND CONFIG (used across all email templates) ─────────────────────────
const getBrandConfig = () => {
  const baseUrl = (process.env.CLIENT_URL || 'https://apexfivecleaning.co.uk').replace(/\/$/, '');
  return {
    logoUrl: process.env.COMPANY_LOGO_URL || `${baseUrl}/apex-five-logo.png`,
    companyName: process.env.COMPANY_NAME || 'Apex Five Cleaning',
    legalName: process.env.COMPANY_LEGAL_NAME || 'Apex Five Capital Ltd',
    tagline: process.env.COMPANY_TAGLINE || 'Professional Eco-Friendly Cleaning Services in Kent',
    website: process.env.COMPANY_WEBSITE || 'https://apexfivecleaning.co.uk',
    websiteDisplay: process.env.COMPANY_WEBSITE_DISPLAY || 'apexfivecleaning.co.uk',
    email: process.env.COMPANY_EMAIL || process.env.NOTIFY_EMAIL || 'hello@apexfivecleaning.co.uk',
    phone: process.env.COMPANY_PHONE || '+44 1622 621133',
    address: process.env.COMPANY_ADDRESS || 'Canterbury, Kent, UK',
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
        <a href="tel:${brand.phone.replace(/\s/g, '')}">${brand.phone}</a> &nbsp;|&nbsp;
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

export const getClientConfirmationTemplate = (firstName, quoteId) => {
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
              <p>Hi ${firstName},</p>
              <p>Thank you for requesting a quote from <strong>${brand.companyName}</strong>! We've received your quote request and our team will review it shortly.</p>
              <div style="margin: 20px 0;">
                <div class="label">Your Quote Reference</div>
                <div class="quote-id">${quoteId}</div>
              </div>
              <p><strong>What happens next:</strong></p>
              <ul>
                <li>Our team will review your requirements within 24 hours</li>
                <li>We'll calculate a personalized quote based on your property and service needs</li>
                <li>You'll receive an email with the quote and next steps</li>
              </ul>
              <div class="divider"></div>
              <p>If you have any urgent questions, feel free to contact us:</p>
              <p>📞 <a href="tel:${brand.phone.replace(/\s/g, '')}">${brand.phone}</a> &nbsp;|&nbsp; 📧 <a href="mailto:${brand.email}">${brand.email}</a><br><small>Monday–Friday, 8am–6pm</small></p>
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
  return {
    subject: `New Quote Request - ${quoteData.firstName} ${quoteData.lastName}`,
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
                <tr><td>Name</td><td>${quoteData.firstName} ${quoteData.lastName}</td></tr>
                <tr><td>Email</td><td><a href="mailto:${quoteData.email}">${quoteData.email}</a></td></tr>
                <tr><td>Phone</td><td><a href="tel:${quoteData.phone}">${quoteData.phone}</a></td></tr>
                <tr><td>Address</td><td>${quoteData.address}</td></tr>
                ${quoteData.postcode ? `<tr><td>Postcode</td><td>${quoteData.postcode}</td></tr>` : ''}
              </table>
              <div class="section-title">Property Details</div>
              <table class="admin-table">
                <tr><td>Property Type</td><td>${propertyMap[quoteData.propertyType] || quoteData.propertyType}</td></tr>
                <tr><td>Bedrooms</td><td>${quoteData.bedrooms}</td></tr>
                <tr><td>Bathrooms</td><td>${quoteData.bathrooms}</td></tr>
              </table>
              <div class="section-title">Service Requirements</div>
              <table class="admin-table">
                <tr><td>Service Type</td><td>${serviceMap[quoteData.serviceType] || quoteData.serviceType}</td></tr>
                ${quoteData.additionalNotes ? `<tr><td>Additional Notes</td><td>${quoteData.additionalNotes}</td></tr>` : ''}
              </table>
              <div class="section-title">Security</div>
              <table class="admin-table">
                <tr><td>CAPTCHA Score</td><td>${(quoteData.captchaScore * 100).toFixed(0)}%</td></tr>
                <tr><td>CAPTCHA Verified</td><td>${quoteData.captchaVerified ? '✓ Yes' : '✗ No'}</td></tr>
                <tr><td>IP Address</td><td><code>${quoteData.ipAddress}</code></td></tr>
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
  const template = getClientConfirmationTemplate(firstName, quoteId);
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();

  try {
    if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      const msg = {
        to: toEmail,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        subject: template.subject,
        html: template.html
      };
      
      await sgMail.send(msg);
      console.log(`✓ Client confirmation email sent to ${toEmail} via SendGrid`);
      return { success: true };
    } else if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      await smtpTransport.sendMail({
        to: toEmail,
        from: `"${senderName}" <${senderEmail}>`,
        subject: template.subject,
        html: template.html
      });
      console.log(`✓ Client confirmation email sent to ${toEmail} via SMTP`);
      return { success: true };
    } else {
      console.warn('⚠️ No email provider configured. Email not sent.');
      return { success: false, error: 'No email provider configured' };
    }
  } catch (error) {
    console.error('❌ Error sending client confirmation email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * QUOTE APPROVED - CREATE ACCOUNT INVITE
 * Sent when admin sets quote status to "converted"
 */
export const getQuoteApprovedTemplate = (firstName, quoteId) => {
  const brand = getBrandConfig();
  const clientUrl = (process.env.CLIENT_URL || brand.website).replace(/\/$/, '');
  const signupUrl = `${clientUrl}/?signup=1`;

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
              <p>Hi ${firstName},</p>
              <p>Great news! Your quote request has been approved by our team. We're ready to help you with your cleaning needs.</p>
              <p><strong>Create your free account</strong> to:</p>
              <ul>
                <li>View and manage your quote</li>
                <li>Book and reschedule cleaning services</li>
                <li>Track payments and history</li>
                <li>Request new quotes if things change</li>
              </ul>
              <div class="quote-ref">Quote ref: ${quoteId}</div>
              <div style="text-align: center;">
                <a href="${signupUrl}" class="cta-button">Create My Account</a>
              </div>
              <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
                Questions? Contact us:<br/>
                📧 <a href="mailto:${brand.email}">${brand.email}</a> &nbsp;|&nbsp; 📞 <a href="tel:${brand.phone.replace(/\s/g, '')}">${brand.phone}</a>
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
    console.error('❌ Error sending quote approved email:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendAdminNotificationEmail = async (quoteData) => {
  const template = getAdminNotificationTemplate(quoteData);
  const senderEmail = getSenderEmail();
  const senderName = getSenderName();
  const notifyEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'admin@apexfivecleaning.co.uk';

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
    console.error('❌ Error sending admin notification email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * EMAIL VERIFICATION TEMPLATES & FUNCTIONS
 */

export const getVerificationEmailTemplate = (firstName, verificationLink, expiryHours = 24) => {
  const brand = getBrandConfig();
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
              <p>Hello <strong>${firstName}</strong>,</p>
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
              <p style="font-size: 13px; color: #6b7280;">Need help? Contact us at <a href="mailto:${brand.email}">${brand.email}</a> or <a href="tel:${brand.phone.replace(/\s/g, '')}">${brand.phone}</a>.</p>
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
              <p>Hello <strong>${firstName}</strong>,</p>
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
              <p>Hello <strong>${firstName}</strong>,</p>
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
  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  const template = getVerificationEmailTemplate(firstName, verificationLink, 24);
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
      console.log(`✓ Verification email sent to ${toEmail} via SendGrid`);
      return { success: true };
    } else if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
      await smtpTransport.sendMail({
        to: toEmail,
        from: `"${senderName}" <${senderEmail}>`,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      console.log(`✓ Verification email sent to ${toEmail} via SMTP`);
      return { success: true };
    } else {
      console.error('❌ No email provider configured (set EMAIL_PROVIDER and SMTP_* or SENDGRID_API_KEY). Verification email not sent.');
      return { success: false, error: 'No email provider configured' };
    }
  } catch (error) {
    const detail = error.response || error.responseCode || error.code ? ` (${error.response || error.responseCode || error.code})` : '';
    console.error('❌ Error sending verification email:', error.message + detail);
    if (error.response) console.error('   SMTP response:', String(error.response).slice(0, 200));
    return { success: false, error: error.message };
  }
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
    console.error('❌ Error sending verification success email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send resend verification email
 */
export const sendResendVerificationEmail = async (toEmail, firstName, verificationToken) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
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
    console.error('❌ Error sending resend verification email:', error.message);
    return { success: false, error: error.message };
  }
}
