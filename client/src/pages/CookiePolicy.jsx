import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { scrollReveal } from '../utils/scrollReveal';
import SEO from '../components/SEO';
import { useCookieConsent } from '../context/CookieConsentContext';

const COOKIE_TABLE = [
  { name: 'apex_consent', purpose: 'Stores your cookie preferences', duration: '12 months', type: 'Essential' },
  { name: 'apex_visitor_id', purpose: 'Anonymous visitor ID for repeat visits', duration: '24 months', type: 'Essential' },
  { name: 'apex_ref', purpose: 'Refer-a-friend code from shared links', duration: '90 days', type: 'Essential' },
  { name: 'apex_utm_*', purpose: 'Marketing campaign attribution (source, medium, campaign)', duration: '90 days', type: 'Essential' },
  { name: 'apex_landing_page', purpose: 'First page you visited on our site', duration: '90 days', type: 'Essential' },
  { name: 'apex_first_visit / apex_visit_count', purpose: 'Visit timing and frequency (no personal data)', duration: '24 months', type: 'Essential' },
  { name: 'apex_quote_draft', purpose: 'Incomplete quote form progress (no contact details)', duration: '7 days', type: 'Essential' },
  { name: 'apex_service_interest / apex_service_region', purpose: 'Service type and region (Kent, London, Essex) for relevance', duration: '90 days–12 months', type: 'Essential' },
  { name: '_ga, _ga_*', purpose: 'Google Analytics — site usage statistics', duration: 'Up to 24 months', type: 'Analytics (opt-in)' },
  { name: '_clck, _clsk', purpose: 'Microsoft Clarity — heatmaps and session replay', duration: 'Up to 12 months', type: 'Analytics (opt-in)' },
];

const CookiePolicy = () => {
  const { openPreferences } = useCookieConsent();

  return (
    <>
      <SEO
        title="Cookie Policy"
        description="How Apex Five Cleaning uses cookies across Kent, London, and Essex — essential, analytics, and marketing cookies explained."
        path="/cookie-policy"
      />
      <motion.section className="pt-32 pb-20 min-h-screen bg-gray-50" {...scrollReveal}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-12" {...scrollReveal}>
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Legal</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-4">Cookie Policy</h1>
            <p className="text-gray-600">Last updated: May 2026</p>
          </motion.div>

          <motion.div className="bg-white rounded-2xl shadow-sm p-8 sm:p-10 space-y-8" {...scrollReveal}>
            <div className="flex items-start gap-4">
              <Cookie className="w-8 h-8 text-teal-600 shrink-0 mt-1" />
              <div>
                <p className="text-gray-600">
                  Apex Five Cleaning uses cookies and similar technologies on{' '}
                  <strong>www.apexfivecleaning.co.uk</strong> to run our website, measure marketing
                  performance, and improve quotes and service across <strong>Kent, London, and Essex</strong>.
                  This policy works alongside our{' '}
                  <Link to="/privacy-policy" className="text-teal-600 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
                <button
                  type="button"
                  onClick={openPreferences}
                  className="mt-4 text-sm font-semibold text-teal-600 hover:text-teal-700"
                >
                  Manage cookie preferences
                </button>
              </div>
            </div>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Types of cookies</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>
                  <strong>Essential</strong> — required for login, security, quote drafts, and referral
                  tracking. These do not require consent.
                </li>
                <li>
                  <strong>Analytics</strong> — help us understand how visitors use the site (e.g. Google
                  Analytics, Microsoft Clarity). Only set if you opt in.
                </li>
                <li>
                  <strong>Marketing</strong> — used to measure ad campaigns when enabled. Only set if you
                  opt in.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Cookies we use</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Cookie</th>
                      <th className="px-4 py-3 font-semibold">Purpose</th>
                      <th className="px-4 py-3 font-semibold">Duration</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-600">
                    {COOKIE_TABLE.map((row) => (
                      <tr key={row.name}>
                        <td className="px-4 py-3 font-mono text-xs">{row.name}</td>
                        <td className="px-4 py-3">{row.purpose}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.duration}</td>
                        <td className="px-4 py-3">{row.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Your choices</h2>
              <p className="text-gray-600">
                You can accept or reject non-essential cookies using the banner on your first visit, or
                change your mind anytime via &quot;Manage cookie preferences&quot; above or in the site
                footer. You can also block cookies in your browser settings, though some features may not
                work correctly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Contact</h2>
              <p className="text-gray-600">
                Questions:{' '}
                <a href="mailto:info@apexfivecleaning.co.uk" className="text-teal-600 hover:underline">
                  info@apexfivecleaning.co.uk
                </a>
              </p>
            </section>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
};

export default CookiePolicy;
