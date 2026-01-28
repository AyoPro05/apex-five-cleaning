import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp';

// Initialize SendGrid if using SendGrid
if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
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

export const getClientConfirmationTemplate = (firstName, quoteId) => {
  return {
    subject: 'Quote Request Received - Apex Five Cleaning',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #14b8a6; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: 600; color: #14b8a6; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .value { margin-top: 5px; color: #555; }
            .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
            .cta-button { display: inline-block; background-color: #14b8a6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
            .quote-id { background-color: white; padding: 10px; border-radius: 4px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Quote Request Received</h1>
            </div>
            
            <div class="content">
              <p>Hi ${firstName},</p>
              
              <p>Thank you for requesting a quote from Apex Five Cleaning! We've received your quote request and our team will review it shortly.</p>
              
              <div class="section">
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
              
              <p>If you have any urgent questions, feel free to contact us directly:</p>
              <p>
                <strong>Phone:</strong> +44 1234 567890<br>
                <strong>Email:</strong> hello@apexfivecleaning.co.uk<br>
                <strong>Hours:</strong> Monday-Friday, 8am-6pm
              </p>
              
              <div style="text-align: center;">
                <a href="https://apexfivecleaning.co.uk" class="cta-button">View Our Services</a>
              </div>
            </div>
            
            <div class="footer">
              <p>Apex Five Cleaning | Professional Eco-Friendly Cleaning Services<br>
              © 2024 Apex Five Cleaning. All rights reserved.</p>
            </div>
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
    'bungalow': 'Bungalow'
  };

  return {
    subject: `New Quote Request - ${quoteData.firstName} ${quoteData.lastName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1e293b; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 20px; }
            .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            table td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            table td:first-child { font-weight: 600; width: 30%; background-color: white; }
            .section-title { font-weight: 700; color: #1e293b; margin-top: 20px; margin-bottom: 10px; background-color: #e0f2fe; padding: 8px 12px; border-radius: 4px; border-left: 4px solid #0284c7; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .cta-button { display: inline-block; background-color: #0284c7; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Quote Request Received</h1>
            </div>
            
            <div class="content">
              <p><strong>A new quote request has been submitted. Details below:</strong></p>
              
              <div class="section-title">Customer Information</div>
              <table>
                <tr>
                  <td>Name</td>
                  <td>${quoteData.firstName} ${quoteData.lastName}</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td><a href="mailto:${quoteData.email}">${quoteData.email}</a></td>
                </tr>
                <tr>
                  <td>Phone</td>
                  <td><a href="tel:${quoteData.phone}">${quoteData.phone}</a></td>
                </tr>
                <tr>
                  <td>Address</td>
                  <td>${quoteData.address}</td>
                </tr>
              </table>
              
              <div class="section-title">Property Details</div>
              <table>
                <tr>
                  <td>Property Type</td>
                  <td>${propertyMap[quoteData.propertyType] || quoteData.propertyType}</td>
                </tr>
                <tr>
                  <td>Bedrooms</td>
                  <td>${quoteData.bedrooms}</td>
                </tr>
                <tr>
                  <td>Bathrooms</td>
                  <td>${quoteData.bathrooms}</td>
                </tr>
              </table>
              
              <div class="section-title">Service Requirements</div>
              <table>
                <tr>
                  <td>Service Type</td>
                  <td>${serviceMap[quoteData.serviceType] || quoteData.serviceType}</td>
                </tr>
                ${quoteData.additionalNotes ? `
                <tr>
                  <td>Additional Notes</td>
                  <td>${quoteData.additionalNotes}</td>
                </tr>
                ` : ''}
              </table>
              
              <div class="section-title">Security</div>
              <table>
                <tr>
                  <td>CAPTCHA Score</td>
                  <td>${(quoteData.captchaScore * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                  <td>CAPTCHA Verified</td>
                  <td>${quoteData.captchaVerified ? '✓ Yes' : '✗ No'}</td>
                </tr>
                <tr>
                  <td>IP Address</td>
                  <td><code>${quoteData.ipAddress}</code></td>
                </tr>
              </table>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://apexfivecleaning.co.uk/admin/quotes/${quoteData._id}" class="cta-button">View in Admin Dashboard</a>
              </div>
            </div>
            
            <div class="footer">
              <p>⏰ Submitted on ${new Date(quoteData.createdAt).toLocaleString('en-GB')}<br>
              Apex Five Cleaning Admin System</p>
            </div>
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
 * Apex Five Cleaning - Email verification with company branding
 */

export const getVerificationEmailTemplate = (firstName, verificationLink, expiryHours = 24) => {
  return {
    subject: '🔐 Verify Your Email - Apex Five Cleaning',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
            .greeting { font-size: 16px; margin-bottom: 20px; }
            .verification-box { background: #f0f7ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; text-align: center; }
            .btn:hover { background: #764ba2; opacity: 0.9; }
            .info-section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 4px; font-size: 13px; }
            .info-section h3 { margin-top: 0; color: #333; }
            .info-section ul { margin: 10px 0; padding-left: 20px; }
            .info-section li { margin: 5px 0; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; margin-top: 30px; }
            .security-badge { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 12px; margin: 15px 0; border-radius: 4px; }
            .security-badge p { margin: 5px 0; font-size: 13px; color: #2e7d32; }
            .expiry-notice { background: #fff3e0; border-left: 4px solid #ff9800; padding: 12px; margin: 15px 0; border-radius: 4px; }
            .expiry-notice p { margin: 5px 0; font-size: 13px; color: #e65100; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Apex Five Cleaning</h1>
              <p>Professional Cleaning Services - Kent, UK</p>
            </div>
            
            <div class="content">
              <div class="greeting">
                <p>Hello <strong>${firstName}</strong>,</p>
                <p>Thank you for registering with Apex Five Cleaning! We're excited to help you with all your cleaning needs.</p>
              </div>

              <div class="verification-box">
                <p><strong>To get started, please verify your email address:</strong></p>
                <a href="${verificationLink}" class="btn">✓ Verify Email Address</a>
              </div>

              <div class="expiry-notice">
                <p>⏰ <strong>Important:</strong> This link will expire in <strong>${expiryHours} hours</strong> for security reasons.</p>
              </div>

              <div class="info-section">
                <h3>What happens after verification?</h3>
                <ul>
                  <li>✅ Your account will be fully activated</li>
                  <li>📊 Access your member dashboard</li>
                  <li>🧹 Book your first cleaning service</li>
                  <li>📧 Receive booking confirmations and reminders</li>
                  <li>🎯 Manage your cleaning preferences</li>
                </ul>
              </div>

              <div class="security-badge">
                <p>🔒 <strong>Security Notice:</strong></p>
                <p>Apex Five Cleaning will never ask for your password via email. If you didn't create this account or believe this is an error, please contact our support team immediately.</p>
              </div>

              <div class="info-section">
                <h3>Need Help?</h3>
                <p>If you're having trouble verifying your email:</p>
                <ul>
                  <li>📧 support@apexfivecleaning.co.uk</li>
                  <li>☎️ 01227 XXXXXX</li>
                  <li>🌐 www.apexfivecleaning.co.uk</li>
                </ul>
              </div>
            </div>

            <div class="footer">
              <p><strong>Apex Five Cleaning Ltd</strong></p>
              <p>Professional Cleaning Services | Canterbury, Kent, UK</p>
              <p style="margin: 10px 0 0 0;">© 2026 Apex Five Cleaning. All rights reserved.</p>
              <p style="margin: 5px 0; color: #ccc; font-size: 11px;">This email was sent because you registered at apexfivecleaning.co.uk</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Verify Your Email - Apex Five Cleaning\n\nHello ${firstName},\n\nThank you for registering! Please verify your email by visiting:\n\n${verificationLink}\n\nThis link expires in ${expiryHours} hours.\n\nIf you didn't create this account, please ignore this email.\n\nApex Five Cleaning Ltd\nProfessional Cleaning Services | Kent, UK`
  };
};

export const getVerificationSuccessTemplate = (firstName) => {
  return {
    subject: '✅ Email Verified - Welcome to Apex Five Cleaning!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .success-icon { font-size: 48px; margin: 10px 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
            .action-box { background: #f0f7ff; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .action-box h3 { margin-top: 0; color: #333; }
            .action-box ul { margin: 10px 0; padding-left: 20px; }
            .action-box li { margin: 8px 0; }
            .btn { display: inline-block; background: #2196f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
            .btn:hover { background: #0b7dda; }
            .next-steps { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .next-steps h3 { margin-top: 0; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Email Verified!</h1>
            </div>
            
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${firstName}</strong>,</p>
              <p>Congratulations! Your email has been successfully verified. Your Apex Five Cleaning account is now fully activated and ready to use.</p>

              <div class="action-box">
                <h3>You can now:</h3>
                <ul>
                  <li>✓ Access your member dashboard</li>
                  <li>✓ Book cleaning services</li>
                  <li>✓ Manage your profile and preferences</li>
                  <li>✓ Receive booking updates and reminders</li>
                  <li>✓ View service history and ratings</li>
                  <li>✓ Manage payment methods</li>
                </ul>
                <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Go to Your Dashboard</a>
              </div>

              <div class="next-steps">
                <h3>Next Steps:</h3>
                <p>Ready to book your first cleaning? Here's what to expect:</p>
                <ol>
                  <li>Browse our cleaning services (Residential, End of Tenancy, Airbnb)</li>
                  <li>Select your preferred date and time</li>
                  <li>Choose your service area from our coverage zones</li>
                  <li>Add any special requirements or notes</li>
                  <li>Complete payment securely</li>
                  <li>Receive confirmation and updates</li>
                </ol>
              </div>

              <p style="margin-top: 30px; font-size: 14px;">Thank you for choosing Apex Five Cleaning. We look forward to serving you with professional and reliable cleaning services!</p>
            </div>

            <div class="footer">
              <p><strong>Apex Five Cleaning Ltd</strong></p>
              <p>Professional Cleaning Services | Canterbury, Kent, UK</p>
              <p style="margin: 10px 0 0 0;">© 2026 All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Email Verified - Welcome to Apex Five Cleaning!\n\nHello ${firstName},\n\nYour email has been successfully verified!\n\nYou can now access your dashboard at:\n${process.env.CLIENT_URL}/dashboard\n\nThank you for choosing Apex Five Cleaning.\n\nApex Five Cleaning Ltd\nProfessional Cleaning Services | Kent, UK`
  };
};

export const getResendVerificationTemplate = (firstName, verificationLink, expiryHours = 24) => {
  return {
    subject: '📧 New Verification Link - Apex Five Cleaning',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
            .verification-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .btn { display: inline-block; background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
            .btn:hover { background: #f57c00; }
            .info-section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 4px; font-size: 13px; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 New Verification Link</h1>
            </div>
            
            <div class="content">
              <p>Hello <strong>${firstName}</strong>,</p>
              <p>We've generated a new email verification link for you:</p>
              
              <div class="verification-box">
                <a href="${verificationLink}" class="btn">✓ Verify Email</a>
                <p style="margin-top: 15px; font-size: 13px; color: #ff6f00;">This link expires in <strong>${expiryHours} hours</strong>.</p>
              </div>

              <div class="info-section">
                <p>If you're still having trouble, please try:</p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Checking your spam/junk folder</li>
                  <li>Copying the link into your browser manually</li>
                  <li>Contacting our support team</li>
                </ul>
              </div>

              <p style="margin-top: 30px; font-size: 14px;">Need immediate assistance? Contact us at support@apexfivecleaning.co.uk</p>
            </div>

            <div class="footer">
              <p><strong>Apex Five Cleaning Ltd</strong></p>
              <p>© 2026 All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `New Verification Link - Apex Five Cleaning\n\nHello ${firstName},\n\nVerify your email using this link:\n${verificationLink}\n\nLink expires in ${expiryHours} hours.\n\nApex Five Cleaning Ltd`
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
      console.warn('⚠️ No email provider configured. Verification email not sent.');
      return { success: false, error: 'No email provider configured' };
    }
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
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
