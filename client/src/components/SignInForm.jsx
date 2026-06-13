import { useState } from 'react'
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { post } from '../utils/apiClient'

export default function SignInForm({
  onSuccess,
  onSwitchToSignUp,
  returnTo,
  idPrefix = 'signin',
  showSwitchLink = true,
}) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [forgotEmailError, setForgotEmailError] = useState('')

  const isUnverifiedError = error && /verify|verification/i.test(error)
  const rememberId = `${idPrefix}-remember`

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResendMessage('')
    const nextFieldErrors = {}
    if (!email.trim()) {
      nextFieldErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextFieldErrors.email = 'Enter a valid email address.'
    }
    if (!password) {
      nextFieldErrors.password = 'Password is required.'
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return
    }
    setFieldErrors({})
    setLoading(true)
    try {
      await login(email, password, rememberMe)
      onSuccess?.({ returnTo })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email || resendLoading) return
    setResendLoading(true)
    setResendMessage('')
    setError('')
    try {
      await post('/api/auth/resend-verification-email', { email: email.trim() })
      setResendMessage(
        'If an account exists with this email, a new verification link has been sent. Check your inbox and spam folder.',
      )
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message
      setResendMessage(msg || 'Could not send verification email.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      setForgotEmailError('Email is required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setForgotEmailError('Enter a valid email address.')
      return
    }
    setForgotEmailError('')
    setForgotLoading(true)
    setForgotMessage('')
    try {
      await post('/api/auth/forgot-password', { email: forgotEmail.trim() })
      setForgotMessage(
        'If an account exists with that email, a password reset link has been sent. Check your inbox and spam folder.',
      )
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message
      setForgotMessage(msg || 'Could not send reset email.')
    } finally {
      setForgotLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setShowForgotPassword(false)
            setForgotMessage('')
            setForgotEmail('')
          }}
          className="inline-flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to log in
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot password?</h2>
        <p className="text-gray-600 mb-6">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value)
                  if (forgotEmailError) setForgotEmailError('')
                }}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            {forgotEmailError && <p className="mt-1 text-sm text-red-600">{forgotEmailError}</p>}
          </div>
          {forgotMessage && (
            <div
              className={`p-3 rounded-lg text-sm ${
                forgotMessage.includes('sent') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {forgotMessage}
            </div>
          )}
          <button
            type="submit"
            disabled={forgotLoading}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {forgotLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
            {isUnverifiedError && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-red-700 mb-2">Didn&apos;t get the email?</p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading || !email.trim()}
                  className="text-red-800 font-semibold underline hover:no-underline disabled:opacity-50"
                >
                  {resendLoading ? 'Sending…' : 'Resend verification email'}
                </button>
              </div>
            )}
          </div>
        )}
        {resendMessage && !error && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm">
            {resendMessage}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: '' }))
                }
              }}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: '' }))
                }
              }}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
          <p className="mt-1 text-right">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-teal-600 font-medium hover:underline"
            >
              Forgot password?
            </button>
          </p>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id={rememberId}
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
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
              Logging in...
            </>
          ) : (
            'Log in'
          )}
        </button>
      </form>

      {showSwitchLink && onSwitchToSignUp && (
        <p className="mt-6 text-center text-gray-600 text-sm">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={onSwitchToSignUp} className="text-teal-600 font-semibold hover:underline">
            Sign up
          </button>
        </p>
      )}
    </div>
  )
}
