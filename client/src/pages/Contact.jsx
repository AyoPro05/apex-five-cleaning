import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { scrollReveal, scrollRevealVisible } from '../utils/scrollReveal'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!formData.email.trim()) {
      setError('Please enter your email')
      return
    }
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      return
    }
    if (formData.phone && !validatePhone(formData.phone)) {
      setError('Please enter a valid phone number')
      return
    }
    if (!formData.message.trim()) {
      setError('Please enter a message')
      return
    }

    // Simulate sending (in production, send to backend API)
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reset form and show success
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setSubmitted(true)
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setError('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.section className="pt-32 pb-20 bg-white min-h-screen" {...scrollRevealVisible}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...scrollReveal}>
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Contact Us</span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-6">Get in Touch</h1>
        <p className="text-xl text-gray-600 mb-12">
          Have a question or ready to book? We're here to help! We typically respond within 24 hours.
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
                  <a href="tel:+441622621133" className="text-teal-600 hover:text-teal-700 font-semibold">
                    +44 1622 621133
                  </a>
                  <p className="text-gray-500 text-sm">Monday - Friday, 8am - 6pm</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <a href="mailto:info@apexfivecleaning.co.uk" className="text-teal-600 hover:text-teal-700 font-semibold">
                    info@apexfivecleaning.co.uk
                  </a>
                  <p className="text-gray-500 text-sm">We reply within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Address</h3>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=123+Main+road+Broadway+Sittingbourne+plaza+ME11+2BY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-700 font-medium block"
                  >
                    123, Main road, Broadway, Sittingbourne plaza ME11 2BY
                  </a>
                  <p className="text-gray-500 text-sm mt-1">Serving Kent, Swale & surrounding areas</p>
                </div>
              </div>
            </div>

            {/* Quick Contact Options */}
            <div className="mt-10 p-6 bg-teal-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4">Need a quick response?</h3>
              <div className="space-y-3">
                <a
                  href="tel:+441622621133"
                  className="block w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-semibold text-center transition"
                >
                  Call Now
                </a>
                <a
                  href="https://wa.me/441622621133?text=Hi%20Apex%20Five%20Cleaning%2C%20I%27d%20like%20to%20enquire%20about%20your%20services."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold text-center transition"
                >
                  WhatsApp Us
                </a>
              </div>
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
              </div>
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
            </form>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default Contact
