import { useNavigate } from 'react-router-dom'
import { MapPin, Phone, Clock } from 'lucide-react'

const ServiceAreas = () => {
  const navigate = useNavigate()

  const regions = [
    {
      name: 'Kent',
      description: 'Our primary service area covering East and Central Kent',
      areas: [
        { name: 'Canterbury', slug: 'canterbury', coverage: 'Canterbury, Whitstable, Herne Bay, Faversham' },
        { name: 'Dover', slug: 'dover', coverage: 'Dover, Folkestone, Deal, Walmer' },
        { name: 'Maidstone', slug: 'maidstone', coverage: 'Maidstone, Ashford, Sittingbourne' },
        { name: 'Tunbridge Wells', slug: 'tunbridge-wells', coverage: 'Tunbridge Wells, Royal Tunbridge Wells' },
        { name: 'Sevenoaks', slug: 'sevenoaks', coverage: 'Sevenoaks, Orpington, Eynsford' },
        { name: 'Ashford', slug: 'ashford', coverage: 'Ashford, Tenterden, Charing' }
      ]
    },
    {
      name: 'Swale',
      description: 'Coastal and rural cleaning services across Swale',
      areas: [
        { name: 'Sheerness-on-Sea', slug: 'sheerness', coverage: 'Sheerness-on-Sea, Queenborough, Minster-on-Sea' },
        { name: 'Sittingbourne', slug: 'sittingbourne', coverage: 'Sittingbourne, Faversham, Whitstable' },
        { name: 'Axminster', slug: 'axminster', coverage: 'Axminster, Minster-on-Sea' }
      ]
    },
    {
      name: 'London & South East',
      description: 'Expanding service to Greater London and surrounding areas',
      areas: [
        { name: 'Croydon', slug: 'croydon', coverage: 'Croydon, Coulsdon, Sanderstead, Purley' }
      ]
    }
  ]

  return (
    <section className="pt-32 pb-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Service Coverage</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-6">
            Areas We Serve
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We provide professional cleaning services across Kent, Swale, and Greater London. 
            Select your area to learn more about our local services and get a quote.
          </p>
        </div>

        {/* Service Areas by Region */}
        {regions.map((region, regionIdx) => (
          <div key={regionIdx} className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{region.name}</h2>
            <p className="text-gray-600 mb-8">{region.description}</p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {region.areas.map((area, areaIdx) => (
                <button
                  key={areaIdx}
                  onClick={() => navigate(`/service-areas/${area.slug}`)}
                  className="text-left bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-teal-300 transition cursor-pointer group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <MapPin className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-teal-600 transition">
                      {area.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{area.coverage}</p>
                  <div className="flex items-center gap-2 text-teal-600 font-semibold group-hover:gap-3 transition">
                    Learn More →
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Map Section (placeholder for future implementation) */}
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Service Map</h2>
          <div className="bg-white rounded-lg h-96 flex items-center justify-center border-2 border-dashed border-gray-300 mb-6">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <p className="text-gray-600">Interactive service map coming soon</p>
              <p className="text-sm text-gray-500 mt-2">Showing all service areas across Kent, Swale, and Greater London</p>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <Clock className="w-8 h-8 text-teal-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Quick Response</h3>
            <p className="text-gray-600">Most areas get quotes within 24 hours. Premium response available for urgent requests.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <Phone className="w-8 h-8 text-teal-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Direct Contact</h3>
            <p className="text-gray-600">Call us on +44 1622 621133 to discuss your specific area and requirements.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <MapPin className="w-8 h-8 text-teal-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Expanding Coverage</h3>
            <p className="text-gray-600">Don't see your area? Contact us anyway - we may be able to service nearby locations.</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 sm:p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Book?</h3>
          <p className="text-teal-50 text-lg mb-8">
            Get a free, no-obligation quote for your area today.
          </p>
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
        </div>
      </div>
    </section>
  )
}

export default ServiceAreas
