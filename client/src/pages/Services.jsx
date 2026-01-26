import { useNavigate } from 'react-router-dom'
import { Home, Building, Calendar, Sparkles, Clock, Shield, Leaf, Star } from 'lucide-react'

const Services = () => {
  const navigate = useNavigate()

  const services = [
    {
      id: 'residential',
      title: 'Residential Cleaning',
      icon: Home,
      image: '/images/Service_Residential_Cleaning.png',
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
      image: '/images/Service_EndOfTenancy_Cleaning.png',
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
      image: '/images/Service_Airbnb_Cleaning.png',
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
    }
  ]

  return (
    <section className="pt-32 pb-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Our Services</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-6">
            Professional Cleaning Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We offer a range of eco-friendly cleaning services tailored to your needs. All our services use professional-grade, environmentally safe products and are backed by our satisfaction guarantee.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition border border-gray-100 flex flex-col h-full relative"
              >
                {/* Badge */}
                {service.badge && (
                  <div className="absolute top-4 right-4 bg-amber-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                    {service.badge}
                  </div>
                )}

                {/* Content */}
                <div className="p-8 flex flex-col flex-grow">
                  <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-teal-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h2>
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
              </div>
            )
          })}
        </div>

        {/* Why Choose Us */}
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 sm:p-12 mb-16">
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
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 sm:p-12 text-center">
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
        </div>
      </div>
    </section>
  )
}

export default Services
