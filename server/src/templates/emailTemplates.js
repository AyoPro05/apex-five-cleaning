/**
 * EMAIL TEMPLATES
 * Professional HTML email templates
 */

/**
 * Payment Receipt Email Template
 */
export const paymentReceiptTemplate = (payment, booking) => {
  const amount = (payment.amount / 100).toFixed(2);
  const processedDate = new Date(payment.processedAt).toLocaleDateString('en-GB');

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Payment Receipt</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">Your payment has been processed</p>
      </div>

      <!-- Content -->
      <div style="padding: 40px 20px; background: #f8fafc;">
        <!-- Greeting -->
        <p style="margin: 0 0 20px 0; font-size: 16px;">
          Thank you for your payment! 🎉
        </p>

        <!-- Receipt Details -->
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 20px 0;">
          <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1e293b;">Receipt Details</h2>

          <!-- Payment Info -->
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b;">Transaction ID:</span>
              <span style="font-weight: 600; font-family: monospace;">${payment.id}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b;">Date:</span>
              <span style="font-weight: 600;">${processedDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b;">Card:</span>
              <span style="font-weight: 600;">${payment.cardBrand} ending in ${payment.cardLast4}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0;">
              <span style="color: #64748b;">Status:</span>
              <span style="font-weight: 600; color: #059669;">✓ Succeeded</span>
            </div>
          </div>

          <!-- Amount -->
          <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">Amount Paid</p>
            <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 700; color: #059669;">£${amount}</p>
          </div>

          <!-- Booking Details -->
          ${booking ? `
            <h3 style="margin: 20px 0 10px 0; font-size: 16px; font-weight: 600; color: #1e293b;">Booking Details</h3>
            <div style="background: #f1f5f9; border-radius: 6px; padding: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748b;">Service:</span>
                <span style="font-weight: 600;">${booking.serviceId}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748b;">Date:</span>
                <span style="font-weight: 600;">${new Date(booking.date).toLocaleDateString('en-GB')}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Location:</span>
                <span style="font-weight: 600;">${booking.serviceArea}</span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Important Info -->
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>What's Next?</strong><br/>
            Your booking is confirmed. You'll receive a confirmation email shortly with all the details and instructions.
          </p>
        </div>

        <!-- Action Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/bookings" style="background: #14b8a6; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            View Your Bookings
          </a>
        </div>

        <!-- FAQ -->
        <div style="background: #f1f5f9; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Need Help?</h3>
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            If you have any questions about your payment, please don't hesitate to contact us:
          </p>
          <p style="margin: 8px 0 0 0; font-size: 13px;">
            📧 <a href="mailto:support@apexfivecleaning.co.uk" style="color: #14b8a6; text-decoration: none;">support@apexfivecleaning.co.uk</a><br/>
            📞 <a href="tel:+441234567890" style="color: #14b8a6; text-decoration: none;">+44 1234 567890</a>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #1e293b; color: #cbd5e1; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0 0 8px 0;">
          © 2026 Apex Five Cleaning. All rights reserved.
        </p>
        <p style="margin: 0; opacity: 0.7;">
          This is an automated email. Please do not reply directly to this message.
        </p>
      </div>
    </div>
  `;
};

/**
 * Booking Confirmation Email Template
 */
export const bookingConfirmationTemplate = (booking, payment) => {
  const bookingDate = new Date(booking.date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 600;">✓ Booking Confirmed</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">Your cleaning appointment is scheduled</p>
      </div>

      <!-- Content -->
      <div style="padding: 40px 20px; background: #f8fafc;">
        <p style="margin: 0 0 20px 0; font-size: 16px;">
          Great news! Your booking has been confirmed and your payment has been received.
        </p>

        <!-- Main Booking Card -->
        <div style="background: white; border: 2px solid #14b8a6; border-radius: 8px; padding: 24px; margin: 20px 0;">
          <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #14b8a6;">
            📅 ${bookingDate}
          </h2>

          <div style="background: #f0fdf4; border-left: 4px solid #14b8a6; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
            <div style="margin-bottom: 12px;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Time</p>
              <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 16px;">${booking.time}</p>
            </div>
            <div style="margin-bottom: 12px;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Duration</p>
              <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 16px;">${booking.duration} hour${booking.duration > 1 ? 's' : ''}</p>
            </div>
            <div>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Location</p>
              <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 16px;">${booking.serviceArea}</p>
            </div>
          </div>

          <!-- Service Details -->
          <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Service Details</h3>
            <p style="margin: 0; font-size: 14px;">
              <strong>${booking.serviceName || booking.serviceId}</strong><br/>
              ${booking.notes ? `<span style="color: #64748b; font-size: 13px;">${booking.notes}</span>` : ''}
            </p>
          </div>

          <!-- Payment Summary -->
          ${payment ? `
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #64748b;">Amount Paid:</span>
                <span style="font-weight: 600;">£${(payment.amount / 100).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Reference:</span>
                <span style="font-weight: 600; font-family: monospace; font-size: 12px;">${payment.id.substring(0, 20)}...</span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Before Your Appointment -->
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 20px 0;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📋 Before Your Appointment</h3>
          
          <ol style="margin: 0; padding-left: 20px; color: #475569;">
            <li style="margin-bottom: 12px;">
              <strong>Prepare your home</strong><br/>
              <span style="font-size: 14px; color: #64748b;">Remove valuable items from surfaces and secure pets</span>
            </li>
            <li style="margin-bottom: 12px;">
              <strong>Provide access</strong><br/>
              <span style="font-size: 14px; color: #64748b;">Ensure someone is home or provide key access instructions</span>
            </li>
            <li style="margin-bottom: 12px;">
              <strong>Special requests</strong><br/>
              <span style="font-size: 14px; color: #64748b;">Add any last-minute notes by logging into your account</span>
            </li>
            <li>
              <strong>Confirmation</strong><br/>
              <span style="font-size: 14px; color: #64748b;">You'll receive a reminder 24 hours before your booking</span>
            </li>
          </ol>
        </div>

        <!-- Action Buttons -->
        <div style="text-align: center; margin: 30px 0; display: flex; gap: 12px; justify-content: center;">
          <a href="${process.env.CLIENT_URL}/bookings/${booking.id}" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            View Booking
          </a>
          <a href="${process.env.CLIENT_URL}/account" style="background: #e2e8f0; color: #1e293b; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            My Account
          </a>
        </div>

        <!-- Support -->
        <div style="background: #f1f5f9; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            <strong>Need to reschedule or cancel?</strong><br/>
            You can manage your booking from your account or contact us up to 48 hours before your appointment.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #1e293b; color: #cbd5e1; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0 0 8px 0;">
          Apex Five Cleaning | Professional Home Cleaning Services
        </p>
        <p style="margin: 0 0 8px 0;">
          📧 support@apexfivecleaning.co.uk | 📞 +44 1234 567890
        </p>
        <p style="margin: 0; opacity: 0.7;">
          © 2026 Apex Five Cleaning. All rights reserved.
        </p>
      </div>
    </div>
  `;
};

/**
 * Refund Notification Email Template
 */
export const refundNotificationTemplate = (payment, booking, reason) => {
  const refundAmount = (payment.refundAmount / 100).toFixed(2);
  const processedDate = new Date(payment.refundProcessedAt).toLocaleDateString('en-GB');

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Refund Processed</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">Your refund has been initiated</p>
      </div>

      <!-- Content -->
      <div style="padding: 40px 20px; background: #f8fafc;">
        <p style="margin: 0 0 20px 0; font-size: 16px;">
          We've processed a refund for your booking cancellation.
        </p>

        <!-- Refund Details -->
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 20px 0;">
          <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1e293b;">Refund Details</h2>

          <div style="background: #f3e8ff; border: 2px solid #8b5cf6; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">Refund Amount</p>
            <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 700; color: #7c3aed;">£${refundAmount}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b;">Original Transaction:</span>
              <span style="font-weight: 600; font-family: monospace; font-size: 12px;">${payment.id.substring(0, 20)}...</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b;">Refund Processed:</span>
              <span style="font-weight: 600;">${processedDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b;">Card:</span>
              <span style="font-weight: 600;">${payment.cardBrand} ending in ${payment.cardLast4}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0;">
              <span style="color: #64748b;">Reason:</span>
              <span style="font-weight: 600;">${reason || 'Booking Cancelled'}</span>
            </div>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Processing Time:</strong> Refunds typically appear in your account within 3-5 business days, depending on your bank.
            </p>
          </div>
        </div>

        <!-- Cancelled Booking Info -->
        ${booking ? `
          <div style="background: #f1f5f9; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Cancelled Booking</h3>
            <div style="font-size: 14px;">
              <p style="margin: 0 0 8px 0;">
                <strong>Service:</strong> ${booking.serviceName || booking.serviceId}
              </p>
              <p style="margin: 0 0 8px 0;">
                <strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-GB')}
              </p>
              <p style="margin: 0;">
                <strong>Location:</strong> ${booking.serviceArea}
              </p>
            </div>
          </div>
        ` : ''}

        <!-- Rebooking Option -->
        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #166534;">
            <strong>Want to reschedule?</strong><br/>
            No problem! You can book another appointment anytime by visiting your account.
          </p>
        </div>

        <!-- Action Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/services" style="background: #14b8a6; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Book Again
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #1e293b; color: #cbd5e1; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0 0 8px 0;">
          © 2026 Apex Five Cleaning. All rights reserved.
        </p>
        <p style="margin: 0; opacity: 0.7;">
          This is an automated email. Please do not reply directly to this message.
        </p>
      </div>
    </div>
  `;
};

export default {
  paymentReceiptTemplate,
  bookingConfirmationTemplate,
  refundNotificationTemplate,
};
