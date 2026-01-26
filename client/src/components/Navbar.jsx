import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Menu, X, Calculator } from 'lucide-react'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

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
            <Link
              to="/request-a-quote"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-lg shadow-teal-600/25 flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Get a Quote
            </Link>
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
    </nav>
  )
}

export default Navbar
