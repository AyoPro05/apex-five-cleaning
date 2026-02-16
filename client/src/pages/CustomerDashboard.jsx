import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  User,
  MapPin,
  Bell,
  Gift,
  FileText,
} from 'lucide-react'

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

const apiUrl = import.meta.env.VITE_API_URL || ''

export default function CustomerDashboard() {
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboard, setDashboard] = useState(null)
  const [referral, setReferral] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWithAuth = (path) =>
    fetch(`${apiUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } })

  useEffect(() => {
    if (!token) return
    const load = async () => {
      setLoading(true)
      try {
        const [d, r, a] = await Promise.all([
          fetchWithAuth('/api/customer/dashboard').then((r) => r.json()),
          fetchWithAuth('/api/customer/referral').then((r) => r.json()),
          fetchWithAuth('/api/customer/addresses').then((r) => r.json()),
        ])
        if (d.success) setDashboard(d.dashboard)
        if (r.success) setReferral(r.referral)
        if (a.success) setAddresses(a.addresses || [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [token])

  useEffect(() => {
    if (!token) return
    if (activeTab === 'bookings') {
      fetchWithAuth('/api/bookings').then((r) => r.json()).then((d) => d.success && setBookings(d.bookings || []))
    }
    if (activeTab === 'payments') {
      fetchWithAuth('/api/payments').then((r) => r.json()).then((d) => d.success && setPayments(d.payments || []))
    }
  }, [activeTab, token])

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.firstName || 'Member'}
        </h1>
        <p className="text-gray-600 mb-8">Manage your account, bookings, and referrals</p>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                    activeTab === tab.id
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 bg-white rounded-xl shadow p-6 sm:p-8">
            {loading && activeTab === 'overview' && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
              </div>
            )}
            {activeTab === 'overview' && !loading && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Dashboard Overview</h2>
                {dashboard && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-teal-50 rounded-lg p-4">
                      <p className="text-sm text-teal-600 font-medium">Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboard.bookingsCount || 0}</p>
                    </div>
                    <div className="bg-teal-50 rounded-lg p-4">
                      <p className="text-sm text-teal-600 font-medium">Total Spent</p>
                      <p className="text-2xl font-bold text-gray-900">£{(dashboard.totalSpent || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-sm text-amber-600 font-medium">Referral Points</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboard.referralPoints || 0}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-sm text-amber-600 font-medium">Discount</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboard.discountPercent || 0}%</p>
                    </div>
                  </div>
                )}
                <p className="text-gray-600 mb-4">You can manage:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Bookings – view and manage your cleaning appointments</li>
                  <li>Payments – payment history and invoices</li>
                  <li>Profile – update your details</li>
                  <li>Saved Addresses – manage your property addresses (including postcode)</li>
                  <li>Notifications – email and booking preferences</li>
                  <li>Refer a Friend – earn 5 points per referral (20 points = 10% discount)</li>
                  <li>Quote Requests – view and submit new quotes</li>
                </ul>
              </div>
            )}
            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">My Bookings</h2>
                {bookings.length === 0 ? (
                  <p className="text-gray-600">No bookings yet.</p>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b) => (
                      <div key={b._id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">{b.serviceName}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(b.date).toLocaleDateString('en-GB')} · £{b.totalPrice?.toFixed(2)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          b.status === 'completed' ? 'bg-green-100 text-green-800' :
                          b.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'payments' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment History</h2>
                {payments.length === 0 ? (
                  <p className="text-gray-600">No payments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div key={p.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">{p.amountDisplay}</p>
                          <p className="text-sm text-gray-600">
                            {p.booking?.serviceName} · {new Date(p.createdAt).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          p.status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Profile</h2>
                <p className="text-gray-600">Update your profile details.</p>
              </div>
            )}
            {activeTab === 'addresses' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Saved Addresses</h2>
                <p className="text-gray-600 mb-4">Manage your saved addresses with full details including postcode.</p>
                {addresses.length === 0 ? (
                  <p className="text-gray-600">No saved addresses yet.</p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((a) => (
                      <div key={a._id} className="border rounded-lg p-4">
                        <p className="font-semibold text-gray-900">{a.label}</p>
                        <p className="text-gray-600">{a.street}, {a.city}, {a.postCode} {a.country}</p>
                        {a.isDefault && <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded mt-2 inline-block">Default</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Preferences</h2>
                <p className="text-gray-600">Choose how you want to receive updates.</p>
              </div>
            )}
            {activeTab === 'referral' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Refer a Friend</h2>
                <p className="text-gray-600 mb-4">
                  Earn 5 points for each friend who completes their first booking. 20 points = 10%
                  discount on your next clean or invoice.
                </p>
                {referral && (
                  <div className="space-y-4">
                    <div className="bg-teal-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-teal-600">Your referral code</p>
                      <p className="text-2xl font-bold text-gray-900 font-mono">{referral.code}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Your referral link</p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={referral.link}
                          className="flex-1 px-3 py-2 border rounded-lg bg-white text-sm"
                        />
                        <button
                          onClick={() => navigator.clipboard?.writeText(referral.link)}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      Points: <strong>{referral.points}</strong> · {referral.discountPercent}% discount available
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'quotes' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quote Requests</h2>
                <p className="text-gray-600">
                  View your quote requests or submit a new one if your requirements have changed.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
