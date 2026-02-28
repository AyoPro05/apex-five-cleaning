import { useState, useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Menu, X, Calculator, User, LogOut, Facebook, Instagram, Search } from 'lucide-react'
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
    { path: '/blog', label: 'Blog' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ]

  const isActive = (path) => location.pathname === path

  const { visible: bannerVisible } = useAnnouncement()

  return (
    <nav className={`fixed left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm transition-[top] ${bannerVisible ? 'top-[4vh]' : 'top-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo - 3 steps back from nav menus */}
          <Link to="/" className="flex items-center gap-2 mr-12 lg:mr-16">
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
                  to="/pay-online"
                  className="bg-amber-500 hover:bg-amber-600 text-gray-900 px-4 py-2.5 rounded-lg font-medium transition whitespace-nowrap"
                >
                  Pay Online
                </Link>
                <Link
                  to="/request-a-quote"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-lg shadow-teal-600/25 flex items-center gap-2 whitespace-nowrap"
                >
                  <Calculator className="w-4 h-4 flex-shrink-0" />
                  Get a Quote
                </Link>
                <div className="flex items-center gap-2 ml-1">
                  <a href="#" className="text-gray-400 hover:text-teal-600 transition p-0.5" title="Facebook" aria-label="Facebook">
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a href="https://www.instagram.com/apexfive01" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-teal-600 transition p-0.5" title="Instagram" aria-label="Instagram">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-teal-600 transition p-0.5" title="X (Twitter)" aria-label="X (Twitter)">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.694L2.306 21.75H-.233l7.73-8.835L0 2.25h6.676l4.959 6.56 5.848-6.56zM17.45 19.038h1.828L5.455 3.75H3.54z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-teal-600 transition p-0.5" title="TikTok" aria-label="TikTok">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.1 1.72 2.89 2.89 0 0 1 5.1-1.72V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 9 20.1a6.34 6.34 0 0 0 5.29-2.61 6.27 6.27 0 0 0 1.19-3.63v-6.16a7.28 7.28 0 0 0 4.81 1.65c.18 0 .37 0 .56-.01v-3.4a4.9 4.9 0 0 1-.56.03z"/>
                    </svg>
                  </a>
                </div>
                <button
                  onClick={() => setShowSearch(true)}
                  className="ml-8 p-2 text-gray-400 hover:text-teal-600 transition"
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
                  className="text-gray-600 hover:text-teal-600 font-medium transition whitespace-nowrap"
                >
                  Login
                </button>
                <Link
                  to="/request-a-quote"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-lg shadow-teal-600/25 flex items-center gap-2 whitespace-nowrap"
                >
                  <Calculator className="w-4 h-4 flex-shrink-0" />
                  Get a Quote
                </Link>
                <div className="flex items-center gap-2 ml-1">
                  <a href="#" className="text-gray-400 hover:text-teal-600 transition p-0.5" title="Facebook" aria-label="Facebook">
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a href="https://www.instagram.com/apexfive01" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-teal-600 transition p-0.5" title="Instagram" aria-label="Instagram">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-teal-600 transition p-0.5" title="X (Twitter)" aria-label="X (Twitter)">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.694L2.306 21.75H-.233l7.73-8.835L0 2.25h6.676l4.959 6.56 5.848-6.56zM17.45 19.038h1.828L5.455 3.75H3.54z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-teal-600 transition p-0.5" title="TikTok" aria-label="TikTok">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.1 1.72 2.89 2.89 0 0 1 5.1-1.72V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 9 20.1a6.34 6.34 0 0 0 5.29-2.61 6.27 6.27 0 0 0 1.19-3.63v-6.16a7.28 7.28 0 0 0 4.81 1.65c.18 0 .37 0 .56-.01v-3.4a4.9 4.9 0 0 1-.56.03z"/>
                    </svg>
                  </a>
                </div>
                <button
                  onClick={() => setShowSearch(true)}
                  className="ml-8 p-2 text-gray-400 hover:text-teal-600 transition"
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
              </>
            ) : null}
            <Link
              to="/pay-online"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 font-medium text-amber-600 w-full text-left whitespace-nowrap"
            >
              Pay Online
            </Link>
            <button
              type="button"
              onClick={() => { setShowSignIn(true); setIsMobileMenuOpen(false); }}
              className="block py-2 font-medium text-gray-600 w-full text-left whitespace-nowrap"
            >
              Login
            </button>
            <Link
              to="/request-a-quote"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Calculator className="w-4 h-4 flex-shrink-0" />
              Get a Quote
            </Link>
            <div className="flex items-center justify-center gap-3 pt-2">
              <a href="#" className="text-gray-400 hover:text-teal-600 transition p-1" title="Facebook" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/apexfive01" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-teal-600 transition p-1" title="Instagram" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-600 transition p-1" title="X (Twitter)" aria-label="X (Twitter)">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.694L2.306 21.75H-.233l7.73-8.835L0 2.25h6.676l4.959 6.56 5.848-6.56zM17.45 19.038h1.828L5.455 3.75H3.54z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-600 transition p-1" title="TikTok" aria-label="TikTok">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.1 1.72 2.89 2.89 0 0 1 5.1-1.72V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 9 20.1a6.34 6.34 0 0 0 5.29-2.61 6.27 6.27 0 0 0 1.19-3.63v-6.16a7.28 7.28 0 0 0 4.81 1.65c.18 0 .37 0 .56-.01v-3.4a4.9 4.9 0 0 1-.56.03z"/>
                </svg>
              </a>
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
