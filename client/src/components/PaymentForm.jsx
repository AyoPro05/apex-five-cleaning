/**
 * PAYMENT FORM COMPONENT
 * Secure payment processing with Stripe.js
 * 
 * Features:
 * - PCI DSS compliant (card data never in backend)
 * - Stripe Elements for secure card input
 * - Real-time validation
 * - Error handling with user guidance
 * - Loading states for UX feedback
 * - Accessibility (WCAG 2.1 AA)
 * - Mobile responsive
 */

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';

// Initialize Stripe (use your public key)
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_example'
);

/**
 * Payment Form Component
 * Handles card input and payment submission
 */
function PaymentFormContent({ bookingId, bookingAmount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  const { token } = useAuth();

  /**
   * Initialize payment intent
   */
  useEffect(() => {
    if (!bookingId || !token) return;

    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call backend to create payment intent
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bookingId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to initialize payment');
        }

        setClientSecret(data.clientSecret);
        setPaymentId(data.paymentId);
      } catch (err) {
        setError(err.message);
        onError?.(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [bookingId, token, onError]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              // Add billing details if available
            },
          },
        });

      if (stripeError) {
        setError(stripeError.message);
        onError?.(stripeError.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        const confirmResponse = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            paymentId,
          }),
        });

        const confirmData = await confirmResponse.json();

        if (!confirmResponse.ok) {
          throw new Error(confirmData.message || 'Failed to confirm payment');
        }

        // Payment successful
        onSuccess?.(confirmData.payment);
      } else {
        setError(`Payment ${paymentIntent.status}. Please contact support.`);
      }
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle card element change
   */
  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Amount Display */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600 mb-1">Total Amount</p>
        <p className="text-2xl font-bold text-gray-900">
          £{(bookingAmount / 100).toFixed(2)}
        </p>
      </div>

      {/* Card Element */}
      <div className="space-y-2">
        <label
          htmlFor="card-element"
          className="block text-sm font-medium text-gray-700"
        >
          Card Details
        </label>
        <div
          id="card-element"
          className="p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <CardElement
            onChange={handleCardChange}
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#fa755a',
                },
              },
              hidePostalCode: false,
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-sm font-medium text-red-800">
            Payment Error
          </p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Security Badge */}
      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414L10 3.586l4.707 4.707a1 1 0 01-1.414 1.414L11 6.414V15a1 1 0 11-2 0V6.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span>
          Your card information is secure and encrypted. We never store your full card number.
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !elements || loading || !cardComplete || !clientSecret}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
          loading || !cardComplete || !clientSecret
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-teal-600 hover:bg-teal-700 active:scale-95'
        }`}
        aria-busy={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing Payment...
          </span>
        ) : (
          `Pay £${(bookingAmount / 100).toFixed(2)}`
        )}
      </button>

      {/* Payment Info */}
      <p className="text-xs text-gray-500 text-center">
        By clicking "Pay", you agree to our terms. This charge will appear as "APEX FIVE CLEANING" on your statement.
      </p>
    </form>
  );
}

/**
 * Wrapper Component with Stripe Provider
 */
export default function PaymentForm(props) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}
