import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { post } from '../utils/apiClient'
import { scrollReveal } from '../utils/scrollReveal'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Verification token is missing. Please use the link from your email.')
      return
    }

    const verify = async () => {
      try {
        const res = await post('/api/auth/verify-email-token', { token })
        if (res.success) {
          setStatus('success')
          setMessage('Your email has been verified successfully. You can now log in and pay online.')
        } else {
          setStatus('error')
          setMessage(res.message || 'The verification link is invalid or has expired.')
        }
      } catch (err) {
        setStatus('error')
        setMessage(err.response?.data?.message || err.message || 'Verification failed. Please try again.')
      }
    }

    verify()
  }, [searchParams])

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const isError = status === 'error'

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

        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">
            Email Verification
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">
            {isLoading ? 'Verifying your email...' : isSuccess ? 'Email verified' : 'Verification problem'}
          </h1>

          {isLoading && (
            <div className="flex flex-col items-center gap-4 mt-4">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-gray-600">Please wait while we confirm your email address.</p>
            </div>
          )}

          {isSuccess && (
            <div className="flex flex-col items-center gap-4 mt-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="text-gray-700">{message}</p>
              <button
                type="button"
                onClick={() => navigate('/pay-online')}
                className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                Go to Pay Online
              </button>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-4 mt-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <p className="text-gray-700">{message}</p>
              <p className="text-sm text-gray-500 mt-2">
                If the link has expired, you can request a new verification email from your account or when you try to
                pay online.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}

