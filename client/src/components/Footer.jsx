import { Link } from 'react-router-dom'
import ScrollRestoringLink from './ScrollRestoringLink'
import { MapPin, Phone, Mail } from 'lucide-react'
import { useCookieConsent } from '../context/CookieConsentContext'
import { PHONE_MAIN_DISPLAY, PHONE_MAIN_HREF, SOCIAL_LINKS, whatsappHref } from '../config/site'
import CompanyAddress from './CompanyAddress'
import FallbackImage from './FallbackImage'
import SocialBrandIcon from './SocialBrandIcon'

const Footer = () => {
  const { openPreferences } = useCookieConsent()
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="inline-flex items-center mb-4 bg-white rounded-lg px-3 py-2 shadow-sm">
              <FallbackImage src="/apex-five-logo.png" alt="Apex Five Cleaning Logo" className="h-14 md:h-16 w-auto object-contain" />
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Professional eco-friendly cleaning services across Kent, London, and Essex.
              We bring clarity, trust, and exceptional service to every clean.
            </p>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_LINKS.map(({ key, label, url }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/90 px-4 py-2 text-sm font-medium text-gray-200 shadow-sm transition hover:border-teal-500 hover:bg-teal-500 hover:text-white"
                  title={label}
                  aria-label={label}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      key === 'facebook'
                        ? 'bg-[#1877F2] text-white'
                        : key === 'instagram'
                          ? 'bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white'
                          : 'bg-black text-white'
                    }`}
                  >
                    <SocialBrandIcon type={key} className="h-5 w-5" />
                  </span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <ScrollRestoringLink to="/" className="hover:text-teal-500 transition">Home</ScrollRestoringLink>
              </li>
              <li>
                <ScrollRestoringLink to="/services" className="hover:text-teal-500 transition">Services</ScrollRestoringLink>
              </li>
              <li>
                <ScrollRestoringLink to="/service-areas" className="hover:text-teal-500 transition">Service Areas</ScrollRestoringLink>
              </li>
              <li>
                <ScrollRestoringLink to="/testimonials" className="hover:text-teal-500 transition">Reviews</ScrollRestoringLink>
              </li>
              <li>
                <ScrollRestoringLink to="/blog" className="hover:text-teal-500 transition">Blog</ScrollRestoringLink>
              </li>
              <li>
                <ScrollRestoringLink to="/faq" className="hover:text-teal-500 transition">FAQ</ScrollRestoringLink>
              </li>
              <li>
                <ScrollRestoringLink to="/about" className="hover:text-teal-500 transition">About Us</ScrollRestoringLink>
              </li>
              <li>
                <Link to="/request-a-quote" className="hover:text-teal-500 transition">Get a Quote</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                <CompanyAddress linkClassName="hover:text-teal-500 transition" />
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-500" />
                <a href={PHONE_MAIN_HREF} className="hover:text-teal-500 transition">{PHONE_MAIN_DISPLAY}</a>
              </li>
              <li className="flex items-center gap-2">
                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-500 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-500" />
                <span>info@apexfivecleaning.co.uk</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; 2024 Apex Five Cleaning. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 sm:gap-6 text-sm justify-center md:justify-end">
            <Link to="/privacy-policy" className="text-gray-500 hover:text-teal-500 transition">Privacy Policy</Link>
            <Link to="/cookie-policy" className="text-gray-500 hover:text-teal-500 transition">Cookie Policy</Link>
            <Link to="/terms-of-service" className="text-gray-500 hover:text-teal-500 transition">Terms of Service</Link>
            <button
              type="button"
              onClick={openPreferences}
              className="text-gray-500 hover:text-teal-500 transition"
            >
              Cookie settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
