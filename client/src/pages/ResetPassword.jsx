import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { post } from '../utils/apiClient'
import { scrollReveal } from '../utils/scrollReveal'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [status, setStatus] = useState('form') // 'form' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Reset link is missing. Please use the link from your email.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== passwordConfirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setStatus('loading')
    try {
      const res = await post('/api/auth/reset-password', {
        token,
        password,
        passwordConfirm,
      })
      if (res.success) {
        setStatus('success')
        setMessage(res.message || 'Your password has been reset. You can now log in.')
      } else {
        setStatus('error')
        setMessage(res.message || 'Something went wrong.')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.message || err.message || 'Failed to reset password.')
    }
  }

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const isError = status === 'error'
  const showForm = status === 'form' && token

  return (
    <motion.section className="pt-32 pb-20 min-h-screen bg-gray-50" {...scrollReveal}>
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">
            Reset Password
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">
            {showForm ? 'Set a new password' : isSuccess ? 'Password reset' : 'Reset problem'}
          </h1>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    minLength={8}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset password'
                )}
              </button>
            </form>
          )}

          {isLoading && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-gray-600">Resetting your password...</p>
            </div>
          )}

          {isSuccess && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="text-gray-700 text-center">{message}</p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                Log in
              </button>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <p className="text-gray-700 text-center">{message}</p>
              <p className="text-sm text-gray-500 text-center">
                You can request a new reset link from the login page.
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}
