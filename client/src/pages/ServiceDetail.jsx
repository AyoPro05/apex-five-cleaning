import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Building, Calendar, Briefcase } from 'lucide-react'
import { scrollReveal } from '../utils/scrollReveal'

const SERVICE_IMAGES = {
  residential: '/images/services/Service_Residential_Cleaning.png',
  'end-of-tenancy': '/images/services/Service_EndOfTenancy_Cleaning.png',
  airbnb: '/images/services/Service_Airbnb_Cleaning.png',
  commercial: '/images/services/Service_Commercial_Cleaning.png'
}

const ServiceDetail = () => {
  const { serviceId } = useParams()
  const navigate = useNavigate()

  const services = {
    residential: {
      title: 'Residential Cleaning',
      icon: Home,
      image: SERVICE_IMAGES.residential,
      description: 'Regular cleaning services to keep your home spotless and fresh.',
      price: 'From £45 per visit',
      features: [
        'Kitchen & bathroom deep clean',
        'Dusting & vacuuming',
        'Mopping & floor care',
        'Window cleaning',
        'Eco-friendly products'
      ],
      details: 'Our residential cleaning service is perfect for busy homeowners who want to maintain a clean and healthy living environment without the hassle.'
    },
    'end-of-tenancy': {
      title: 'End of Tenancy Cleaning',
      icon: Building,
      image: SERVICE_IMAGES['end-of-tenancy'],
      description: 'Comprehensive deep cleaning to help you get your full deposit back.',
      price: 'From £150',
      features: [
        'Full property deep clean',
        'Inside all appliances',
        'Window cleaning inside & out',
        'Carpet cleaning',
        'Inventory check support'
      ],
      details: 'We ensure your property meets all landlord requirements, helping you secure your full deposit return.'
    },
    airbnb: {
      title: 'Airbnb Turnover Cleaning',
      icon: Calendar,
      image: SERVICE_IMAGES.airbnb,
      description: 'Fast, reliable cleaning between guests to keep your bookings flowing.',
      price: 'From £60',
      features: [
        'Quick turnaround service',
        'Linen & towel replacement',
        'Bathroom refresh',
        'Kitchen sanitization',
        'Guest-ready checklist'
      ],
      details: 'Keep your Airbnb property guest-ready with our fast and thorough turnover cleaning service.'
    },
    commercial: {
      title: 'Commercial Cleaning',
      icon: Briefcase,
      image: SERVICE_IMAGES.commercial,
      description: 'Professional cleaning for offices, retail, and business premises.',
      price: 'From £80',
      features: [
        'Daily or periodic office cleaning',
        'Reception & communal areas',
        'Restroom sanitization',
        'Floor care & vacuuming',
        'Waste management'
      ],
      details: 'We provide flexible commercial cleaning tailored to your business hours. Out-of-hours options available for minimum disruption.'
    }
  }

  const service = services[serviceId] || services.residential
  const Icon = service.icon

  return (
    <motion.section className="pt-32 pb-20 bg-white" {...scrollReveal}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/services')}
          className="text-teal-600 hover:text-teal-700 mb-6 flex items-center gap-2"
        >
          ← Back to Services
        </button>

        <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-8">
          <div className="aspect-[21/9] bg-gray-100 overflow-hidden">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=400&fit=crop'
              }}
            />
          </div>
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-8 h-8 text-teal-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">{service.title}</h1>
            </div>
          <p className="text-xl text-gray-600 mb-6">{service.description}</p>
          <p className="text-teal-600 font-bold text-2xl mb-8">{service.price}</p>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What's Included</h2>
            <ul className="space-y-3">
              {service.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-700">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Service</h3>
            <p className="text-gray-600">{service.details}</p>
          </div>

          <button
            onClick={() => navigate('/request-a-quote')}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg"
          >
            Get a Quote for {service.title}
          </button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default ServiceDetail
