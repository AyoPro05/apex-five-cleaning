import { Phone, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const WHATSAPP_NUMBER = '441622621133'
const PHONE_DISPLAY = '01622 621 133'
const PHONE_LINK = 'tel:+441622621133'

const badges = [
  {
    name: 'Kent County Council',
    text: 'Trading Standards Checked',
    subtext: 'Trader ID K0890',
  },
  {
    name: 'Federation of Master Cleaners',
    text: 'Approved Member',
    subtext: 'FMC Certified',
  },
  {
    name: 'TrustATrader',
    text: 'Trusted Traders',
    subtext: 'TrustATrader.com',
  },
]

export default function TrustSection() {
  const { isAuthenticated, openSignIn } = useAuth()

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#1e4a6f] to-teal-800" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4">
            <Shield className="w-5 h-5 text-teal-200" />
            <span className="text-teal-100 font-medium text-sm uppercase tracking-wider">Trusted & Accredited</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Professionally Approved & Insured
          </h2>
          <p className="text-teal-100/90 max-w-2xl mx-auto">
            Fully vetted by Kent Trading Standards, approved by the Federation of Master Cleaners, and listed on TrustATrader.com.
          </p>
        </div>

        {/* Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-14">
          {badges.map((badge, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10 text-center hover:bg-white/15 transition"
              title={`${badge.name} - ${badge.text}`}
            >
              <div className="w-12 h-12 rounded-full bg-teal-400/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-teal-200 text-xl font-bold">✓</span>
              </div>
              <p className="font-semibold text-white text-lg">{badge.text}</p>
              <p className="text-teal-200/80 text-sm mt-1">{badge.subtext}</p>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-8 border-t border-white/10">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Apex%20Five%20Cleaning%2C%20I'd%20like%20to%20enquire%20about%20your%20services.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-6 py-3 rounded-xl font-semibold transition shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat on WhatsApp
          </a>
          <a
            href={PHONE_LINK}
            className="inline-flex items-center gap-2 text-white/90 hover:text-white font-semibold transition"
          >
            <Phone className="w-5 h-5" />
            {PHONE_DISPLAY}
          </a>
          {!isAuthenticated ? (
            <button
              onClick={openSignIn}
              className="px-6 py-3 border-2 border-white/50 text-white hover:bg-white/10 rounded-xl font-semibold transition"
            >
              Account Login
            </button>
          ) : (
            <Link
              to="/dashboard"
              className="px-6 py-3 border-2 border-white/50 text-white hover:bg-white/10 rounded-xl font-semibold transition"
            >
              My Dashboard
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
