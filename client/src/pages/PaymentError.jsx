import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, ChevronDown } from 'lucide-react';

/**
 * PAYMENT ERROR PAGE
 * Displays when payment fails or encounters an error
 */
const PaymentError = () => {
  const [searchParams] = useSearchParams();
  const [expandedSection, setExpandedSection] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    const error = searchParams.get('error');
    const code = searchParams.get('code');
    const bookingId = searchParams.get('booking_id');

    // Map error codes to user-friendly messages
    const errorMap = {
      card_declined: {
        title: 'Card Declined',
        message: 'Your card was declined by your bank. Please try a different card or contact your bank.',
        solutions: [
          'Use a different debit or credit card',
          'Check that all card details are entered correctly',
          'Contact your bank to check for temporary restrictions',
          'Try using a different payment method',
        ],
      },
      expired_card: {
        title: 'Card Expired',
        message: 'The card you entered has expired.',
        solutions: [
          'Use a card with a future expiration date',
          'Check your card details carefully',
          'Contact your bank if the card should still be valid',
        ],
      },
      processing_error: {
        title: 'Processing Error',
        message: 'There was a temporary issue processing your payment.',
        solutions: [
          'Wait a few minutes and try again',
          'Check your internet connection',
          'Use a different payment method',
          'Contact support if the problem persists',
        ],
      },
      authentication_error: {
        title: '3D Secure Authentication Failed',
        message: 'Your card authentication was unsuccessful.',
        solutions: [
          'Try completing the authentication again',
          'Ensure your bank details are correct',
          'Check with your bank about authentication issues',
        ],
      },
      insufficient_funds: {
        title: 'Insufficient Funds',
        message: 'Your card does not have sufficient funds.',
        solutions: [
          'Ensure you have enough balance for the transaction',
          'Use a different card with available funds',
          'Contact your bank to check your balance',
        ],
      },
      generic_decline: {
        title: 'Payment Declined',
        message: 'Your payment could not be processed.',
        solutions: [
          'Try using a different card',
          'Check that all details are correct',
          'Wait a few minutes and try again',
          'Contact support for assistance',
        ],
      },
    };

    const details = errorMap[code] || errorMap.generic_decline;
    setErrorDetails({
      ...details,
      code,
      error,
      bookingId,
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4 py-20">
      <div className="w-full max-w-2xl">
        {/* Error Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-red-500 to-orange-600 p-8 text-center">
            <AlertCircle className="w-20 h-20 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              {errorDetails?.title || 'Payment Failed'}
            </h1>
            <p className="text-red-50">Your payment could not be processed</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Error Message */}
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-900 font-semibold mb-2">⚠️ {errorDetails?.title}</p>
              <p className="text-red-800">
                {errorDetails?.message}
              </p>
            </div>

            {/* Error Code (if available) */}
            {errorDetails?.code && (
              <div className="mb-6 p-3 bg-gray-100 rounded font-mono text-sm text-gray-600 break-all">
                Error Code: <span className="font-semibold">{errorDetails.code}</span>
              </div>
            )}

            {/* Solutions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">How to Fix This</h2>
              <div className="space-y-2">
                {errorDetails?.solutions.map((solution, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 pt-0.5">{solution}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Accordion */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-2">
                {[
                  {
                    question: 'Is my card information secure?',
                    answer:
                      'Yes, absolutely. All payment processing is handled by Stripe, a PCI Level 1 certified payment processor. Your card details are never stored on our servers.',
                  },
                  {
                    question: 'Will I be charged for failed attempts?',
                    answer:
                      'No. You will only be charged when a payment successfully completes. Failed payment attempts do not result in any charges to your account.',
                  },
                  {
                    question: 'How long can I retry my payment?',
                    answer:
                      'Your booking will be held for 24 hours while you complete payment. After that, you\'ll need to create a new booking.',
                  },
                  {
                    question: 'Why was my card declined?',
                    answer:
                      'Common reasons include: insufficient funds, card expired, incorrect details, bank restrictions, or security concerns. Contact your bank for specific details.',
                  },
                ]?.map((item, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                      className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
                    >
                      <span className="font-semibold text-gray-900">{item.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${
                          expandedSection === idx ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSection === idx && (
                      <div className="p-4 bg-gray-50 border-t border-gray-200 text-gray-700">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link
                to={errorDetails?.bookingId ? `/booking/${errorDetails.bookingId}/payment` : '/quote'}
                className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition text-center"
              >
                Try Again
              </Link>
              <Link
                to="/services"
                className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
              >
                Browse Services
              </Link>
            </div>

            {/* Support Section */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">Still Having Issues?</h3>
              <p className="text-blue-800 text-sm mb-4">
                Our support team is here to help. Please contact us with your error code for faster assistance.
              </p>
              <div className="space-y-2 text-sm">
                <div>
                  📧{' '}
                  <a href="mailto:support@apexfivecleaning.co.uk" className="text-blue-600 hover:underline font-semibold">
                    support@apexfivecleaning.co.uk
                  </a>
                </div>
                <div>
                  📞{' '}
                  <a href="tel:+447377280558" className="text-blue-600 hover:underline font-semibold">
                    +44 7377 280558
                  </a>
                </div>
                <div>
                  🕐 Monday-Friday, 8am-6pm
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-4">
                Your security is our priority
              </p>
              <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-600">
                <div>
                  <div className="text-xl mb-1">🔒</div>
                  <p>PCI Level 1</p>
                </div>
                <div>
                  <div className="text-xl mb-1">🛡️</div>
                  <p>SSL Encrypted</p>
                </div>
                <div>
                  <div className="text-xl mb-1">✓</div>
                  <p>Stripe Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm mb-4">
            Need help with something else?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/faq" className="text-emerald-600 hover:underline font-semibold text-sm">
              View FAQ
            </Link>
            <span className="text-gray-400">•</span>
            <Link to="/contact" className="text-emerald-600 hover:underline font-semibold text-sm">
              Contact Support
            </Link>
            <span className="text-gray-400">•</span>
            <Link to="/bookings" className="text-emerald-600 hover:underline font-semibold text-sm">
              My Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentError;
