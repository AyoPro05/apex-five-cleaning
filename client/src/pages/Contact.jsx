import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, CheckCircle, AlertCircle, ShieldCheck, Clock3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { scrollReveal, scrollRevealVisible } from '../utils/scrollReveal'
import SEO from '../components/SEO'
import { buildLocalBusinessSchema } from '../config/seoSchemas'
import { CONTACT_EMAIL, PHONE_MAIN_DISPLAY, PHONE_MAIN_HREF, whatsappHref } from '../config/site'
import CompanyAddress from '../components/CompanyAddress'
import { post } from '../utils/apiClient'
import { getRecaptchaSiteKey, getRecaptchaToken, loadRecaptchaScript } from '../utils/recaptcha'
import { createIdempotencyKey, withIdempotency } from '../utils/idempotency'

const Contact = () => {
  const contactSchemas = [
    buildLocalBusinessSchema(),
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact Apex Five Cleaning",
      url: "https://www.apexfivecleaning.co.uk/contact",
      description: "Contact Apex Five Cleaning for quotes, bookings, and cleaning enquiries.",
    },
  ]

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey())

  useEffect(() => {
    loadRecaptchaScript('contact-form')
  }, [])

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePhone = (phone) => {
    if (!phone) return true // Phone is optional
    const re = /^[\d\s\-\+\(\)]{10,}$/
    return re.test(phone.replace(/\s/g, ''))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const nextFieldErrors = {}

    // Validation
    if (!formData.name.trim()) {
      nextFieldErrors.name = 'Please enter your name.'
    }
    if (!formData.email.trim()) {
      nextFieldErrors.email = 'Please enter your email.'
    }
    if (formData.email.trim() && !validateEmail(formData.email)) {
      nextFieldErrors.email = 'Please enter a valid email address.'
    }
    if (formData.phone && !validatePhone(formData.phone)) {
      nextFieldErrors.phone = 'Please enter a valid phone number.'
    }
    if (!formData.message.trim()) {
      nextFieldErrors.message = 'Please enter a message.'
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return
    }
    setFieldErrors({})

    setLoading(true)
    try {
      let captchaToken = ''
      const recaptchaSiteKey = getRecaptchaSiteKey()
      if (!recaptchaSiteKey && import.meta.env.PROD) {
        setError('Security check is not configured on this site. Please contact support.')
        return
      }
      if (recaptchaSiteKey) {
        try {
          captchaToken = await getRecaptchaToken('contact')
        } catch (captchaErr) {
          setError(
            captchaErr.message ||
              'Could not verify the form. Refresh the page and try again.',
          )
          return
        }
      }

      const response = await post(
        '/api/contact',
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          subject: formData.subject,
          message: formData.message.trim(),
          captchaToken,
          _website: '',
        },
        withIdempotency(idempotencyKey),
      )

      if (!response?.success) {
        setError(response?.error || 'Failed to send message. Please try again.')
        return
      }

      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setIdempotencyKey(createIdempotencyKey())
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO
        title="Contact Apex Five Cleaning"
        description="Contact Apex Five Cleaning for quotes, bookings, and cleaning service questions. Call, WhatsApp, or send a message."
        path="/contact"
        jsonLd={contactSchemas}
      />
      <motion.section className="pt-32 pb-20 bg-white min-h-screen" {...scrollRevealVisible}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...scrollReveal}>
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Contact Us</span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-6">Get in Touch</h1>
        <p className="text-xl text-gray-600 mb-12">
          Have a question or ready to book? We are here to help and usually respond the same day.
        </p>
        </motion.div>

        <motion.div className="grid md:grid-cols-2 gap-12" {...scrollReveal}>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Phone</h3>
                  <a href={PHONE_MAIN_HREF} className="text-teal-600 hover:text-teal-700 font-semibold">
                    {PHONE_MAIN_DISPLAY}
                  </a>
                  <p className="text-gray-500 text-sm">Monday - Friday, 8am - 6pm</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal-600 hover:text-teal-700 font-semibold">
                    {CONTACT_EMAIL}
                  </a>
                  <p className="text-gray-500 text-sm">We reply within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Address</h3>
                  <CompanyAddress linkClassName="text-teal-600 hover:text-teal-700 font-medium block" />
                  <p className="text-gray-500 text-sm mt-1">Serving Kent, Essex, Greater London & surrounding areas</p>
                </div>
              </div>
            </div>

            {/* Quick Contact Options */}
            <div className="mt-10 p-6 bg-teal-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4">Need a quick response?</h3>
              <div className="space-y-3">
                <a
                  href={PHONE_MAIN_HREF}
                  className="block w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-semibold text-center transition"
                >
                  Call Now
                </a>
                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold text-center transition"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
            <div className="mt-6 p-6 bg-white border border-gray-200 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4">Why clients choose us</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Clock3 className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Fast response and clear communication from first contact
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Trusted, insured team using eco-conscious cleaning products
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            
            {/* Success Message */}
            {submitted && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Message sent successfully!</p>
                  <p className="text-green-700 text-sm">Thank you for contacting us. We'll get back to you within 24 hours.</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="font-semibold text-red-900">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="_website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-gray-400"
                />
                {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-gray-400"
                />
                {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+44 (optional)"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-gray-400"
                />
                {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select a subject (optional)</option>
                  <option value="residential">Residential Cleaning</option>
                  <option value="end-of-tenancy">End of Tenancy</option>
                  <option value="airbnb">Airbnb Cleaning</option>
                  <option value="quote">Request a Quote</option>
                  <option value="other">Other Inquiry</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Tell us about your cleaning needs..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-gray-400"
                ></textarea>
                {fieldErrors.message && <p className="mt-1 text-sm text-red-600">{fieldErrors.message}</p>}
              </div>
              {getRecaptchaSiteKey() && (
                <p className="text-xs text-gray-500">
                  Protected by reCAPTCHA.{' '}
                  <a href="https://policies.google.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">Privacy</a>
                  {' · '}
                  <a href="https://policies.google.com/terms" className="underline" target="_blank" rel="noopener noreferrer">Terms</a>
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`w-full ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700'
                } text-white px-6 py-3 rounded-lg font-semibold transition`}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
              <p className="text-xs text-gray-500">
                Prefer a full pricing estimate? Use the quote form for a faster and more accurate response.
              </p>
            </form>
          </div>
        </motion.div>
        </div>
      </motion.section>
    </>
  )
}

export default Contact
