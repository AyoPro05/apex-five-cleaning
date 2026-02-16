import { useState, useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Sparkles, Menu, X, Calculator, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import SignInModal from './SignInModal'
import SignUpModal from './SignUpModal'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
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
    { path: '/faq', label: 'FAQ' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/apex-five-logo.png" alt="Apex Five Cleaning Logo" className="h-10 w-auto object-contain" />
            <span className="text-xl font-bold text-gray-800 hidden sm:inline">
              Apex Five<span className="text-teal-600">Cleaning</span>
            </span>
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
                  to="/request-a-quote"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-lg shadow-teal-600/25 flex items-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  Get a Quote
                </Link>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowSignIn(true)}
                  className="text-gray-600 hover:text-teal-600 font-medium transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignUp(true)}
                  className="text-gray-600 hover:text-teal-600 font-medium transition"
                >
                  Sign Up
                </button>
                <Link
                  to="/request-a-quote"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-lg shadow-teal-600/25 flex items-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  Get a Quote
                </Link>
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
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setShowSignIn(true)
                  }}
                  className="block py-2 font-medium text-gray-600 w-full text-left"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setShowSignUp(true)
                  }}
                  className="block py-2 font-medium text-gray-600 w-full text-left"
                >
                  Sign Up
                </button>
              </>
            )}
            <Link
              to="/request-a-quote"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Get a Quote
            </Link>
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
    </nav>
  )
}

export default Navbar
