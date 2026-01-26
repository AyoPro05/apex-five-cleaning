import { useState, useEffect } from 'react'
import { Check, AlertCircle } from 'lucide-react'

// Load reCAPTCHA script
const loadRecaptchaScript = () => {
  if (!window.grecaptcha) {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${import.meta.env.VITE_RECAPTCHA_SITE_KEY}`
    document.head.appendChild(script)
  }
}

const Quote = () => {
  useEffect(() => {
    loadRecaptchaScript()
  }, [])

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [quoteId, setQuoteId] = useState('')
  
  const [formData, setFormData] = useState({
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    serviceType: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    additionalNotes: ''
  })

  const [errors, setErrors] = useState({})

  // Client-side validation
  const validateStep = (stepNum) => {
    const newErrors = {}

    if (stepNum === 1) {
      if (!formData.propertyType) {
        newErrors.propertyType = 'Please select a property type'
      }
      if (!formData.bedrooms || formData.bedrooms < 1 || formData.bedrooms > 20) {
        newErrors.bedrooms = 'Please enter a valid number of bedrooms (1-20)'
      }
      if (!formData.bathrooms || formData.bathrooms < 1 || formData.bathrooms > 20) {
        newErrors.bathrooms = 'Please enter a valid number of bathrooms (1-20)'
      }
    }

    if (stepNum === 2) {
      if (!formData.serviceType) {
        newErrors.serviceType = 'Please select a service type'
      }
    }

    if (stepNum === 3) {
      if (!formData.firstName || formData.firstName.length < 2) {
        newErrors.firstName = 'First name must be at least 2 characters'
      }
      if (!formData.lastName || formData.lastName.length < 2) {
        newErrors.lastName = 'Last name must be at least 2 characters'
      }
      if (!formData.email || !isValidEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
      if (!formData.phone || !isValidPhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid UK phone number (e.g., 01234 567890)'
      }
      if (!formData.address || formData.address.length < 5) {
        newErrors.address = 'Please enter a valid address'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const isValidPhone = (phone) => {
    const regex = /^(?:\+44|0)(?:\d\s?){9,10}$/
    const cleaned = phone.replace(/\s/g, '')
    return regex.test(cleaned)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)

    try {
      // Get reCAPTCHA token
      const token = await window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, {
        action: 'submit'
      })

      // Submit to backend
      const response = await fetch('/api/quotes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          captchaToken: token
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors)
          setSubmitError('Please check the form for errors')
        } else {
          setSubmitError(data.error || 'An error occurred. Please try again.')
        }
        setSubmitting(false)
        return
      }

      // Success
      setQuoteId(data.quoteId)
      setSuccessMessage(data.message)
      setStep(4)
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitError('A network error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
      setErrors({})
    }
  }

  const resetForm = () => {
    setStep(1)
    setFormData({
      propertyType: '',
      bedrooms: '',
      bathrooms: '',
      serviceType: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      additionalNotes: ''
    })
    setErrors({})
    setSubmitError('')
    setSuccessMessage('')
    setQuoteId('')
  }

  return (
    <section className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Get a Quote</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-4">Request Your Free Quote</h1>
          <p className="text-gray-600">Fill out the form below and we'll get back to you with a personalized quote</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step} of 3</span>
            <span className="text-sm font-medium text-gray-600">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {step === 4 ? (
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quote Request Submitted!</h2>
            <p className="text-gray-600 mb-2">
              Thank you for your request. We've sent a confirmation to your email.
            </p>
            <p className="text-gray-600 mb-6">
              Our team will review your details and get back to you within 24 hours with a personalized quote.
            </p>
            
            {quoteId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Your Quote Reference</p>
                <p className="font-mono text-lg font-semibold text-gray-900 break-all">{quoteId}</p>
              </div>
            )}

            <button
              onClick={resetForm}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Request Another Quote
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg">
            {/* Error Alert */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Error submitting form</p>
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              </div>
            )}

            {/* Step 1: Property Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Details</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                      errors.propertyType 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-teal-500'
                    }`}
                  >
                    <option value="">Select property type</option>
                    <option value="house">House</option>
                    <option value="flat">Flat/Apartment</option>
                    <option value="bungalow">Bungalow</option>
                  </select>
                  {errors.propertyType && (
                    <p className="text-red-600 text-sm mt-2">{errors.propertyType}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms *</label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      min="1"
                      max="20"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                        errors.bedrooms 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />
                    {errors.bedrooms && (
                      <p className="text-red-600 text-sm mt-2">{errors.bedrooms}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms *</label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      min="1"
                      max="20"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                        errors.bathrooms 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />
                    {errors.bathrooms && (
                      <p className="text-red-600 text-sm mt-2">{errors.bathrooms}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Service Type */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Type</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What service do you need? *</label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                      errors.serviceType 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-teal-500'
                    }`}
                  >
                    <option value="">Select service</option>
                    <option value="residential">Regular Residential Cleaning</option>
                    <option value="end-of-tenancy">End of Tenancy Cleaning</option>
                    <option value="airbnb">Airbnb Turnover Cleaning</option>
                    <option value="commercial">Commercial Cleaning</option>
                  </select>
                  {errors.serviceType && (
                    <p className="text-red-600 text-sm mt-2">{errors.serviceType}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    placeholder="Tell us anything else that might help us provide an accurate quote..."
                    maxLength="500"
                    rows="4"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.additionalNotes.length}/500 characters</p>
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                        errors.firstName 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-red-600 text-sm mt-2">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Smith"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                        errors.lastName 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-red-600 text-sm mt-2">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                      errors.email 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-teal-500'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-2">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="01234 567890 or +44 1234 567890"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                      errors.phone 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-teal-500'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-2">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street, London, SE1 1AA"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none ${
                      errors.address 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-teal-500'
                    }`}
                  />
                  {errors.address && (
                    <p className="text-red-600 text-sm mt-2">{errors.address}</p>
                  )}
                </div>

                {/* CAPTCHA Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Protected by reCAPTCHA:</span> This site is protected by reCAPTCHA and the Google{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                      Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
                      Terms of Service
                    </a>{' '}
                    apply.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      submitting
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </section>
  )
}

export default Quote
