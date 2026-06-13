import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import ScrollRestoringLink from './ScrollRestoringLink'
import { Menu, X, User, LogOut, Search, Phone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAnnouncement } from '../context/AnnouncementContext'
import SearchModal from './SearchModal'
import { PHONE_MAIN_DISPLAY, PHONE_MAIN_HREF } from '../config/site'
import { buildAccountUrl } from '../utils/authRedirect'
import FallbackImage from './FallbackImage'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, registerAuthModals } = useAuth()

  useEffect(() => {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    registerAuthModals(
      () => navigate(buildAccountUrl({ signIn: true, returnTo })),
      () => navigate(buildAccountUrl({ signUp: true, returnTo })),
    )
  }, [registerAuthModals, navigate, location.pathname, location.search, location.hash])

  const [searchParams] = useSearchParams()

  // Legacy ?signin=1 / ?signup=1 links (e.g. old quote emails on any page) → /account
  useEffect(() => {
    if (isAuthenticated) return
    const wantsSignIn = searchParams.get('signin') === '1'
    const wantsSignUp = searchParams.get('signup') === '1'
    if (!wantsSignIn && !wantsSignUp) return
    if (location.pathname === '/account') return

    const next = new URLSearchParams()
    if (wantsSignIn) next.set('signin', '1')
    if (wantsSignUp) next.set('signup', '1')
    if (location.pathname !== '/') {
      next.set('returnTo', location.pathname)
    }
    navigate(`/account?${next.toString()}`, { replace: true })
  }, [searchParams, isAuthenticated, location.pathname, navigate])

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/services', label: 'Services' },
    { path: '/testimonials', label: 'Reviews' },
    { path: '/faq', label: 'FAQ' },
    { path: '/contact', label: 'Contact' },
  ]

  const isActive = (path) => location.pathname === path

  const { visible: bannerVisible } = useAnnouncement()

  return (
    <nav className={`fixed left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm transition-[top] ${bannerVisible ? 'top-[4vh]' : 'top-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24 md:h-28">
          {/* Logo - 3 steps back from nav menus */}
          <ScrollRestoringLink to="/" className="flex items-center mr-12 lg:mr-16" aria-label="Home">
            <FallbackImage src="/apex-five-logo.png" alt="Apex Five Cleaning Logo" className="h-16 md:h-20 w-auto object-contain" />
          </ScrollRestoringLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <ScrollRestoringLink
                key={link.path}
                to={link.path}
                className={`font-medium transition ${
                  isActive(link.path)
                    ? 'text-teal-600'
                    : 'text-gray-600 hover:text-teal-600'
                }`}
              >
                {link.label}
              </ScrollRestoringLink>
            ))}
            {!isAuthenticated && (
              <ScrollRestoringLink
                to="/account"
                className="p-2.5 rounded-lg text-gray-500 hover:text-teal-600 hover:bg-teal-50 transition"
                title="My account"
                aria-label="My account"
              >
                <User className="w-6 h-6" />
              </ScrollRestoringLink>
            )}
            <ScrollRestoringLink
              to="/request-a-quote"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold"
            >
              Book Now
            </ScrollRestoringLink>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition"
                  >
                    <User className="w-4 h-4 text-teal-600" />
                    <span className="font-medium text-gray-700">{user?.firstName || 'Account'}</span>
                  </button>
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                        aria-hidden="true"
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          My Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            logout()
                            setShowUserMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowSearch(true)}
                  className="ml-2 p-2 text-gray-400 hover:text-teal-600 transition"
                  title="Search"
                  aria-label="Search"
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-gray-400 hover:text-teal-600 transition"
                title="Search"
                aria-label="Search"
              >
                <Search className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <ScrollRestoringLink
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block py-2 font-medium ${
                  isActive(link.path) ? 'text-teal-600' : 'text-gray-600'
                }`}
              >
                {link.label}
              </ScrollRestoringLink>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 font-medium text-teal-600"
                >
                  My Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout()
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full text-left py-2 font-medium text-gray-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <ScrollRestoringLink
                to="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 font-medium text-gray-600"
              >
                <User className="w-4 h-4" />
                Account
              </ScrollRestoringLink>
            )}
            <ScrollRestoringLink
              to="/request-a-quote"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-center mt-3 py-2.5 rounded-lg bg-teal-600 text-white font-semibold"
            >
              Book Now
            </ScrollRestoringLink>
            <a
              href={PHONE_MAIN_HREF}
              className="block text-center mt-2 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium"
            >
              Call {PHONE_MAIN_DISPLAY}
            </a>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => { setShowSearch(true); setIsMobileMenuOpen(false); }}
                className="p-1.5 text-gray-400 hover:text-teal-600 transition"
                title="Search"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-4 left-4 right-4 z-[70]">
        <div className="bg-white/95 backdrop-blur border border-gray-200 shadow-lg rounded-xl p-2 grid grid-cols-2 gap-2">
          <a
            href={PHONE_MAIN_HREF}
            className="inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm"
          >
            <Phone className="w-4 h-4 text-teal-600" />
            Call Now
          </a>
          <ScrollRestoringLink
            to="/request-a-quote"
            className="inline-flex items-center justify-center py-2.5 rounded-lg bg-teal-600 text-white font-semibold text-sm"
          >
            Get a Quote
          </ScrollRestoringLink>
        </div>
      </div>

      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </nav>
  )
}

export default Navbar
