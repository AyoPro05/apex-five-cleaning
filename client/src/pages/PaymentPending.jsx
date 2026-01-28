import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Clock, AlertCircle } from 'lucide-react';

/**
 * PAYMENT PENDING PAGE
 * Displays when payment is processing or awaiting confirmation
 */
const PaymentPending = () => {
  const [searchParams] = useSearchParams();
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [bookingId] = useState(searchParams.get('booking_id'));
  const [paymentId] = useState(searchParams.get('payment_id'));

  useEffect(() => {
    // Calculate time remaining (24 hours from now)
    const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const updateTimer = () => {
      const now = new Date();
      const difference = expiryTime - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4 py-20">
      <div className="w-full max-w-2xl">
        {/* Pending Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                  <Clock className="w-10 h-10 text-amber-600" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Pending</h1>
            <p className="text-amber-50">We're processing your payment</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Status Message */}
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-900 font-semibold mb-2">⏳ Please Wait...</p>
              <p className="text-amber-800">
                Your payment is being processed. This typically takes less than 30 seconds. Please don't close this
                window or refresh the page.
              </p>
            </div>

            {/* Status Timeline */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Status</h2>
              <div className="space-y-4">
                {[
                  { status: 'Initiated', done: true },
                  { status: 'Processing', done: false, current: true },
                  { status: 'Confirmation', done: false },
                  { status: 'Complete', done: false },
                ]?.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        item.done
                          ? 'bg-emerald-500'
                          : item.current
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-gray-300'
                      }`}
                    >
                      {item.done ? '✓' : item.current ? '…' : '○'}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`font-semibold ${item.done || item.current ? 'text-gray-900' : 'text-gray-500'}`}>
                        {item.status}
                      </p>
                      {item.current && (
                        <p className="text-sm text-amber-700 mt-1">Currently being processed</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Details */}
            {bookingId && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your Booking</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Booking Reference:</span>
                    <span className="font-mono font-semibold text-gray-900">{bookingId}</span>
                  </div>
                  {paymentId && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Payment Reference:</span>
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {paymentId.substring(0, 20)}...
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold text-sm animate-pulse">
                      Processing
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Important Info */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Important
              </h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>✓ Do not refresh or close this page</li>
                <li>✓ Do not navigate away during processing</li>
                <li>✓ If this takes longer than 2 minutes, contact support</li>
                <li>✓ You will receive an email confirmation when complete</li>
              </ul>
            </div>

            {/* Countdown Timer */}
            {timeRemaining && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-2">Booking holds for</p>
                <p className="text-3xl font-bold text-gray-900">{timeRemaining}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Check Status
              </button>
              <Link
                to="/bookings"
                className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition text-center"
              >
                View Bookings
              </Link>
            </div>

            {/* Support */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">Still Waiting?</h3>
              <p className="text-red-800 text-sm mb-3">
                If your payment is still processing after 2 minutes, please contact support immediately.
              </p>
              <a
                href="tel:+441234567890"
                className="inline-block bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition"
              >
                📞 Call Support Now
              </a>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">FAQ</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">How long does payment processing take?</h3>
              <p className="text-gray-600">
                Typically less than 30 seconds. If it takes longer than 2 minutes, please contact support.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Will I be charged multiple times?</h3>
              <p className="text-gray-600">
                No. Our system uses idempotency keys to prevent duplicate charges, even if the page is refreshed.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">What if I close the browser?</h3>
              <p className="text-gray-600">
                If your payment succeeds before closing, you'll still be charged. You'll receive a confirmation email
                within minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPending;
