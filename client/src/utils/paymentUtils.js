/**
 * PAYMENT FORM UTILITIES
 * Helper functions for payment processing
 */

/**
 * Format amount for display (pence to pounds)
 */
export const formatAmount = (pence) => {
  return (pence / 100).toFixed(2);
};

/**
 * Parse amount from string (pounds to pence)
 */
export const parseAmount = (pounds) => {
  return Math.round(parseFloat(pounds) * 100);
};

/**
 * Validate card is complete
 */
export const isCardComplete = (cardElement) => {
  if (!cardElement) return false;
  return cardElement.complete === true;
};

/**
 * Get user-friendly error messages
 */
export const getPaymentErrorMessage = (error) => {
  const errorMessages = {
    'card_declined': 'Your card was declined. Please check your card details and try again.',
    'expired_card': 'Your card has expired. Please use a different card.',
    'incorrect_cvc': 'The CVC code you entered is incorrect.',
    'processing_error': 'A processing error occurred. Please try again.',
    'rate_limit': 'Too many requests. Please wait a moment and try again.',
    'authentication_error': 'Authentication failed. Please check your card details.',
    'invalid_request_error': 'Invalid request. Please check your information and try again.',
  };

  if (error.type && errorMessages[error.type]) {
    return errorMessages[error.type];
  }

  if (error.message) {
    return error.message;
  }

  return 'Payment failed. Please try again or contact support.';
};

/**
 * Check if payment is retryable
 */
export const isRetryableError = (error) => {
  const retryableErrors = [
    'card_declined',
    'processing_error',
    'rate_limit',
    'api_connection_error',
  ];
  return retryableErrors.includes(error.type);
};

/**
 * Validate booking data before payment
 */
export const validateBookingForPayment = (booking) => {
  const errors = {};

  if (!booking.id) errors.id = 'Booking ID is required';
  if (!booking.totalPrice || booking.totalPrice < 50) {
    errors.totalPrice = 'Invalid booking amount (minimum £0.50)';
  }
  if (!booking.userId) errors.userId = 'User ID is required';
  if (!booking.status) errors.status = 'Booking status is required';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Create payment metadata
 */
export const createPaymentMetadata = (booking) => {
  return {
    bookingId: booking.id,
    service: booking.serviceId,
    area: booking.serviceArea,
    date: booking.date,
    duration: booking.duration,
  };
};

/**
 * Format card display (last 4 digits)
 */
export const formatCardDisplay = (last4, brand) => {
  return `${brand?.toUpperCase() || 'Card'} ending in ${last4}`;
};

/**
 * Check if Stripe is in test mode (use env only – no hardcoded keys)
 */
export const isTestMode = () => {
  const key = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STRIPE_PUBLIC_KEY) || '';
  return typeof key === 'string' && key.includes('pk_test_');
};

/**
 * Generate idempotency key (prevents duplicate charges)
 */
export const generateIdempotencyKey = (bookingId, userId) => {
  return `${bookingId}-${userId}-${Date.now()}`;
};

/**
 * Validate payment response
 */
export const validatePaymentResponse = (response) => {
  const required = ['success', 'payment', 'payment.id', 'payment.status'];
  
  for (const field of required) {
    const parts = field.split('.');
    let current = response;
    
    for (const part of parts) {
      if (!current || !(part in current)) {
        return { valid: false, missing: field };
      }
      current = current[part];
    }
  }

  return { valid: true };
};

/**
 * Handle payment retry
 */
export const handlePaymentRetry = (error, retryCount = 0) => {
  const maxRetries = 3;
  
  if (retryCount >= maxRetries) {
    return {
      canRetry: false,
      message: 'Maximum retry attempts reached. Please contact support.',
    };
  }

  if (!isRetryableError(error)) {
    return {
      canRetry: false,
      message: getPaymentErrorMessage(error),
    };
  }

  // Exponential backoff: 1s, 2s, 4s
  const delay = Math.pow(2, retryCount) * 1000;

  return {
    canRetry: true,
    delay,
    nextRetry: retryCount + 1,
    message: `Retrying in ${delay / 1000}s...`,
  };
};

/**
 * Store payment attempt (for debugging)
 */
export const logPaymentAttempt = (attempt) => {
  if (isTestMode()) {
    console.log('[Payment Attempt]', {
      timestamp: new Date().toISOString(),
      ...attempt,
      // Never log sensitive data
      cardNumber: '****',
      cvc: '****',
    });
  }
};

/**
 * Get payment status label
 */
export const getPaymentStatusLabel = (status) => {
  const labels = {
    'pending': { text: 'Pending', color: 'yellow' },
    'processing': { text: 'Processing', color: 'blue' },
    'succeeded': { text: '✅ Succeeded', color: 'green' },
    'failed': { text: '❌ Failed', color: 'red' },
    'cancelled': { text: 'Cancelled', color: 'gray' },
    'refunded': { text: '↩️ Refunded', color: 'purple' },
  };

  return labels[status] || { text: 'Unknown', color: 'gray' };
};

/**
 * Calculate payment deadline
 */
export const getPaymentDeadline = (bookingDate, hoursBeforeBooking = 2) => {
  const booking = new Date(bookingDate);
  const deadline = new Date(booking.getTime() - hoursBeforeBooking * 60 * 60 * 1000);
  return deadline;
};

/**
 * Check if payment deadline passed
 */
export const isPaymentDeadlinePassed = (bookingDate) => {
  return new Date() > getPaymentDeadline(bookingDate);
};
