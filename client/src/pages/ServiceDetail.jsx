import { useParams, useNavigate } from 'react-router-dom'
import { Home, Building, Calendar } from 'lucide-react'

const ServiceDetail = () => {
  const { serviceId } = useParams()
  const navigate = useNavigate()

  const services = {
    residential: {
      title: 'Residential Cleaning',
      icon: Home,
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
    }
  }

  const service = services[serviceId] || services.residential
  const Icon = service.icon

  return (
    <section className="pt-32 pb-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/services')}
          className="text-teal-600 hover:text-teal-700 mb-6 flex items-center gap-2"
        >
          ← Back to Services
        </button>

        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-6">
            <Icon className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{service.title}</h1>
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
    </section>
  )
}

export default ServiceDetail
