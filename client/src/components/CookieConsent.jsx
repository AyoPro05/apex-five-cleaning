import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Settings2, X } from 'lucide-react';
import { useCookieConsent } from '../context/CookieConsentContext';

export default function CookieConsent() {
  const {
    showBanner,
    showPreferences,
    setShowPreferences,
    consent,
    acceptAll,
    rejectNonEssential,
    savePreferences,
  } = useCookieConsent();

  const [analytics, setAnalytics] = useState(consent.analytics);
  const [marketing, setMarketing] = useState(consent.marketing);

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 pointer-events-none"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="max-w-3xl mx-auto pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Cookies on Apex Five Cleaning</h2>
              <p className="text-sm text-gray-600 mt-1">
                We use essential cookies to run the site and optional cookies to understand how visitors
                find us across Kent, London, and Essex — and to improve quotes and service. You can change
                your mind anytime via our{' '}
                <Link to="/cookie-policy" className="text-teal-600 hover:underline">
                  cookie policy
                </Link>
                .
              </p>
            </div>
            {!showPreferences && (
              <button
                type="button"
                onClick={rejectNonEssential}
                className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
                aria-label="Reject non-essential cookies"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {showPreferences && (
            <div className="space-y-3 mb-4 border-t border-gray-100 pt-4">
              <label className="flex items-start gap-3 opacity-70">
                <input type="checkbox" checked disabled className="mt-1 rounded border-gray-300" />
                <span>
                  <span className="font-medium text-gray-900 text-sm">Essential</span>
                  <span className="block text-xs text-gray-500">
                    Login, security, quote draft, referral tracking — always on.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span>
                  <span className="font-medium text-gray-900 text-sm">Analytics</span>
                  <span className="block text-xs text-gray-500">
                    Google Analytics and Microsoft Clarity — anonymous usage stats.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span>
                  <span className="font-medium text-gray-900 text-sm">Marketing</span>
                  <span className="block text-xs text-gray-500">
                    Ad measurement when enabled — helps us reach customers in your area.
                  </span>
                </span>
              </label>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            {!showPreferences ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowPreferences(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  <Settings2 className="w-4 h-4" />
                  Manage preferences
                </button>
                <button
                  type="button"
                  onClick={rejectNonEssential}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition"
                >
                  Reject non-essential
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                >
                  Accept all
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => savePreferences({ analytics, marketing })}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
                >
                  Save preferences
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}