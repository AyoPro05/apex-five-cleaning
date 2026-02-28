import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { get, post } from '../utils/apiClient'
import { scrollReveal } from '../utils/scrollReveal'
import { CreditCard, ArrowLeft, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Stripe publishable key must come from env only (no fallback – never ship secrets or placeholder keys)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '')

const cardElementOptions = {
  style: {
    base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
    invalid: { color: '#fa755a' },
  },
}

function GuestCardForm({ quote, clientSecret, paymentId, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [expiryComplete, setExpiryComplete] = useState(false)
  const [cvcComplete, setCvcComplete] = useState(false)
  const [postcode, setPostcode] = useState('')

  const allComplete = cardComplete && expiryComplete && cvcComplete && postcode.trim().length >= 3

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return

    setLoading(true)
    setError(null)

    try {
      const cardNumberElement = elements.getElement(CardNumberElement)
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          address: { postal_code: postcode.trim() },
        },
      })

      if (pmError) {
        setError(pmError.message)
        onError?.(pmError.message)
        setLoading(false)
        return
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      })

      if (stripeError) {
        setError(stripeError.message)
        onError?.(stripeError.message)
        setLoading(false)
        return
      }

      const confirmData = await post('/api/payments/guest/confirm', {
        paymentIntentId: paymentIntent.id,
        paymentId,
      })

      if (confirmData.success) {
        onSuccess?.(confirmData)
      } else {
        setError(confirmData.message || 'Payment failed')
      }
    } catch (err) {
      setError(err.message || 'Payment failed')
      onError?.(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-teal-50 rounded-xl p-6 border border-teal-200">
        <p className="text-sm text-teal-700 mb-1">Amount to pay</p>
        <p className="text-2xl font-bold text-teal-900">{quote.amountDisplay}</p>
        <p className="text-sm text-teal-600 mt-1">{quote.customerName} · {quote.serviceType.replace(/-/g, ' ')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Card number</label>
          <div className="p-3 border border-gray-300 rounded-lg bg-white">
            <CardNumberElement
              options={cardElementOptions}
              onChange={(e) => { setCardComplete(e.complete); setError(e.error?.message || null) }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry date</label>
            <div className="p-3 border border-gray-300 rounded-lg bg-white">
              <CardExpiryElement
                options={cardElementOptions}
                onChange={(e) => { setExpiryComplete(e.complete); setError(e.error?.message || null) }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
            <div className="p-3 border border-gray-300 rounded-lg bg-white">
              <CardCvcElement
                options={cardElementOptions}
                onChange={(e) => { setCvcComplete(e.complete); setError(e.error?.message || null) }}
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="e.g. ME12 3AB"
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            maxLength={12}
            autoComplete="postal-code"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || loading || !allComplete}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
          loading || !allComplete ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
        }`}
      >
        {loading ? 'Processing...' : `Pay ${quote.amountDisplay}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Secure payment by Stripe. Your card details are never stored.
      </p>
    </form>
  )
}

export default function PayOnline() {
  const navigate = useNavigate()
  const { isAuthenticated, user, openSignIn, openSignUp } = useAuth()
  const [quoteRef, setQuoteRef] = useState('')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('lookup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quote, setQuote] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [sendingVerification, setSendingVerification] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')
  const [verificationError, setVerificationError] = useState('')

  const isVerified = !!user?.isVerified

  const handleLookup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const lookupEmail = (isAuthenticated && user?.email) ? user.email : email.trim()
    try {
      const data = await get(`/api/payments/guest/lookup?quoteId=${encodeURIComponent(quoteRef.trim())}&email=${encodeURIComponent(lookupEmail)}`)
      if (data.success) {
        setQuote(data.quote)
        const intentData = await post('/api/payments/guest/create-intent', {
          quoteId: quoteRef.trim(),
          email: lookupEmail,
        })
        if (intentData.success) {
          setClientSecret(intentData.clientSecret)
          setPaymentId(intentData.paymentId)
          setStep('pay')
        } else {
          setError(intentData.message || 'Could not start payment')
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Quote not found. Check your reference and email.')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    navigate(`/payment-success?payment_id=${paymentId}&guest=1`)
  }

  const handleSendVerification = async () => {
    setVerificationMessage('')
    setVerificationError('')
    setSendingVerification(true)
    try {
      const res = await post('/api/auth/send-verification-email', {})
      if (res.success) {
        setVerificationMessage('Verification email sent. Please check your inbox (and spam folder).')
      } else {
        setVerificationError(res.message || 'Could not send verification email. Please try again.')
      }
    } catch (err) {
      setVerificationError(err.response?.data?.message || err.message || 'Failed to send verification email.')
    } finally {
      setSendingVerification(false)
    }
  }

  if (step === 'pay' && quote && clientSecret) {
    return (
      <motion.section className="pt-32 pb-20 min-h-screen bg-gray-50" {...scrollReveal}>
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setStep('lookup')}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-8 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete payment</h1>
            <p className="text-gray-600 mb-6">Enter your card details below</p>
            <Elements stripe={stripePromise}>
              <GuestCardForm
                quote={quote}
                clientSecret={clientSecret}
                paymentId={paymentId}
                onSuccess={handleSuccess}
                onError={setError}
              />
            </Elements>
          </div>
        </div>
      </motion.section>
    )
  }

  // Gate: must sign in first
  if (!isAuthenticated) {
    return (
      <motion.section className="pt-32 pb-20 min-h-screen bg-gray-50" {...scrollReveal}>
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Secure Payment</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">Pay Online</h1>
            <p className="text-gray-600">
              Log in to pay for your approved quote. New to Apex Five? Create an account below.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="space-y-6">
              <button
                onClick={openSignIn}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
              >
                <LogIn className="w-5 h-5" />
                Log In
              </button>
              <p className="text-center text-gray-600 text-sm">
                Don&apos;t have an account?{' '}
                <button onClick={openSignUp} className="text-teal-600 font-semibold hover:underline">
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    )
  }

  // Gate: require verified email before allowing payment
  if (isAuthenticated && !isVerified) {
    return (
      <motion.section className="pt-32 pb-20 min-h-screen bg-gray-50" {...scrollReveal}>
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Secure Payment</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">Verify Your Email</h1>
            <p className="text-gray-600">
              Before you can pay online, please verify your email address. We&apos;ve sent a verification link to{' '}
              <span className="font-semibold">{user?.email}</span>.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-4">
            {verificationMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                {verificationMessage}
              </div>
            )}
            {verificationError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {verificationError}
              </div>
            )}
            <button
              type="button"
              onClick={handleSendVerification}
              disabled={sendingVerification}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {sendingVerification ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending verification email...
                </>
              ) : (
                'Resend verification email'
              )}
            </button>
            <p className="text-xs text-gray-500 text-center">
              Once your email is verified, refresh this page and you&apos;ll be able to pay online using your quote
              reference.
            </p>
          </div>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section className="pt-32 pb-20 min-h-screen bg-gray-50" {...scrollReveal}>
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Secure Payment</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">Pay Online</h1>
          <p className="text-gray-600">
            Enter your quote reference (e.g. AP12345678) from your approval email to pay.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quote reference (e.g. AP12345678)</label>
              <input
                type="text"
                value={quoteRef}
                onChange={(e) => setQuoteRef(e.target.value)}
                placeholder="e.g. 698cb13e54164c3526c0f8e5"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <input
                type="email"
                value={user?.email || email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                readOnly={!!user?.email}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${user?.email ? 'bg-gray-50' : ''}`}
              />
              {user?.email && (
                <p className="text-xs text-gray-500 mt-1">Using your account email</p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Continue to payment
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have a quote yet?{' '}
            <button onClick={() => navigate('/request-a-quote')} className="text-teal-600 font-medium hover:underline">
              Request a quote
            </button>
          </p>
        </div>
      </div>
    </motion.section>
  )
}
