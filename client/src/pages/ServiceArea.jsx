import { MapPin, Clock, Phone, Star } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'

const ServiceArea = () => {
  const { areaSlug } = useParams()
  const navigate = useNavigate()

  // Service areas data with local information
  const serviceAreas = {
    // Kent - Canterbury & Surrounding
    'canterbury': {
      name: 'Canterbury',
      region: 'Kent',
      coverage: 'Canterbury, Whitstable, Herne Bay, Faversham',
      responseTime: '24-48 hours',
      servicesCovered: ['Residential Cleaning', 'End of Tenancy', 'Airbnb Turnover'],
      localInfo: 'Serving the historic Canterbury area and surrounding communities for over 5 years.',
      highlights: [
        'Same-day quotes for local properties',
        'Quick response times in central Canterbury',
        'Specialist in period property cleaning',
        'Regular discounts for local residents'
      ],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop',
      coordinates: { lat: 51.2793, lng: 1.0832 }
    },
    'dover': {
      name: 'Dover',
      region: 'Kent',
      coverage: 'Dover, Folkestone, Deal, Walmer',
      responseTime: '24-48 hours',
      servicesCovered: ['Residential Cleaning', 'End of Tenancy', 'Airbnb Turnover'],
      localInfo: 'Professional cleaning services across Dover and the surrounding coastal communities.',
      highlights: [
        'Coastal property specialists',
        'Salt-spray cleaning expertise',
        'Fast turnaround for seasonal rentals',
        'Port area property experience'
      ],
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&h=600&fit=crop',
      coordinates: { lat: 51.1289, lng: 1.3127 }
    },
    'maidstone': {
      name: 'Maidstone',
      region: 'Kent',
      coverage: 'Maidstone, Ashford, Sittingbourne',
      responseTime: '24-48 hours',
      servicesCovered: ['Residential Cleaning', 'End of Tenancy', 'Airbnb Turnover'],
      localInfo: 'Trusted cleaning partner for Maidstone homeowners and property managers.',
      highlights: [
        'Large house specialists',
        'Multiple property management support',
        'End-of-tenancy deposit recovery specialists',
        'Commercial property experience'
      ],
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200&h=600&fit=crop',
      coordinates: { lat: 51.2707, lng: 0.5197 }
    },
    'tunbridge-wells': {
      name: 'Tunbridge Wells',
      region: 'Kent',
      coverage: 'Tunbridge Wells, Sevenoaks, Royal Tunbridge Wells',
      responseTime: '24-48 hours',
      servicesCovered: ['Residential Cleaning', 'End of Tenancy', 'Airbnb Turnover'],
      localInfo: 'Premium cleaning services for the affluent Tunbridge Wells community.',
      highlights: [
        'Luxury property specialists',
        'Attention to detail for high-value homes',
        'Flexible scheduling for busy professionals',
        'Discretion and reliability guaranteed'
      ],
      image: 'https://images.unsplash.com/photo-1517841905240-74f67b4dcb80?w=1200&h=600&fit=crop',
      coordinates: { lat: 51.1829, lng: 0.2740 }
    },
    'sevenoaks': {
      name: 'Sevenoaks',
      region: 'Kent',
      coverage: 'Sevenoaks, Orpington, Eynsford',
      responseTime: '24 hours',
      servicesCovered: ['Residential Cleaning', 'End of Tenancy', 'Airbnb Turnover'],
      localInfo: 'Serving affluent Sevenoaks and surrounding villages with premium cleaning services.',
      highlights: [
        'Large estate property expertise',
        'Village property specialists',
        'Extensive references available',
        'Eco-friendly premium service'
      ],
      image: 'https://images.unsplash.com/photo-1507995881394-2c58d5d0d81c?w=1200&h=600&fit=crop',
      coordinates: { lat: 51.1544, lng: 0.1759 }
    },
    'ashford': {
      name: 'Ashford',
      region: 'Kent',
      coverage: 'Ashford, Tenterden, Charing',
      responseTime: '24-48 hours',
      servicesCovered: ['Residential Cleaning', 'End of Tenancy', 'Airbnb Turnover'],
      localInfo: 'Comprehensive cleaning solutions for Ashford and surrounding rural communities.',
      highlights: [
        'Rural property specialists',
        'Flexible scheduling for remote properties',
        'Agricultural property experience',
        'Community-focused service'
      ],
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&h=600&fit=crop',
      coordinates: { lat: 51.1447, lng: 0.8738 }
    },
    // Swale - Sheerness, Sittingbourne, etc.
    'sheerness': {
      name: 'Sheerness-on-Sea',
      region: 'Swale, Kent',
      coverage: 'Sheerness-on-Sea, Queenborough, Minster-on-Sea',
      responseTime: '24-48 hours',
      servicesCovered: ['Residential Cleaning', 'End of Tenancy', 'Airbnb Turnover'],
      localInfo: 'Specialist coastal cleaning for Sheerness and Isle of Sheppey communities.',
      highlights: [
        'Seaside property specialists',
        'Salt-air cleaning expertise',
        'Holiday let specialists',
        'Quick turnaround cleaning'
      ],
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&h=600&fit=crop',
      coordinates: { lat: 51.4421, lng: 0.7491 }
    },
    'sittingbourne': {
      name: 'Sittingbourne',
      region: 'Swale, Kent',
      coverage: 'Sittingbourne, Faversham, Whitstable',
      responseTime: '24-48 hours',
      servicesCovered: ['Residential Cleaning', 'End of Tenancy', 'Airbnb Turnover'],
      localInfo: 'Professional cleaning services across Swale including Sittingbourne and Faversham.',
      highlights: [
        'Family home specialists',
        'End-of-tenancy deposit recovery focus',
        'Regular customer loyalty discounts',
        'Eco-friendly service provider'
      ],
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200&h=600&fit=crop',
      coordinates: { lat: 51.3462, lng: 0.7417 }
    },
    'axminster': {
      name: 'Axminster',
      region: 'Swale, Kent',
      coverage: 'Axminster, Minster-on-Sea',
      responseTime: '24-48 hours',
      servicesCovered: ['Residential Cleaning', 'End of Tenancy', 'Airbnb Turnover'],
      localInfo: 'Quality cleaning services serving Axminster and surrounding rural areas.',
      highlights: [
        'Rural property experience',
        'Flexible appointment scheduling',
        'Personalized service approach',
        'Professional and trustworthy team'
      ],
      image: 'https://images.unsplash.com/photo-1507995881394-2c58d5d0d81c?w=1200&h=600&fit=crop',
      coordinates: { lat: 51.3789, lng: 0.9147 }
    },
    'minster-on-sea': {
      name: 'Minster-on-Sea',
      region: 'Swale, Kent',
      coverage: 'Minster-on-Sea, Sittingbourne, Isle of Sheppey',
      responseTime: '24-48 hours',
      servicesCovered: ['Residential Cleaning', 'End of Tenancy', 'Airbnb Turnover'],
      localInfo: 'Specialist coastal and rural cleaning services for Minster-on-Sea and surrounding areas.',
      highlights: [
        'Coastal property specialists',
        'Rural and village expertise',
        'Fast response times',
        'Customer-focused service'
      ],
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=600&fit=crop',
      coordinates: { lat: 51.4176, lng: 0.8447 }
    },
    // London - Croydon & Surrounding
    'croydon': {
      name: 'Croydon',
      region: 'Greater London, Surrey',
      coverage: 'Croydon, Coulsdon, Sanderstead, Purley',
      responseTime: '24 hours',
      servicesCovered: ['Residential Cleaning', 'End of Tenancy', 'Airbnb Turnover'],
      localInfo: 'Premium cleaning services for South London and Greater London areas.',
      highlights: [
        'London property specialists',
        'Rapid response times (24 hours)',
        'Professional team experienced with city properties',
        'Flexible weekend scheduling available'
      ],
      image: 'https://images.unsplash.com/photo-1517841905240-74f67b4dcb80?w=1200&h=600&fit=crop',
      coordinates: { lat: 51.3758, lng: -0.1045 }
    }
  }

  const area = serviceAreas[areaSlug]

  if (!area) {
    return (
      <section className="pt-32 pb-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Area Not Found</h1>
          <p className="text-xl text-gray-600 mb-8">
            We're sorry, but we couldn't find that service area.
          </p>
          <button
            onClick={() => navigate('/service-areas')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-bold"
          >
            View All Service Areas
          </button>
        </div>
      </section>
    )
  }

  // Local schema markup
  const localSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Apex Five Cleaning - ${area.name}`,
    image: area.image,
    description: area.localInfo,
    address: {
      '@type': 'PostalAddress',
      addressRegion: area.region,
      addressLocality: area.name,
      addressCountry: 'GB'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: area.coordinates.lat,
      longitude: area.coordinates.lng
    },
    telephone: '+441622621133',
    url: `https://apexfivecleaning.co.uk/service-areas/${areaSlug}`,
    priceRange: '£45-£250',
    areaServed: {
      '@type': 'City',
      name: area.name
    },
    serviceType: area.servicesCovered
  }

  return (
    <>
      {/* Schema Markup */}
      <script type="application/ld+json">{JSON.stringify(localSchema)}</script>

      <section className="pt-32 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Service Area</span>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-4">
                Cleaning Services in {area.name}
              </h1>
              <p className="text-xl text-gray-600 mb-6">{area.localInfo}</p>
              
              {/* Key Info */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-teal-50 rounded-lg p-4">
                  <Clock className="w-5 h-5 text-teal-600 mb-2" />
                  <p className="text-sm text-gray-600">Response Time</p>
                  <p className="font-bold text-teal-600">{area.responseTime}</p>
                </div>
                <div className="bg-teal-50 rounded-lg p-4">
                  <MapPin className="w-5 h-5 text-teal-600 mb-2" />
                  <p className="text-sm text-gray-600">Service Region</p>
                  <p className="font-bold text-teal-600">{area.region}</p>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="tel:+441622621133"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-bold transition text-center"
                >
                  Call Now
                </a>
                <button
                  onClick={() => navigate('/request-a-quote')}
                  className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-8 py-3 rounded-lg font-bold transition"
                >
                  Get Free Quote
                </button>
              </div>
            </div>

            {/* Hero Image */}
            <div>
              <img
                src={area.image}
                alt={`${area.name} cleaning services`}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200&h=600&fit=crop'
                }}
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
                loading="lazy"
              />
            </div>
          </div>

          {/* Coverage Area */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Coverage Area</h2>
            <p className="text-lg text-gray-600">{area.coverage}</p>
          </div>

          {/* Services Available */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Services Available in {area.name}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {area.servicesCovered.map((service, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
                  <h3 className="font-bold text-gray-900 mb-2">{service}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Professional {service.toLowerCase()} services tailored for {area.name} properties.
                  </p>
                  <button
                    onClick={() => navigate('/request-a-quote')}
                    className="text-teal-600 hover:text-teal-700 font-semibold text-sm"
                  >
                    Learn More →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Why Choose Us Locally */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Apex Five in {area.name}?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {area.highlights.map((highlight, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    ✓
                  </div>
                  <p className="text-gray-700">{highlight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials Snippet */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What {area.name} Customers Say</h2>
            <div className="flex gap-4 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-gray-600 italic mb-4">
              "Exceptional service and attention to detail. Apex Five has been our go-to for regular cleaning and end-of-tenancy work. Highly recommended!"
            </p>
            <p className="font-semibold text-gray-900">— Local {area.name} Customer</p>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 sm:p-12 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Book?</h3>
            <p className="text-teal-50 text-lg mb-8 max-w-2xl mx-auto">
              Get a free, no-obligation quote for cleaning services in {area.name}. We typically respond within {area.responseTime}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+441622621133"
                className="bg-white text-teal-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-bold transition text-center"
              >
                Call: +44 1622 621133
              </a>
              <a
                href="https://wa.me/441622621133?text=Hi%20Apex%20Five%20Cleaning%2C%20I%27d%20like%20a%20quote%20for%20services%20in%20{area.name}"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold transition text-center"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default ServiceArea
