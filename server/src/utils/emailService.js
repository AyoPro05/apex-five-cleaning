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
