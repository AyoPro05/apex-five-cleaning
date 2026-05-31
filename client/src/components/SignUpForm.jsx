import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { post } from '../utils/apiClient'
import { COOKIE_NAMES, getCookie } from '../utils/cookies'
import { getAttributionPayload } from '../utils/attribution'

export default function SignUpForm({
  onSuccess,
  onSwitchToSignIn,
  idPrefix = 'signup',
  showSwitchLink = true,
}) {
  const { register } = useAuth()
  const [searchParams] = useSearchParams()
  const [refCode, setRefCode] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    rememberMe: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const rememberId = `${idPrefix}-remember`

  useEffect(() => {
    const fromUrl = searchParams.get('ref')
    const fromCookie = typeof window !== 'undefined' ? getCookie(COOKIE_NAMES.REFERRAL) : null
    setRefCode(fromUrl || fromCookie || '')
  }, [searchParams])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    const phoneClean = formData.phone.replace(/\D/g, '')
    if (phoneClean.length < 10 || phoneClean.length > 15) {
      setError('Please enter a valid UK phone number (10-15 digits)')
      return
    }
    setLoading(true)
    try {
      await register({
        ...formData,
        phone: phoneClean,
        referralCode: refCode || undefined,
        attribution: getAttributionPayload(),
      })
      setRegisteredEmail(formData.email)
      setSuccess(true)
      onSuccess?.({ email: formData.email })
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!registeredEmail || resendLoading) return
    setResendLoading(true)
    setResendMessage('')
    try {
      await post('/api/auth/resend-verification-email', { email: registeredEmail })
      setResendMessage('A new verification link has been sent. Check your inbox and spam folder.')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message
      setResendMessage(msg || 'Could not send verification email. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  if (success && registeredEmail) {
    return (
      <div className="text-center py-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Account created</h2>
        <p className="text-gray-600 mb-4">
          We&apos;ve sent a verification link to{' '}
          <span className="font-semibold text-gray-900">{registeredEmail}</span>.
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Check your inbox and spam folder, then verify your email before logging in.
        </p>
        <p className="text-sm text-gray-600 mb-2">
          Didn&apos;t receive it?{' '}
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading}
            className="text-teal-600 font-semibold hover:underline disabled:opacity-50"
          >
            {resendLoading ? 'Sending…' : 'Resend verification email'}
          </button>
        </p>
        {resendMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              resendMessage.includes('sent') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {resendMessage}
          </div>
        )}
        {onSwitchToSignIn && (
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
          >
            Log in
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                autoComplete="given-name"
                placeholder="John"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                autoComplete="family-name"
                placeholder="Smith"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              autoComplete="tel"
              placeholder="07123456789"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Min 8 characters"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
              autoComplete="new-password"
              placeholder="Re-enter password"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id={rememberId}
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor={rememberId} className="ml-2 text-sm text-gray-600">
            Remember me
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      {showSwitchLink && onSwitchToSignIn && (
        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToSignIn} className="text-teal-600 font-semibold hover:underline">
            Log in
          </button>
        </p>
      )}
    </div>
  )
}
