import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { get, post, patch, del } from '../utils/apiClient'
import { setQuotePrefill } from '../utils/quotePrefill'
import { whatsappHref } from '../config/site'
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  User,
  MapPin,
  Bell,
  Gift,
  FileText,
  Copy,
  Check,
  Plus,
  Trash2,
  Pencil,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

const POINTS_FOR_10_PERCENT = 20

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'referral', label: 'Refer a Friend', icon: Gift },
  { id: 'quotes', label: 'Quote Requests', icon: FileText },
]

const QUOTE_STATUS = {
  new: { label: 'Submitted', className: 'bg-gray-100 text-gray-800' },
  contacted: { label: 'In review', className: 'bg-blue-100 text-blue-800' },
  converted: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Closed', className: 'bg-red-100 text-red-800' },
}

const SERVICE_LABELS = {
  residential: 'Residential',
  'end-of-tenancy': 'End of tenancy',
  airbnb: 'Airbnb',
  commercial: 'Commercial',
}

const BOOKING_STATUS_META = {
  draft: { label: 'Awaiting schedule', className: 'bg-amber-100 text-amber-800' },
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
  'in-progress': { label: 'In progress', className: 'bg-indigo-100 text-indigo-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  rescheduled: { label: 'Rescheduled', className: 'bg-purple-100 text-purple-800' },
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function memberSince(createdAt) {
  if (!createdAt) return null
  const year = new Date(createdAt).getFullYear()
  return Number.isFinite(year) ? year : null
}

function profileIncomplete(profile) {
  if (!profile) return true
  const hasPhone = profile.phone && String(profile.phone).length >= 10
  const hasAddress =
    profile.address?.street && profile.address?.city && profile.address?.postCode
  return !hasPhone || !hasAddress
}

function apiErrorMessage(err) {
  const status = err?.response?.status
  const msg = err?.response?.data?.message || err?.response?.data?.error
  if (status === 401) {
    return msg || 'Please sign in again or verify your email address.'
  }
  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  return msg || err?.message || 'Something went wrong.'
}

async function fetchCustomerGet(endpoint) {
  try {
    const data = await get(endpoint)
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err), err }
  }
}

function buildQuotePrefillFromUser(profile, defaultAddress) {
  const prefill = {
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  }
  if (defaultAddress) {
    prefill.address = [defaultAddress.street, defaultAddress.city].filter(Boolean).join(', ')
    prefill.postcode = defaultAddress.postCode || ''
  } else if (profile?.address?.street) {
    prefill.address = [profile.address.street, profile.address.city].filter(Boolean).join(', ')
    prefill.postcode = profile.address.postCode || ''
  }
  return prefill
}

function EmptyState({ title, description, actionLabel, onAction, to }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-gray-600 mt-2 text-sm max-w-md mx-auto">{description}</p>
      {actionLabel && (onAction || to) && (
        to ? (
          <Link
            to={to}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
          >
            {actionLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
          >
            {actionLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
        )
      )}
    </div>
  )
}

export default function CustomerDashboard() {
  const { user, token, refreshUser, persistUser, openSignIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboard, setDashboard] = useState(null)
  const [referral, setReferral] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [quotes, setQuotes] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [copied, setCopied] = useState(false)
  const [referralLoading, setReferralLoading] = useState(false)

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    postCode: '',
    country: 'UK',
  })

  const [notifPrefs, setNotifPrefs] = useState({
    notificationsEnabled: true,
    bookingConfirmation: true,
    bookingReminder: true,
    paymentReceipt: true,
    promotional: false,
  })

  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    street: '',
    city: '',
    postCode: '',
    country: 'UK',
    isDefault: false,
  })
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [showAddressForm, setShowAddressForm] = useState(false)

  const setTab = useCallback(
    (id) => {
      setActiveTab(id)
      setMessage({ type: '', text: '' })
      const next = new URLSearchParams(searchParams)
      if (id === 'overview') next.delete('tab')
      else next.set('tab', id)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && tabs.some((t) => t.id === tab)) setActiveTab(tab)
  }, [searchParams])

  const syncProfileForm = useCallback((p) => {
    if (!p) return
    setProfile(p)
    setProfileForm({
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      phone: p.phone || '',
      street: p.address?.street || '',
      city: p.address?.city || '',
      postCode: p.address?.postCode || '',
      country: p.address?.country || 'UK',
    })
    setNotifPrefs({
      notificationsEnabled: p.notificationsEnabled !== false,
      bookingConfirmation: p.emailNotifications?.bookingConfirmation !== false,
      bookingReminder: p.emailNotifications?.bookingReminder !== false,
      paymentReceipt: p.emailNotifications?.paymentReceipt !== false,
      promotional: p.emailNotifications?.promotional === true,
    })
  }, [])

  const loadReferral = useCallback(async () => {
    setReferralLoading(true)
    const result = await fetchCustomerGet('/api/customer/referral')
    if (result.ok && result.data?.success) {
      setReferral(result.data.referral)
      setMessage((prev) =>
        prev.type === 'error' && prev.text?.includes('referral') ? { type: '', text: '' } : prev
      )
      setReferralLoading(false)
      return true
    }
    setMessage({
      type: 'error',
      text: result.error || 'Could not load referral details. Please try again.',
    })
    setReferralLoading(false)
    return false
  }, [])

  const loadCore = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setMessage({ type: '', text: '' })

    const [dashRes, refRes, addrRes, freshUser] = await Promise.all([
      fetchCustomerGet('/api/customer/dashboard'),
      fetchCustomerGet('/api/customer/referral'),
      fetchCustomerGet('/api/customer/addresses'),
      refreshUser().then(
        (u) => ({ ok: !!u, user: u }),
        (err) => ({ ok: false, error: apiErrorMessage(err) }),
      ),
    ])

    let loaded = 0

    if (dashRes.ok && dashRes.data?.success) {
      setDashboard(dashRes.data.dashboard)
      loaded += 1
    }
    if (refRes.ok && refRes.data?.success) {
      setReferral(refRes.data.referral)
      loaded += 1
    }
    if (addrRes.ok && addrRes.data?.success) {
      setAddresses(addrRes.data.addresses || [])
      loaded += 1
    }
    if (freshUser?.ok && freshUser.user) {
      syncProfileForm(freshUser.user)
      loaded += 1
    } else if (user) {
      syncProfileForm(user)
    }

    if (loaded === 0) {
      const detail =
        refRes.error ||
        dashRes.error ||
        addrRes.error ||
        freshUser?.error ||
        'Could not load your account. Please refresh the page.'
      setMessage({ type: 'error', text: detail })
    }

    setLoading(false)
  }, [token, refreshUser, syncProfileForm, user])

  useEffect(() => {
    loadCore()
  }, [token])

  useEffect(() => {
    if (activeTab === 'referral' && token && !referral && !loading) {
      loadReferral()
    }
  }, [activeTab, token, referral, loading, loadReferral])

  useEffect(() => {
    if (!token) return
    const loadTab = async () => {
      setTabLoading(true)
      try {
        if (activeTab === 'bookings') {
          const d = await get('/api/bookings')
          if (d.success) setBookings(d.bookings || [])
        }
        if (activeTab === 'payments') {
          const d = await get('/api/payments')
          if (d.success) setPayments(d.payments || [])
        }
        if (activeTab === 'quotes') {
          const d = await get('/api/customer/quotes')
          if (d.success) setQuotes(d.quotes || [])
        }
      } catch {
        /* tab-specific errors shown inline */
      }
      setTabLoading(false)
    }
    if (['bookings', 'payments', 'quotes'].includes(activeTab)) loadTab()
  }, [activeTab, token])

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) || addresses[0],
    [addresses]
  )

  const referralPoints = dashboard?.referralPoints ?? referral?.points ?? 0
  const referralProgress = Math.min(100, (referralPoints / POINTS_FOR_10_PERCENT) * 100)
  const pointsToNext =
    referralPoints >= POINTS_FOR_10_PERCENT
      ? 0
      : POINTS_FOR_10_PERCENT - (referralPoints % POINTS_FOR_10_PERCENT)

  const upcomingBooking = useMemo(() => {
    const now = Date.now()
    return bookings
      .filter((b) => b.date && new Date(b.date).getTime() >= now && b.status !== 'cancelled')
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0]
  }, [bookings])

  const lastCompletedBooking = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  }, [bookings])

  const latestQuote = useMemo(() => {
    return quotes.length ? quotes[0] : null
  }, [quotes])

  useEffect(() => {
    if (activeTab !== 'overview' || !token) return
    get('/api/bookings')
      .then((d) => d.success && setBookings(d.bookings || []))
      .catch(() => {})
    get('/api/customer/quotes')
      .then((d) => d.success && setQuotes(d.quotes || []))
      .catch(() => {})
  }, [activeTab, token])

  const goToQuote = (extra = {}) => {
    setQuotePrefill({ ...buildQuotePrefillFromUser(profile || user, defaultAddress), ...extra })
    navigate('/request-a-quote')
  }

  const handleBookAgain = () => {
    const b = lastCompletedBooking
    goToQuote({
      serviceType: b?.serviceId || b?.serviceName || '',
    })
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const data = await patch('/api/auth/me', {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phone: profileForm.phone.replace(/\D/g, ''),
        address: {
          street: profileForm.street.trim(),
          city: profileForm.city.trim(),
          postCode: profileForm.postCode.trim().toUpperCase(),
          country: profileForm.country.trim() || 'UK',
        },
      })
      if (data.success && data.user) {
        syncProfileForm(data.user)
        persistUser(data.user)
        setMessage({ type: 'success', text: 'Profile saved.' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Could not save profile.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not save profile.' })
    }
    setSaving(false)
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const data = await patch('/api/customer/preferences', {
        notificationsEnabled: notifPrefs.notificationsEnabled,
        emailNotifications: {
          bookingConfirmation: notifPrefs.bookingConfirmation,
          bookingReminder: notifPrefs.bookingReminder,
          paymentReceipt: notifPrefs.paymentReceipt,
          promotional: notifPrefs.promotional,
        },
      })
      if (data.success && data.user) {
        syncProfileForm(data.user)
        persistUser(data.user)
        setMessage({ type: 'success', text: 'Notification preferences saved.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not save preferences.' })
    }
    setSaving(false)
  }

  const resetAddressForm = () => {
    setAddressForm({
      label: 'Home',
      street: '',
      city: '',
      postCode: '',
      country: 'UK',
      isDefault: addresses.length === 0,
    })
    setEditingAddressId(null)
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = {
        label: addressForm.label.trim() || 'Home',
        street: addressForm.street.trim(),
        city: addressForm.city.trim(),
        postCode: addressForm.postCode.trim(),
        country: addressForm.country.trim() || 'UK',
        isDefault: addressForm.isDefault,
      }
      const data = editingAddressId
        ? await patch(`/api/customer/addresses/${editingAddressId}`, payload)
        : await post('/api/customer/addresses', payload)
      if (data.success) {
        const list = await get('/api/customer/addresses')
        if (list.success) setAddresses(list.addresses || [])
        setShowAddressForm(false)
        resetAddressForm()
        setMessage({ type: 'success', text: editingAddressId ? 'Address updated.' : 'Address saved.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not save address.' })
    }
    setSaving(false)
  }

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Remove this saved address?')) return
    try {
      await del(`/api/customer/addresses/${id}`)
      const list = await get('/api/customer/addresses')
      if (list.success) setAddresses(list.addresses || [])
      setMessage({ type: 'success', text: 'Address removed.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not remove address.' })
    }
  }

  const startEditAddress = (a) => {
    setEditingAddressId(a._id)
    setAddressForm({
      label: a.label || 'Home',
      street: a.street || '',
      city: a.city || '',
      postCode: a.postCode || '',
      country: a.country || 'UK',
      isDefault: !!a.isDefault,
    })
    setShowAddressForm(true)
  }

  const copyReferralLink = async () => {
    if (!referral?.link) return
    try {
      await navigator.clipboard.writeText(referral.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMessage({ type: 'error', text: 'Could not copy link. Select and copy manually.' })
    }
  }

  const shareReferralWhatsApp = () => {
    if (!referral?.link) return
    const text = `I use Apex Five Cleaning and thought you might too. Use my link for £5 off your first clean — we both benefit: ${referral.link}`
    window.open(whatsappHref(text), '_blank', 'noopener,noreferrer')
  }

  const sinceYear = memberSince(profile?.createdAt || user?.createdAt)
  const incomplete = profileIncomplete(profile || user)

  const StatusBanner = message.text ? (
    <div
      className={`mb-6 rounded-lg px-4 py-3 text-sm ${
        message.type === 'success'
          ? 'bg-green-50 text-green-800 border border-green-200'
          : 'bg-red-50 text-red-800 border border-red-200'
      }`}
      role="status"
    >
      {message.text}
    </div>
  ) : null

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.firstName || user?.firstName || 'Member'}
            </h1>
            <p className="text-gray-600 mt-1">
              Your cleaning hub — bookings, quotes, and rewards in one place.
              {sinceYear ? ` Member since ${sinceYear}.` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => goToQuote()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            Get a quote
          </button>
        </div>

        {incomplete && activeTab === 'overview' && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-amber-900">
              Complete your profile so we can reach you and quote faster next time.
            </p>
            <button
              type="button"
              onClick={() => setTab('profile')}
              className="text-sm font-semibold text-amber-900 underline hover:no-underline shrink-0"
            >
              Complete profile
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                    activeTab === tab.id
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 bg-white rounded-xl shadow p-6 sm:p-8 min-h-[320px]">
            {StatusBanner}

            {loading && activeTab === 'overview' && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
              </div>
            )}

            {activeTab === 'overview' && !loading && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">At a glance</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-teal-50 rounded-lg p-4">
                      <p className="text-sm text-teal-700 font-medium">Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboard?.bookingsCount ?? 0}</p>
                    </div>
                    <div className="bg-teal-50 rounded-lg p-4">
                      <p className="text-sm text-teal-700 font-medium">Total spent</p>
                      <p className="text-2xl font-bold text-gray-900">
                        £{(dashboard?.totalSpent ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-sm text-amber-700 font-medium">Referral points</p>
                      <p className="text-2xl font-bold text-gray-900">{referralPoints}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-sm text-amber-700 font-medium">Your discount</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboard?.discountPercent ?? 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-900">Referral reward progress</span>
                    <span className="text-gray-600">
                      {referralPoints} / {POINTS_FOR_10_PERCENT} points
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all"
                      style={{ width: `${referralProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {pointsToNext > 0
                      ? `${pointsToNext} more point${pointsToNext === 1 ? '' : 's'} until your next 10% discount.`
                      : 'You have unlocked the maximum 10% referral discount.'}
                  </p>
                  {referral?.code && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={copyReferralLink}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy referral link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('referral')}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Refer a friend
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-500">Next booking</p>
                    {upcomingBooking ? (
                      <>
                        <p className="font-semibold text-gray-900 mt-1">
                          {upcomingBooking.serviceName || SERVICE_LABELS[upcomingBooking.serviceId]}
                        </p>
                        <p className="text-sm text-gray-600">{formatDate(upcomingBooking.date)}</p>
                      </>
                    ) : (
                      <p className="text-gray-600 mt-1 text-sm">No upcoming cleans scheduled.</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-500">Latest quote</p>
                    {latestQuote ? (
                      <>
                        <p className="font-semibold text-gray-900 mt-1">
                          {latestQuote.reference || 'Quote'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {QUOTE_STATUS[latestQuote.status]?.label || latestQuote.status} ·{' '}
                          {formatDate(latestQuote.createdAt)}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-600 mt-1 text-sm">No quotes yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => goToQuote()}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                    >
                      Request a quote
                    </button>
                    {lastCompletedBooking && (
                      <button
                        type="button"
                        onClick={handleBookAgain}
                        className="px-4 py-2 border border-teal-600 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-50"
                      >
                        Book again
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setTab('addresses')}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Manage addresses
                    </button>
                    <Link
                      to="/pay-online"
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Pay online
                    </Link>
                  </div>
                </div>

                <p className="text-xs text-gray-500 border-t border-gray-100 pt-4">
                  Eco-friendly products · Fully insured · Professional cleaning you can trust
                </p>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">My bookings</h2>
                  {lastCompletedBooking && (
                    <button
                      type="button"
                      onClick={handleBookAgain}
                      className="text-sm font-medium text-teal-600 hover:text-teal-700"
                    >
                      Book again
                    </button>
                  )}
                </div>
                {tabLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
                  </div>
                ) : bookings.length === 0 ? (
                  <EmptyState
                    title="No bookings yet"
                    description="When you book a clean with us, it will show up here. Start with a quick quote — we will tailor everything to your home."
                    actionLabel="Get a free quote"
                    onAction={() => goToQuote()}
                  />
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b) => {
                      const statusMeta = BOOKING_STATUS_META[b.status] || BOOKING_STATUS_META.pending
                      return (
                        <div
                          key={b._id}
                          className="border rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {b.serviceName || SERVICE_LABELS[b.serviceId] || 'Cleaning'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(b.date)}
                              {b.totalPrice != null ? ` · £${Number(b.totalPrice).toFixed(2)}` : ''}
                            </p>
                          </div>
                          <span
                            className={`self-start px-3 py-1 rounded-full text-sm ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment history</h2>
                {tabLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
                  </div>
                ) : payments.length === 0 ? (
                  <EmptyState
                    title="No payments yet"
                    description="Payments for approved quotes and bookings appear here. Already have an approved quote? Pay securely online."
                    actionLabel="Pay online"
                    to="/pay-online"
                  />
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        className="border rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{p.amountDisplay}</p>
                          <p className="text-sm text-gray-600">
                            {p.booking?.serviceName || 'Payment'} · {formatDate(p.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`self-start px-3 py-1 rounded-full text-sm ${
                            p.status === 'succeeded'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {p.statusLabel || p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Profile</h2>
                <p className="text-gray-600 text-sm mb-6">
                  Keep your details up to date for faster quotes and booking confirmations.
                </p>
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                      <input
                        type="text"
                        required
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                      <input
                        type="text"
                        required
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      readOnly
                      value={profile?.email || user?.email || ''}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      To change your email, contact us and we will update it for you.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <fieldset className="border-t border-gray-100 pt-4">
                    <legend className="text-sm font-medium text-gray-900 mb-3">Home address</legend>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Street address"
                        value={profileForm.street}
                        onChange={(e) => setProfileForm((f) => ({ ...f, street: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                      <div className="grid sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="City"
                          value={profileForm.city}
                          onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                        />
                        <input
                          type="text"
                          placeholder="Postcode"
                          value={profileForm.postCode}
                          onChange={(e) => setProfileForm((f) => ({ ...f, postCode: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </fieldset>
                  <p className="text-sm text-gray-600">
                    Need a new password?{' '}
                    <button
                      type="button"
                      onClick={() => openSignIn?.()}
                      className="text-teal-600 font-medium hover:underline"
                    >
                      Sign in and use Forgot password
                    </button>
                  </p>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save profile'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Saved addresses</h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Save once — use on every quote without retyping.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetAddressForm()
                      setAddressForm((f) => ({ ...f, isDefault: addresses.length === 0 }))
                      setShowAddressForm(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add address
                  </button>
                </div>

                {showAddressForm && (
                  <form
                    onSubmit={handleSaveAddress}
                    className="mb-6 p-4 border border-teal-100 bg-teal-50/30 rounded-lg space-y-3 max-w-lg"
                  >
                    <p className="font-medium text-gray-900">
                      {editingAddressId ? 'Edit address' : 'New address'}
                    </p>
                    <input
                      type="text"
                      placeholder="Label (e.g. Home)"
                      value={addressForm.label}
                      onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Street"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm((f) => ({ ...f, street: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Postcode"
                        value={addressForm.postCode}
                        onChange={(e) => setAddressForm((f) => ({ ...f, postCode: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) =>
                          setAddressForm((f) => ({ ...f, isDefault: e.target.checked }))
                        }
                      />
                      Set as default address
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false)
                          resetAddressForm()
                        }}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 && !showAddressForm ? (
                  <EmptyState
                    title="No saved addresses"
                    description="Add your home or rental address once. We will pre-fill it whenever you request a quote."
                    actionLabel="Add your first address"
                    onAction={() => {
                      resetAddressForm()
                      setAddressForm((f) => ({ ...f, isDefault: true }))
                      setShowAddressForm(true)
                    }}
                  />
                ) : (
                  <div className="space-y-3">
                    {addresses.map((a) => (
                      <div key={a._id} className="border rounded-lg p-4 flex justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">{a.label}</p>
                          <p className="text-gray-600 text-sm">
                            {a.street}, {a.city}, {a.postCode} {a.country}
                          </p>
                          {a.isDefault && (
                            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded mt-2 inline-block">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditAddress(a)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            aria-label="Edit address"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(a._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            aria-label="Delete address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Notification preferences</h2>
                <p className="text-gray-600 text-sm mb-6">
                  Choose which emails you would like to receive.
                </p>
                <div className="space-y-4 max-w-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={notifPrefs.notificationsEnabled}
                      onChange={(e) =>
                        setNotifPrefs((p) => ({ ...p, notificationsEnabled: e.target.checked }))
                      }
                    />
                    <span>
                      <span className="font-medium text-gray-900">Email notifications</span>
                      <span className="block text-sm text-gray-600">
                        Master switch for account and booking emails
                      </span>
                    </span>
                  </label>
                  <div className="border-t border-gray-100 pt-4 space-y-3 pl-1">
                    {[
                      ['bookingConfirmation', 'Booking confirmations', 'When a booking is confirmed'],
                      ['bookingReminder', 'Booking reminders', 'Friendly reminders before your clean'],
                      ['paymentReceipt', 'Payment receipts', 'Receipts after you pay online'],
                      ['promotional', 'Offers & tips', 'Occasional news and seasonal offers'],
                    ].map(([key, title, desc]) => (
                      <label key={key} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1"
                          disabled={!notifPrefs.notificationsEnabled}
                          checked={notifPrefs[key]}
                          onChange={(e) => setNotifPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                        />
                        <span>
                          <span className="font-medium text-gray-900">{title}</span>
                          <span className="block text-sm text-gray-600">{desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save preferences'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'referral' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Refer a friend and share £10</h2>
                <p className="text-gray-600 mb-6">
                  For every friend who books, you get £5 off a window clean and they get £5 off their
                  first clean.
                </p>
                {referral ? (
                  <div className="space-y-4 max-w-xl">
                    <div className="bg-teal-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-teal-700">Your referral code</p>
                      <p className="text-2xl font-bold text-gray-900 font-mono">{referral.code}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Your referral link</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          readOnly
                          value={referral.link}
                          className="flex-1 px-3 py-2 border rounded-lg bg-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={copyReferralLink}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={shareReferralWhatsApp}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50"
                    >
                      Share on WhatsApp
                    </button>
                    {referral.referrals?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">Referral history</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {referral.referrals.slice(0, 5).map((r) => (
                            <li key={r._id}>
                              {formatDate(r.createdAt)} — {r.status || 'pending'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    {referralLoading ? (
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-600 mb-3">Referral details could not be loaded.</p>
                        <button
                          type="button"
                          onClick={loadReferral}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                        >
                          Try again
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quotes' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Quote requests</h2>
                  <button
                    type="button"
                    onClick={() => goToQuote()}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                  >
                    New quote request
                  </button>
                </div>
                {tabLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
                  </div>
                ) : quotes.length === 0 ? (
                  <EmptyState
                    title="No quote requests yet"
                    description="Tell us about your property and we will send a tailored quote. Your details can be pre-filled from your profile."
                    actionLabel="Start a quote"
                    onAction={() => goToQuote()}
                  />
                ) : (
                  <div className="space-y-3">
                    {quotes.map((q) => {
                      const st = QUOTE_STATUS[q.status] || QUOTE_STATUS.new
                      const canPay =
                        q.status === 'converted' && q.approvedAmount > 0
                      return (
                        <div key={q._id} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {q.reference || 'Quote'} ·{' '}
                                {SERVICE_LABELS[q.serviceType] || q.serviceType}
                              </p>
                              <p className="text-sm text-gray-600">
                                {q.propertyType} · {q.bedrooms} bed · {formatDate(q.createdAt)}
                              </p>
                              {q.approvedAmount > 0 && (
                                <p className="text-sm font-medium text-teal-700 mt-1">
                                  Approved: £{Number(q.approvedAmount).toFixed(2)}
                                </p>
                              )}
                            </div>
                            <span className={`self-start px-3 py-1 rounded-full text-sm ${st.className}`}>
                              {st.label}
                            </span>
                          </div>
                          {canPay && (
                            <Link
                              to="/pay-online"
                              className="inline-block mt-3 text-sm font-medium text-teal-600 hover:underline"
                            >
                              Pay online with your account email
                            </Link>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
