import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { scrollReveal } from '../utils/scrollReveal'

const TermsOfService = () => {
  return (
    <motion.section className="pt-32 pb-20 min-h-screen bg-gray-50" {...scrollReveal}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="mb-12" {...scrollReveal}>
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Legal</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: February 2025</p>
        </motion.div>

        <motion.div className="bg-white rounded-2xl shadow-sm p-8 sm:p-10 space-y-10" {...scrollReveal}>
          <div className="flex items-start gap-4">
            <FileText className="w-8 h-8 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Agreement to Terms</h2>
              <p className="text-gray-600">
                By accessing or using the Apex Five Cleaning website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Our Services</h2>
            <p className="text-gray-600">
              Apex Five Cleaning provides professional cleaning services including residential cleaning, end-of-tenancy cleaning, Airbnb turnover cleaning, and commercial cleaning across Kent and the South East. Services are offered subject to availability and at the prices agreed at the time of booking or as stated in approved quotes.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Quotes and Bookings</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
              <li>Quote requests do not create a binding contract until a quote is approved and payment is made or a booking is confirmed</li>
              <li>Quotes are valid for the period stated (typically 14 days) and may be subject to change based on final property inspection</li>
              <li>Bookings are confirmed upon payment or written confirmation from us</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Payment</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
              <li>Payment is due as specified in your quote or booking confirmation</li>
              <li>We accept payment via credit/debit card through our secure payment provider (Stripe)</li>
              <li>Payments are processed in GBP. Refunds are handled in accordance with our cancellation and refund policy</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cancellation and Rescheduling</h2>
            <p className="text-gray-600 mb-4">We ask for reasonable notice when cancelling or rescheduling:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
              <li>Cancellations with 48 hours or more notice: Full refund or reschedule</li>
              <li>Cancellations with less than 48 hours notice: Refund or reschedule at our discretion; a fee may apply</li>
              <li>No-shows or failure to provide access: No refund; full payment may be due</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Customer Responsibilities</h2>
            <p className="text-gray-600 mb-4">You agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
              <li>Provide accurate contact and property information</li>
              <li>Ensure safe access to the property at the scheduled time</li>
              <li>Remove or secure valuable items; we are not responsible for loss or damage to items not disclosed</li>
              <li>Inform us of any special requirements, pets, or access instructions</li>
              <li>Treat our staff with respect and in accordance with the law</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Liability</h2>
            <p className="text-gray-600">
              To the fullest extent permitted by law, our liability for any claim arising from our services shall not exceed the amount paid for the relevant service. We are not liable for consequential, indirect, or special damages. Nothing in these terms excludes or limits our liability for death or personal injury caused by negligence, fraud, or any other matter where limitation is not permitted by law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Intellectual Property</h2>
            <p className="text-gray-600">
              All content on this website (text, images, logos, and design) is owned by Apex Five Cleaning and protected by intellectual property laws. You may not reproduce, distribute, or use our content without prior written consent.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Governing Law</h2>
            <p className="text-gray-600">
              These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Changes to Terms</h2>
            <p className="text-gray-600">
              We may update these Terms of Service from time to time. Continued use of our services after changes constitutes acceptance of the updated terms. Material changes will be communicated where appropriate.
            </p>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact</h2>
            <p className="text-gray-600">
              For questions about these terms, contact us at{' '}
              <a href="mailto:info@apexfivecleaning.co.uk" className="text-teal-600 hover:underline">info@apexfivecleaning.co.uk</a>.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default TermsOfService
