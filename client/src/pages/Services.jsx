import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Building, Calendar, Briefcase, Sparkles, Clock, Shield, Leaf, Star } from 'lucide-react'
import { scrollReveal, scrollRevealVisible, staggerContainer, staggerItem } from '../utils/scrollReveal'

// Service image paths - files in /public/images/services/ named as below
const SERVICE_IMAGES = {
  residential: '/images/services/Service_Residential_Cleaning.png',
  'end-of-tenancy': '/images/services/Service_EndOfTenancy_Cleaning.png',
  airbnb: '/images/services/Service_Airbnb_Cleaning.png',
  commercial: '/images/services/Service_Commercial_Cleaning.png'
}

const Services = () => {
  const navigate = useNavigate()

  const services = [
    {
      id: 'residential',
      title: 'Residential Cleaning',
      icon: Home,
      image: SERVICE_IMAGES.residential,
      description: 'Regular cleaning services to keep your home spotless and fresh.',
      price: 'From £45 per visit',
      duration: '2-4 hours',
      rating: 4.9,
      reviews: 87,
      badge: 'Most Popular',
      features: [
        'Kitchen & bathroom deep clean',
        'Dusting & vacuuming',
        'Mopping & floor care',
        'Window cleaning',
        'Eco-friendly products'
      ],
      benefits: [
        'Flexible weekly/bi-weekly scheduling',
        'Same cleaner every time (consistency)',
        'Customizable service list',
        'Free first inspection'
      ]
    },
    {
      id: 'end-of-tenancy',
      title: 'End of Tenancy Cleaning',
      icon: Building,
      image: SERVICE_IMAGES['end-of-tenancy'],
      description: 'Comprehensive deep cleaning to help you get your full deposit back.',
      price: 'From £150',
      duration: '6-10 hours',
      rating: 4.8,
      reviews: 64,
      features: [
        'Full property deep clean',
        'Inside all appliances',
        'Window cleaning inside & out',
        'Carpet cleaning',
        'Inventory check support'
      ],
      benefits: [
        'Deposit protection guarantee',
        'Professional inventory support',
        'Landlord communication',
        'Final inspection checklist'
      ]
    },
    {
      id: 'airbnb',
      title: 'Airbnb Turnover Cleaning',
      icon: Calendar,
      image: SERVICE_IMAGES.airbnb,
      description: 'Fast, reliable cleaning between guests to keep your bookings flowing.',
      price: 'From £60',
      duration: '2-3 hours',
      rating: 4.9,
      reviews: 92,
      badge: 'Quick Turnaround',
      features: [
        'Quick turnaround service',
        'Linen & towel replacement',
        'Bathroom refresh',
        'Kitchen sanitization',
        'Guest-ready checklist'
      ],
      benefits: [
        'Same-day service available',
        'Recurring booking discounts',
        'Damage reporting included',
        'Photo documentation'
      ]
    },
    {
      id: 'commercial',
      title: 'Commercial Cleaning',
      icon: Briefcase,
      image: SERVICE_IMAGES.commercial,
      description: 'Professional cleaning for offices, retail, and business premises.',
      price: 'From £80',
      duration: 'Varies by site',
      rating: 4.8,
      reviews: 41,
      features: [
        'Daily or periodic office cleaning',
        'Reception & communal areas',
        'Restroom sanitization',
        'Floor care & vacuuming',
        'Waste management'
      ],
      benefits: [
        'Out-of-hours scheduling',
        'Contract and one-off options',
        'COSHH-compliant products',
        'Key-holder arrangements'
      ]
    }
  ]

  return (
    <motion.section className="pt-32 pb-20 bg-white min-h-screen" {...scrollRevealVisible}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div className="text-center mb-16" {...scrollReveal}>
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Our Services</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-6">
            Professional Cleaning Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We offer a range of eco-friendly cleaning services tailored to your needs. All our services use professional-grade, environmentally safe products and are backed by our satisfaction guarantee.
          </p>
        </motion.div>

        {/* Service Cards */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, amount: 0.1 }}
        >
          {services.map((service) => {
            const Icon = service.icon
            return (
              <motion.div
                key={service.id}
                variants={staggerItem}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition border border-gray-100 flex flex-col h-full relative group cursor-pointer"
                onClick={() => navigate(`/services/${service.id}`)}
              >
                {/* Service Image */}
                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=450&fit=crop'
                    }}
                  />
                </div>
                {/* Badge */}
                {service.badge && (
                  <div className="absolute top-4 right-4 bg-amber-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold z-10">
                    {service.badge}
                  </div>
                )}

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{service.title}</h2>
                  </div>
                  <p className="text-gray-600 mb-4">{service.description}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      <span className="font-bold text-gray-900">{service.rating}</span> ({service.reviews} reviews)
                    </span>
                  </div>

                  {/* Price & Duration */}
                  <div className="bg-teal-50 rounded-lg p-4 mb-6">
                    <p className="text-teal-600 font-bold text-xl">{service.price}</p>
                    <div className="flex items-center gap-2 text-sm text-teal-700 mt-2">
                      <Clock className="w-4 h-4" />
                      Typically {service.duration}
                    </div>
                  </div>

                  {/* Features */}
                  <h4 className="font-semibold text-gray-900 mb-3">What's Included:</h4>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-600 text-sm">
                        <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <button
                    onClick={() => navigate(`/services/${service.id}`)}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition mt-auto"
                  >
                    Learn More
                  </button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Why Choose Us */}
        <motion.div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 sm:p-12 mb-16" {...scrollReveal}>
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Apex Five?</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Eco-Friendly</h4>
              <p className="text-gray-600 text-sm">100% biodegradable, non-toxic products</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Fully Insured</h4>
              <p className="text-gray-600 text-sm">Professional indemnity & liability covered</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">4.9 Star Rated</h4>
              <p className="text-gray-600 text-sm">Trusted by over 500 satisfied customers</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Reliable Service</h4>
              <p className="text-gray-600 text-sm">Consistent, punctual, professional team</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 sm:p-12 text-center" {...scrollReveal}>
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h3>
          <p className="text-teal-50 text-lg mb-8 max-w-2xl mx-auto">
            Get a free, no-obligation quote for your cleaning needs. We respond within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/request-a-quote')}
              className="bg-white text-teal-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-bold transition"
            >
              Get a Free Quote
            </button>
            <a
              href="tel:+441622621133"
              className="bg-amber-400 text-gray-900 hover:bg-amber-300 px-8 py-3 rounded-lg font-bold transition text-center"
            >
              Call Now: +44 1622 621133
            </a>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default Services
