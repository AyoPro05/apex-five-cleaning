import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Download, AlertCircle } from 'lucide-react';

/**
 * PAYMENT SUCCESS PAGE
 * Displays after successful payment processing
 */
const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const paymentId = searchParams.get('payment_id');
        const bookingId = searchParams.get('booking_id');

        if (!paymentId || !bookingId) {
          throw new Error('Missing payment or booking information');
        }

        // Fetch payment and booking details
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch payment details');

        const data = await response.json();
        setPaymentDetails(data);
      } catch (err) {
        console.error('Error fetching payment details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full" />
          </div>
          <p className="text-gray-600">Processing your payment confirmation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Details</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/bookings"
            className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition"
          >
            View My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4 py-20">
      <div className="w-full max-w-2xl">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-center">
            <CheckCircle className="w-20 h-20 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-emerald-50">Your booking has been confirmed</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Confirmation Message */}
            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-900 font-semibold mb-2">
                ✓ Your payment has been processed successfully
              </p>
              <p className="text-emerald-800 text-sm">
                A confirmation email with your receipt and booking details has been sent to your email address.
              </p>
            </div>

            {/* Payment Details */}
            {paymentDetails && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {paymentDetails.id}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      £{(paymentDetails.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold text-gray-900">
                      {paymentDetails.cardBrand} ending in {paymentDetails.cardLast4}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="text-gray-900">
                      {new Date(paymentDetails.processedAt).toLocaleString('en-GB')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-sm">
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Details */}
            {paymentDetails?.booking && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Confirmed</h2>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Service</p>
                    <p className="font-semibold text-gray-900">
                      {paymentDetails.booking.serviceName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Scheduled Date</p>
                    <p className="font-semibold text-gray-900 text-lg">
                      📅 {new Date(paymentDetails.booking.date).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Time</p>
                    <p className="font-semibold text-gray-900">🕐 {paymentDetails.booking.time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="font-semibold text-gray-900">
                      📍 {paymentDetails.booking.serviceArea}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">What's Next?</h3>
              <ol className="space-y-2 text-blue-800 text-sm">
                <li>
                  <span className="font-semibold">1. Check your email</span> for confirmation and receipt
                </li>
                <li>
                  <span className="font-semibold">2. Prepare your home</span> by removing items from surfaces
                </li>
                <li>
                  <span className="font-semibold">3. Ensure access</span> or provide key instructions
                </li>
                <li>
                  <span className="font-semibold">4. Await confirmation</span> – we'll send a reminder 24 hours before
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 flex-1 border border-emerald-600 text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition"
              >
                <Download className="w-5 h-5" />
                Print Receipt
              </button>
              <Link
                to="/bookings"
                className="flex items-center justify-center flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                View All Bookings
              </Link>
            </div>

            {/* Contact Info */}
            <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
              <p className="mb-2">Questions about your booking?</p>
              <p>
                📧 <a href="mailto:support@apexfivecleaning.co.uk" className="text-emerald-600 hover:underline">
                  support@apexfivecleaning.co.uk
                </a>
                {' '}|{' '}
                📞 <a href="tel:+441234567890" className="text-emerald-600 hover:underline">
                  +44 1234 567890
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm text-gray-600">
          <div>
            <div className="text-2xl mb-2">🔒</div>
            <p>Secure Payment</p>
          </div>
          <div>
            <div className="text-2xl mb-2">✓</div>
            <p>PCI Compliant</p>
          </div>
          <div>
            <div className="text-2xl mb-2">📧</div>
            <p>Confirmation Sent</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
