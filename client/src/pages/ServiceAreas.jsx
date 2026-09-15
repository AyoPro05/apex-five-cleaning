import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Phone, Clock } from 'lucide-react'
import ServiceAreaMap from '../components/ServiceAreaMap'
import { scrollReveal, staggerContainer, staggerItem } from '../utils/scrollReveal'
import SEO from '../components/SEO'
import { buildBreadcrumbSchema, buildLocalBusinessSchema } from '../config/seoSchemas'
import { SITE_URL, PHONE_MAIN_DISPLAY, PHONE_MAIN_HREF } from '../config/site'
import {
  getServiceAreaRegionsForNav,
} from '../data/serviceAreasCatalog'

const regions = getServiceAreaRegionsForNav()

const ServiceAreas = () => {
  const navigate = useNavigate()

  const allAreas = regions.flatMap((region) => region.areas)
  const serviceAreaSchemas = [
    buildLocalBusinessSchema(),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Apex Five Cleaning Service Areas",
      itemListElement: allAreas.filter((area) => area.hasDetailPage).map((area, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: area.name,
        url: `${SITE_URL}/service-areas/${area.slug}`,
      })),
    },
    buildBreadcrumbSchema([
      { name: "Home", url: `${SITE_URL}/` },
      { name: "Service Areas", url: `${SITE_URL}/service-areas` },
    ]),
  ]

  return (
    <>
      <SEO
        title="Cleaning Services Across Essex, London & Kent | Apex Five Cleaning"
        description="Professional domestic, commercial, end-of-tenancy and Airbnb cleaning across Essex, London and Kent. Based in Southend-on-Sea, Apex Five Cleaning provides reliable, eco-conscious cleaning services."
        path="/service-areas"
        jsonLd={serviceAreaSchemas}
      />
      <motion.section className="pt-32 pb-20 bg-white" {...scrollReveal}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div className="text-center mb-16" {...scrollReveal}>
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Service Coverage</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-6">
            Areas We Operate In
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Apex Five Cleaning provides professional cleaning services across Essex, London and Kent. Based in Southend-on-Sea, we support homes, landlords, tenants, Airbnb hosts, offices and commercial properties throughout our service areas.
            Select your area to learn more about our local services and get a quote.
          </p>
        </motion.div>

        {/* Service Areas by Region */}
        {regions.map((region, regionIdx) => (
          <div key={regionIdx} className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{region.name}</h2>
            <p className="text-gray-600 mb-8">{region.description}</p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {region.areas.map((area, areaIdx) => {
                const Card = area.hasDetailPage ? 'button' : 'div'
                return <Card
                  key={areaIdx}
                  type={area.hasDetailPage ? 'button' : undefined}
                  onClick={area.hasDetailPage ? () => navigate(`/service-areas/${area.slug}`) : undefined}
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
                    {area.hasDetailPage ? 'Learn More →' : 'Coverage area'}
                  </div>
                </Card>
              })}
            </div>
          </div>
        ))}

        {/* Interactive Service Map */}
        <motion.div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 sm:p-12 mb-16" {...scrollReveal}>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Service Map</h2>
          <p className="text-gray-600 text-center mb-6 max-w-2xl mx-auto">
            Click on a marker to view our cleaning services in that area. We serve Essex, London, and Kent.
          </p>
          <ServiceAreaMap height="420px" />
        </motion.div>

        {/* Service Details */}
        <motion.div className="grid md:grid-cols-3 gap-8 mb-16" variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }}>
          <motion.div variants={staggerItem} className="bg-white border border-gray-200 rounded-xl p-6">
            <Clock className="w-8 h-8 text-teal-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Quick Response</h3>
            <p className="text-gray-600">Most areas get quotes within 24 hours. Premium response available for urgent requests.</p>
          </motion.div>
          <motion.div variants={staggerItem} className="bg-white border border-gray-200 rounded-xl p-6">
            <Phone className="w-8 h-8 text-teal-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Direct Contact</h3>
            <p className="text-gray-600">Call us on {PHONE_MAIN_DISPLAY} to discuss your specific area and requirements.</p>
          </motion.div>
          <motion.div variants={staggerItem} className="bg-white border border-gray-200 rounded-xl p-6">
            <MapPin className="w-8 h-8 text-teal-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Expanding Coverage</h3>
            <p className="text-gray-600">Don't see your area? Contact us anyway - we may be able to service nearby locations.</p>
          </motion.div>
        </motion.div>

        {/* CTA Section */}
        <motion.div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 sm:p-12 text-center" {...scrollReveal}>
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
              href={PHONE_MAIN_HREF}
              className="bg-amber-400 text-gray-900 hover:bg-amber-300 px-8 py-3 rounded-lg font-bold transition text-center"
            >
              Call Now
            </a>
          </div>
        </motion.div>
        </div>
      </motion.section>
    </>
  )
}

export default ServiceAreas
