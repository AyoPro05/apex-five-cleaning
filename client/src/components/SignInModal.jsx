import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X, Mail, Lock, Loader2, Calculator } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { post } from '../utils/apiClient'

export default function SignInModal({ isOpen, onClose, onSwitchToSignUp }) {
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

  const isUnverifiedError = error && /verify|verification/i.test(error)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResendMessage('')
    setLoading(true)
    try {
      await login(email, password, rememberMe)
      onClose()
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
      setResendMessage('If an account exists with this email, a new verification link has been sent. Check your inbox and spam folder.')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message
      setResendMessage(msg || 'Could not send verification email.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotLoading(true)
    setForgotMessage('')
    try {
      await post('/api/auth/forgot-password', { email: forgotEmail.trim() })
      setForgotMessage('If an account exists with that email, a password reset link has been sent. Check your inbox and spam folder.')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message
      setForgotMessage(msg || 'Could not send reset email.')
    } finally {
      setForgotLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setShowForgotPassword(false)
      setForgotMessage('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Forgot password view
  if (showForgotPassword) {
    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Forgot password"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative my-auto" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setShowForgotPassword(false); setForgotMessage(''); setForgotEmail('') }}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
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
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            {forgotMessage && (
              <div className={`p-3 rounded-lg text-sm ${forgotMessage.includes('sent') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
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
          <p className="mt-6 text-center text-gray-600 text-sm">
            <button
              type="button"
              onClick={() => { setShowForgotPassword(false); setForgotMessage('') }}
              className="text-teal-600 font-semibold hover:underline"
            >
              Back to login
            </button>
          </p>
        </div>
      </div>,
      document.body
    )
  }

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Login"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative my-auto" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Login</h2>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <p className="text-gray-600 text-sm sm:text-base flex-1">
            Welcome back to Apex Five Cleaning
          </p>
          <Link
            to="/request-a-quote"
            onClick={onClose}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100 hover:border-teal-300 transition whitespace-nowrap"
          >
            <Calculator className="w-4 h-4" />
            Get a quote
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
              {isUnverifiedError && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-red-700 mb-2">Didn’t get the email?</p>
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
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading && password) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
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
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
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
              'Login'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => {
              onClose()
              onSwitchToSignUp?.()
            }}
            className="text-teal-600 font-semibold hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
  return createPortal(modal, document.body)
}
