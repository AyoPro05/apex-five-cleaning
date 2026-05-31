import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  FileText,
  Gift,
  MapPin,
  User,
} from 'lucide-react'
import SEO from '../components/SEO'
import SignInForm from '../components/SignInForm'
import SignUpForm from '../components/SignUpForm'
import { useAuth } from '../context/AuthContext'
import { sanitizeReturnTo } from '../utils/authRedirect'

const benefits = [
  {
    icon: FileText,
    title: 'Track quotes & approvals',
    description: 'See when your quote is reviewed, approved, and ready to pay.',
  },
  {
    icon: CreditCard,
    title: 'Pay securely online',
    description: 'Complete payment for approved quotes and keep receipts in one place.',
  },
  {
    icon: Calendar,
    title: 'Manage bookings',
    description: 'View upcoming cleans, history, and booking details anytime.',
  },
  {
    icon: MapPin,
    title: 'Save your addresses',
    description: 'Rebook faster with saved property details for repeat services.',
  },
  {
    icon: Gift,
    title: 'Refer friends & earn',
    description: 'Share your referral link and earn rewards when friends book.',
  },
]

export default function Account() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated, loading } = useAuth()
  const returnTo = sanitizeReturnTo(searchParams.get('returnTo'))

  const initialTab = useMemo(() => {
    if (searchParams.get('signup') === '1') return 'signup'
    return 'signin'
  }, [searchParams])

  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (loading || !isAuthenticated) return
    navigate(returnTo, { replace: true })
  }, [loading, isAuthenticated, navigate, returnTo])

  const switchTab = (tab) => {
    setActiveTab(tab)
    const next = new URLSearchParams(searchParams)
    next.delete('signin')
    next.delete('signup')
    if (tab === 'signup') next.set('signup', '1')
    if (tab === 'signin') next.set('signin', '1')
    setSearchParams(next, { replace: true })
  }

  const handleLoginSuccess = () => {
    navigate(returnTo, { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <>
      <SEO
        title="My Account"
        description="Log in or create your Apex Five Cleaning account to manage quotes, bookings, and payments."
        path="/account"
        noindex
      />

      <section className="pt-28 pb-20 min-h-screen bg-gradient-to-b from-teal-50/80 via-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-100 text-teal-700 mb-4">
              <User className="w-7 h-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">My account</h1>
            <p className="mt-3 text-gray-600">
              Log in or create a free account to manage quotes, bookings, and payments.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Why create an account?</h2>
              <p className="text-gray-600 mb-6 text-sm">
                Received a &ldquo;quote approved&rdquo; email? Use the same email address when you sign up
                to pay online and manage your booking.
              </p>
              <ul className="space-y-5">
                {benefits.map(({ icon: Icon, title, description }) => (
                  <li key={title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8 p-4 rounded-xl bg-teal-50 border border-teal-100">
                <p className="text-sm text-teal-900 font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  Already approved?{' '}
                  <Link to="/pay-online" className="underline hover:no-underline font-semibold">
                    Pay online
                  </Link>{' '}
                  with your quote reference and email.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => switchTab('signin')}
                  className={`flex-1 py-4 text-sm font-semibold transition ${
                    activeTab === 'signin'
                      ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/50'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('signup')}
                  className={`flex-1 py-4 text-sm font-semibold transition ${
                    activeTab === 'signup'
                      ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/50'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  Sign up
                </button>
              </div>

              <div className="p-8">
                {activeTab === 'signin' ? (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
                    <p className="text-gray-600 text-sm mb-6">Access your dashboard, bookings, and payments.</p>
                    <SignInForm
                      returnTo={returnTo}
                      onSuccess={handleLoginSuccess}
                      onSwitchToSignUp={() => switchTab('signup')}
                      idPrefix="account-signin"
                    />
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Create your account</h2>
                    <p className="text-gray-600 text-sm mb-6">Free to join — verify your email, then log in.</p>
                    <SignUpForm
                      onSwitchToSignIn={() => switchTab('signin')}
                      idPrefix="account-signup"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
