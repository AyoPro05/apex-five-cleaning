import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { scrollReveal } from '../utils/scrollReveal'

const PrivacyPolicy = () => {
  return (
    <motion.section className="pt-32 pb-20 min-h-screen bg-gray-50" {...scrollReveal}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="mb-12" {...scrollReveal}>
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Legal</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: February 2025</p>
        </motion.div>

        <motion.div className="bg-white rounded-2xl shadow-sm p-8 sm:p-10 space-y-10" {...scrollReveal}>
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Introduction</h2>
              <p className="text-gray-600">
                Apex Five Cleaning (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This policy explains how we collect, use, store, and protect your personal data when you use our website and services, in accordance with UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Information We Collect</h2>
            <p className="text-gray-600 mb-4">We may collect and process the following personal data:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
              <li><strong>Contact details:</strong> Name, email address, phone number, and postal address</li>
              <li><strong>Property information:</strong> Property type, number of bedrooms/bathrooms, and service-specific details when you request a quote</li>
              <li><strong>Account information:</strong> If you create an account, we store your login details and preferences</li>
              <li><strong>Payment information:</strong> Payment processing is handled by Stripe. We do not store full card numbers; only last four digits and billing details for records</li>
              <li><strong>Technical data:</strong> IP address, browser type, and device information when you visit our site</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">How We Use Your Data</h2>
            <p className="text-gray-600 mb-4">We use your personal data to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
              <li>Provide cleaning services, process quotes, and manage bookings</li>
              <li>Process payments securely via our payment providers</li>
              <li>Send service confirmations, invoices, and booking reminders</li>
              <li>Respond to enquiries and provide customer support</li>
              <li>Improve our website, services, and user experience</li>
              <li>Comply with legal obligations and prevent fraud</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Legal Basis for Processing</h2>
            <p className="text-gray-600">
              Under UK GDPR, we process your data based on: (a) performance of a contract when providing services; (b) your consent where you have opted in (e.g. marketing); (c) our legitimate interests in operating our business and improving our services; and (d) legal obligation where required by law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Data Sharing and Third Parties</h2>
            <p className="text-gray-600 mb-4">
              We do not sell your personal data. We may share your data with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
              <li><strong>Stripe:</strong> For secure payment processing (card data is never stored by us)</li>
              <li><strong>Email providers:</strong> To send transactional and service-related emails</li>
              <li><strong>Our cleaning team:</strong> To fulfil bookings and access your property</li>
              <li><strong>Legal authorities:</strong> When required by law or to protect our rights</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Data Retention</h2>
            <p className="text-gray-600">
              We retain your data only for as long as necessary for the purposes described in this policy. Typically: quote and booking records for up to 7 years for tax and legal compliance; account data until you close your account or request deletion; marketing preferences until you withdraw consent.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your Rights</h2>
            <p className="text-gray-600 mb-4">Under UK data protection law, you have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
              <li>Access your personal data and receive a copy</li>
              <li>Rectify inaccurate or incomplete data</li>
              <li>Request erasure (subject to certain conditions)</li>
              <li>Restrict or object to processing in certain circumstances</li>
              <li>Data portability where applicable</li>
              <li>Withdraw consent where processing is based on consent</li>
              <li>Lodge a complaint with the Information Commissioner&apos;s Office (ICO)</li>
            </ul>
            <p className="text-gray-600 mt-4">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:info@apexfivecleaning.co.uk" className="text-teal-600 hover:underline">info@apexfivecleaning.co.uk</a>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cookies and Tracking</h2>
            <p className="text-gray-600">
              Our website uses essential cookies for functionality (e.g. authentication, session management) and may use analytics cookies to understand how visitors use our site. You can manage cookie preferences in your browser settings.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Security</h2>
            <p className="text-gray-600">
              We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. Our payment processing is PCI compliant via Stripe.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Changes to This Policy</h2>
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top indicates when changes were last made. Continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Us</h2>
            <p className="text-gray-600">
              For privacy enquiries or to exercise your rights, contact us at{' '}
              <a href="mailto:info@apexfivecleaning.co.uk" className="text-teal-600 hover:underline">info@apexfivecleaning.co.uk</a>.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default PrivacyPolicy
