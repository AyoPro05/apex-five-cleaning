import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import {
  Calculator,
  Sparkles,
  Crown,
  Calendar,
  Gift,
  LayoutDashboard,
  Star,
  CheckCircle,
  MapPin,
  Phone,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// Scroll reveal animation config
const scrollReveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, ease: 'easeOut' },
}

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
  viewport: { once: true, amount: 0.1 },
}

const staggerItem = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
  viewport: { once: true },
}

// Service area regions
const regions = [
  {
    name: 'Kent',
    description: 'Our primary service area covering East and Central Kent',
    areas: [
      { name: 'Canterbury', slug: 'canterbury', coverage: 'Canterbury, Whitstable, Herne Bay' },
      { name: 'Dover', slug: 'dover', coverage: 'Dover, Folkestone, Deal, Walmer' },
      { name: 'Maidstone', slug: 'maidstone', coverage: 'Maidstone, Ashford, Sittingbourne' },
      { name: 'Tunbridge Wells', slug: 'tunbridge-wells', coverage: 'Tunbridge Wells & surrounding' },
      { name: 'Sevenoaks', slug: 'sevenoaks', coverage: 'Sevenoaks, Orpington, Eynsford' },
      { name: 'Ashford', slug: 'ashford', coverage: 'Ashford, Tenterden, Charing' },
    ],
  },
  {
    name: 'Swale',
    description: 'Coastal and rural cleaning services across Swale',
    areas: [
      { name: 'Sheerness-on-Sea', slug: 'sheerness', coverage: 'Sheerness, Queenborough, Minster' },
      { name: 'Sittingbourne', slug: 'sittingbourne', coverage: 'Sittingbourne, Faversham' },
      { name: 'Minster-on-Sea', slug: 'minster-on-sea', coverage: 'Minster-on-Sea, Isle of Sheppey' },
      { name: 'Axminster', slug: 'axminster', coverage: 'Axminster area' },
    ],
  },
  {
    name: 'London & South East',
    description: 'Expanding into Greater London',
    areas: [
      { name: 'Croydon', slug: 'croydon', coverage: 'Croydon, Coulsdon, Sanderstead, Purley' },
    ],
  },
]

// Testimonials
const testimonials = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    role: 'Homeowner, Canterbury',
    rating: 5,
    image: '/images/testimonials/Testimonial_Customer_Avatar_Default.png',
    text: "Apex Five Cleaning transformed my home. They're professional, punctual, and use eco-friendly products. Highly recommended!",
    service: 'Residential Cleaning',
  },
  {
    id: 2,
    name: 'James Richardson',
    role: 'Property Manager, Maidstone',
    rating: 5,
    image: '/images/testimonials/Testimonial_Customer_Avatar_Default.png',
    text: 'We use Apex Five for all our end-of-tenancy cleans. They consistently return properties to move-in condition. Outstanding service.',
    service: 'End of Tenancy Cleaning',
  },
  {
    id: 3,
    name: 'Emma Thompson',
    role: 'Airbnb Host, Dover',
    rating: 5,
    image: '/images/testimonials/Testimonial_Customer_Avatar_Default.png',
    text: 'Quick, reliable, and thorough. They understand what Airbnb guests expect. My booking rate has improved since using them.',
    service: 'Airbnb Turnover Cleaning',
  },
  {
    id: 4,
    name: 'Robert Chen',
    role: 'Office Manager, Tunbridge Wells',
    rating: 5,
    image: '/images/testimonials/Testimonial_Customer_Avatar_Default.png',
    text: "Professional, reliable, and flexible with scheduling. They've been maintaining our office perfectly for two years now.",
    service: 'Residential Cleaning',
  },
  {
    id: 5,
    name: 'Lisa Anderson',
    role: 'Landlord, Sevenoaks',
    rating: 5,
    image: '/images/testimonials/Testimonial_Customer_Avatar_Default.png',
    text: 'Impressive attention to detail and eco-conscious approach. My tenants love the clean properties. Best decision ever.',
    service: 'End of Tenancy Cleaning',
  },
  {
    id: 6,
    name: 'Michael Hughes',
    role: 'Property Owner, Ashford',
    rating: 5,
    image: '/images/testimonials/Testimonial_Customer_Avatar_Default.png',
    text: 'Consistently excellent work. They treat your home like their own. Trustworthy, professional, and fair pricing.',
    service: 'Residential Cleaning',
  },
]

const Home = () => {
  const navigate = useNavigate()
  const { isAuthenticated, openSignIn } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % testimonials.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  const getVisibleTestimonials = () => {
    const visible = []
    for (let i = 0; i < 3; i++) {
      visible.push(testimonials[(currentSlide + i) % testimonials.length])
    }
    return visible
  }

  return (
    <>
      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center pt-20 overflow-hidden"
        style={{
          backgroundImage: 'url(/images/heroes/Hero_Services.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/90 to-teal-800/80" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <span className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                ✨ Eco-Friendly Cleaning Services
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your Home, <br />
                <span className="text-teal-200">Spotlessly Clean</span>
              </h1>
              <p className="text-xl text-teal-100 mb-8 max-w-lg">
                Professional residential cleaning services that bring clarity to pricing, trust to
                every visit, and shine to every surface.
              </p>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Join Our Family</p>
                  <p className="text-teal-200 text-sm">
                    Sign up for <span className="font-bold text-amber-300">10% OFF</span> every clean!
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/request-a-quote')}
                  className="bg-white text-teal-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-teal-50 transition shadow-xl flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" />
                  Get Your Free Quote
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  View Services
                </button>
                {!isAuthenticated && (
                  <button
                    onClick={openSignIn}
                    className="border-2 border-amber-400/50 text-amber-200 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-amber-400/20 transition flex items-center justify-center gap-2"
                  >
                    Sign In
                  </button>
                )}
              </div>
              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-3">
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Customer"
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                  <img
                    src="https://randomuser.me/api/portraits/men/32.jpg"
                    alt="Customer"
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                  <img
                    src="https://randomuser.me/api/portraits/women/68.jpg"
                    alt="Customer"
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold">4.9/5</span>
                  </div>
                  <p className="text-sm text-teal-200">From 200+ happy clients</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-gray-800 font-semibold">100%</p>
                    <p className="text-gray-500 text-sm">Eco-Safe Products</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-amber-400 to-amber-600 text-amber-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                <Crown className="w-4 h-4" />
                10% OFF Members
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Member Benefits Section - Scroll Reveal */}
      <motion.section
        className="py-16 bg-gradient-to-b from-amber-50 to-white"
        {...scrollReveal}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" {...scrollReveal}>
            <span className="text-amber-600 font-semibold text-sm uppercase tracking-wider">
              Apex Family
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              Join Our Family & Save 10%
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Become a valued member of the Apex Five Cleaning family and enjoy exclusive benefits.
            </p>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, amount: 0.1 }}
          >
            {[
              { icon: Crown, bgClass: 'bg-gradient-to-br from-amber-400 to-amber-600', iconClass: 'text-white', title: '10% Family Benefit', desc: 'As a valued member' },
              { icon: Calendar, bgClass: 'bg-teal-100', iconClass: 'text-teal-600', title: 'Priority Booking', desc: 'Get the times you want' },
              { icon: Gift, bgClass: 'bg-purple-100', iconClass: 'text-purple-600', title: 'Member Exclusives', desc: 'Special offers throughout the year' },
              { icon: LayoutDashboard, bgClass: 'bg-blue-100', iconClass: 'text-blue-600', title: 'Easy Management', desc: 'Manage bookings & payments online' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white rounded-2xl p-6 shadow-lg text-center"
              >
                <div className={`w-14 h-14 ${item.bgClass} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`w-7 h-7 ${item.iconClass}`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Services Preview - Scroll Reveal */}
      <motion.section className="py-20 bg-white" {...scrollReveal}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" {...scrollReveal}>
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">
              Our Services
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">What We Offer</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Professional cleaning services tailored to your needs
            </p>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, amount: 0.1 }}
          >
            {[
              { title: 'Residential Cleaning', desc: 'Regular cleaning for your home', price: 'From £45 per visit' },
              { title: 'End of Tenancy', desc: 'Professional deep cleaning for move-out', price: 'From £150' },
              { title: 'Airbnb Turnover', desc: 'Quick turnaround for short-term rentals', price: 'From £60' },
            ].map((s, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-600 mb-4">{s.desc}</p>
                <p className="text-teal-600 font-semibold mb-4">{s.price}</p>
                <button
                  onClick={() => navigate('/services')}
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  Learn More →
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Service Areas Section - Scroll Reveal */}
      <motion.section className="py-20 bg-gray-50" {...scrollReveal}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" {...scrollReveal}>
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">
              Service Coverage
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-6">
              Areas We Serve
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional cleaning across Kent, Swale, and Greater London. Select your area to learn
              more.
            </p>
          </motion.div>

          {regions.map((region, regionIdx) => (
            <motion.div key={regionIdx} className="mb-16" {...scrollReveal}>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{region.name}</h3>
              <p className="text-gray-600 mb-6">{region.description}</p>
              <motion.div
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={staggerContainer}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, amount: 0.1 }}
              >
                {region.areas.map((area, areaIdx) => (
                  <motion.button
                    key={areaIdx}
                    variants={staggerItem}
                    onClick={() => navigate(`/service-areas/${area.slug}`)}
                    className="text-left bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-teal-300 transition cursor-pointer group"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <MapPin className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition">
                        {area.name}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{area.coverage}</p>
                    <span className="inline-flex items-center gap-2 text-teal-600 font-semibold group-hover:gap-3 transition">
                      Learn More →
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          ))}

          <motion.div
            className="grid md:grid-cols-3 gap-6 mb-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={staggerItem} className="bg-white border border-gray-200 rounded-xl p-6">
              <Clock className="w-8 h-8 text-teal-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Quick Response</h3>
              <p className="text-gray-600">Most areas get quotes within 24 hours.</p>
            </motion.div>
            <motion.div variants={staggerItem} className="bg-white border border-gray-200 rounded-xl p-6">
              <Phone className="w-8 h-8 text-teal-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Direct Contact</h3>
              <p className="text-gray-600">Call +44 1622 621133 for your area.</p>
            </motion.div>
            <motion.div variants={staggerItem} className="bg-white border border-gray-200 rounded-xl p-6">
              <MapPin className="w-8 h-8 text-teal-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Expanding Coverage</h3>
              <p className="text-gray-600">Don't see your area? Contact us anyway.</p>
            </motion.div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 sm:p-12 text-center"
            {...scrollReveal}
          >
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Book?</h3>
            <p className="text-teal-50 text-lg mb-8">Get a free, no-obligation quote for your area.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/request-a-quote')}
                className="bg-white text-teal-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-bold transition"
              >
                Get Free Quote
              </button>
              <a
                href="tel:+441622621133"
                className="bg-amber-400 text-gray-900 hover:bg-amber-300 px-8 py-3 rounded-lg font-bold transition text-center"
              >
                Call Now
              </a>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Reviews / Testimonials Section - Scroll Reveal */}
      <motion.section className="py-20 bg-gradient-to-b from-white to-gray-50" {...scrollReveal}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" {...scrollReveal}>
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">
              Customer Reviews
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-6">
              Loved by Thousands
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our satisfied customers say about our cleaning services.
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-gray-600 font-semibold">4.9 / 5 Stars (200+ Reviews)</span>
            </div>
          </motion.div>

          {/* Desktop: 3 cards */}
          <motion.div
            className="hidden md:grid grid-cols-3 gap-8 mb-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, amount: 0.2 }}
          >
            {getVisibleTestimonials().map((t) => (
              <motion.div
                key={t.id}
                variants={staggerItem}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100 flex flex-col h-full"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-lg mb-6 flex-grow italic">&quot;{t.text}&quot;</p>
                <div className="flex items-center gap-4">
                  <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-gray-900">{t.name}</p>
                    <p className="text-sm text-teal-600 font-semibold">{t.service}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile: single card */}
          <div className="md:hidden mb-8">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonials[currentSlide].rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-600 text-lg mb-6 italic">
                &quot;{testimonials[currentSlide].text}&quot;
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={testimonials[currentSlide].image}
                  alt={testimonials[currentSlide].name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-gray-900">{testimonials[currentSlide].name}</p>
                  <p className="text-sm text-teal-600 font-semibold">
                    {testimonials[currentSlide].service}
                  </p>
                  <p className="text-xs text-gray-500">{testimonials[currentSlide].role}</p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="flex items-center justify-between max-w-md mx-auto"
            {...scrollReveal}
          >
            <button
              onClick={prevSlide}
              className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full transition shadow-lg"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-3 h-3 rounded-full transition ${
                    idx === currentSlide ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
            <button
              onClick={nextSlide}
              className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full transition shadow-lg"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>

          <motion.div
            className="mt-20 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-12 text-center"
            {...scrollReveal}
          >
            <h3 className="text-3xl font-bold text-white mb-4">Join Thousands of Satisfied Customers</h3>
            <p className="text-teal-50 text-lg mb-8">
              Experience the Apex Five difference. Professional, eco-friendly cleaning you can trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/request-a-quote')}
                className="bg-white text-teal-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-bold transition"
              >
                Book Now
              </button>
              <a
                href="tel:+441622621133"
                className="bg-amber-400 text-gray-900 hover:bg-amber-300 px-8 py-3 rounded-lg font-bold transition text-center"
              >
                Call +44 1622 621133
              </a>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </>
  )
}

export default Home
