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
              <a href="#" className="text-gray-400 hover:text-teal-500 transition" title="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/apexfive01" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-teal-500 transition" title="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-500 transition" title="X (Twitter)">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.694L2.306 21.75H-.233l7.73-8.835L0 2.25h6.676l4.959 6.56 5.848-6.56zM17.45 19.038h1.828L5.455 3.75H3.54z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-500 transition" title="TikTok">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.1 1.72 2.89 2.89 0 0 1 5.1-1.72V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 9 20.1a6.34 6.34 0 0 0 5.29-2.61 6.27 6.27 0 0 0 1.19-3.63v-6.16a7.28 7.28 0 0 0 4.81 1.65c.18 0 .37 0 .56-.01v-3.4a4.9 4.9 0 0 1-.56.03z"/>
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
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=123+Main+road+Broadway+Sittingbourne+plaza+ME11+2BY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-500 transition"
                >
                  123, Main road, Broadway, Sittingbourne plaza ME11 2BY
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-500" />
                <a href="tel:+447377280558" className="hover:text-teal-500 transition">+44 7377 280558</a>
              </li>
              <li className="flex items-center gap-2">
                <a
                  href="https://wa.me/447377280558?text=Hi%20Apex%20Five%20Cleaning%2C%20I%27d%20like%20to%20enquire%20about%20your%20services."
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
          <div className="flex gap-6 text-sm">
            <Link to="/privacy-policy" className="text-gray-500 hover:text-teal-500 transition">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-gray-500 hover:text-teal-500 transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
