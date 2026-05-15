import { useState, useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Menu, X, User, LogOut, Search, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAnnouncement } from '../context/AnnouncementContext'
import SignInModal from './SignInModal'
import SignUpModal from './SignUpModal'
import SearchModal from './SearchModal'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const location = useLocation()
  const { user, isAuthenticated, logout, registerAuthModals } = useAuth()

  useEffect(() => {
    registerAuthModals(() => setShowSignIn(true), () => setShowSignUp(true))
  }, [registerAuthModals])

  const [searchParams] = useSearchParams()
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) sessionStorage.setItem('apex_referral_code', ref)
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get('signup') === '1' && !isAuthenticated) {
      setShowSignUp(true)
    }
  }, [searchParams, isAuthenticated])

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/services', label: 'Services' },
    { path: '/service-areas', label: 'Service Areas' },
    { path: '/testimonials', label: 'Reviews' },
    { path: '/blog', label: 'Blog' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ]

  const isActive = (path) => location.pathname === path

  const { visible: bannerVisible } = useAnnouncement()

  return (
    <nav className={`fixed left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm transition-[top] ${bannerVisible ? 'top-[4vh]' : 'top-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24 md:h-28">
          {/* Logo - 3 steps back from nav menus */}
          <Link to="/" className="flex items-center mr-12 lg:mr-16">
            <img src="/apex-five-logo.png" alt="Apex Five Cleaning Logo" className="h-16 md:h-20 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition ${
                  isActive(link.path)
                    ? 'text-teal-600'
                    : 'text-gray-600 hover:text-teal-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
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
                <Link
                  to="/pay-online"
                  className="bg-amber-500 hover:bg-amber-600 text-gray-900 px-4 py-2.5 rounded-lg font-medium transition whitespace-nowrap"
                >
                  Pay Online
                </Link>
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
              <>
                <Link
                  to="/pay-online"
                  className="bg-amber-500 hover:bg-amber-600 text-gray-900 px-4 py-2.5 rounded-lg font-medium transition whitespace-nowrap"
                >
                  Pay Online
                </Link>
                <button
                  type="button"
                  onClick={() => setShowSignIn(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800 transition whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4 flex-shrink-0" />
                  Login
                </button>
                <button
                  onClick={() => setShowSearch(true)}
                  className="ml-2 p-2 text-gray-400 hover:text-teal-600 transition"
                  title="Search"
                  aria-label="Search"
                >
                  <Search className="w-6 h-6" />
                </button>
              </>
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
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block py-2 font-medium ${
                  isActive(link.path) ? 'text-teal-600' : 'text-gray-600'
                }`}
              >
                {link.label}
              </Link>
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
                <Link
                  to="/pay-online"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 font-medium text-amber-600 w-full text-left whitespace-nowrap"
                >
                  Pay Online
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/pay-online"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 font-medium text-amber-600 w-full text-left whitespace-nowrap"
                >
                  Pay Online
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignIn(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:border-teal-400 hover:bg-teal-50"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
              </>
            )}
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

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSwitchToSignUp={() => setShowSignUp(true)}
      />
      <SignUpModal
        isOpen={showSignUp}
        onClose={() => setShowSignUp(false)}
        onSwitchToSignIn={() => setShowSignIn(true)}
      />
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </nav>
  )
}

export default Navbar
