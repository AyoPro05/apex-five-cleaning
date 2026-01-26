import { Link } from 'react-router-dom'
import { Sparkles, MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/apex-five-logo.png" alt="Apex Five Cleaning Logo" className="h-10 w-auto object-contain" />
              <span className="text-xl font-bold text-white">
                Apex Five<span className="text-teal-500">Cleaning</span>
              </span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Professional eco-friendly cleaning services trusted by homeowners across Kent.
              We bring clarity, trust, and exceptional service to every clean.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-teal-500 transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-500 transition">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-500 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.694L2.306 21.75H-.233l7.73-8.835L0 2.25h6.676l4.959 6.56 5.848-6.56zM17.45 19.038h1.828L5.455 3.75H3.54z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-teal-500 transition">Home</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-teal-500 transition">Services</Link>
              </li>
              <li>
                <Link to="/service-areas" className="hover:text-teal-500 transition">Service Areas</Link>
              </li>
              <li>
                <Link to="/testimonials" className="hover:text-teal-500 transition">Reviews</Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-teal-500 transition">Blog</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-teal-500 transition">FAQ</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-teal-500 transition">About Us</Link>
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
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-500" />
                <span>Kent, South East England</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-500" />
                <span>Call for pricing</span>
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
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-500 hover:text-teal-500 transition">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-teal-500 transition">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
