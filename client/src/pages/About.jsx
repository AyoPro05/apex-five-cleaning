import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { scrollReveal, scrollRevealVisible } from '../utils/scrollReveal'
import SEO from '../components/SEO'
import { COMPANY_ADDRESS_LINE1, COMPANY_ADDRESS_LINE2 } from '../config/site'

const About = () => {
  return (
    <>
      <SEO
        title="About Apex Five Cleaning"
        description="Learn about Apex Five Cleaning, our values, and how we deliver reliable eco-friendly cleaning with trusted local teams."
        path="/about"
      />
      <motion.section className="pt-32 pb-20 bg-white min-h-screen" {...scrollRevealVisible}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...scrollReveal}>
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">About Us</span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-6">About Apex Five Cleaning</h1>
        <p className="text-xl text-gray-600 mb-12">
          Based at {COMPANY_ADDRESS_LINE1}, {COMPANY_ADDRESS_LINE2}, we support homes and businesses across London and the South East.
        </p>
        </motion.div>
        
        {/* Member-focused About Section */}
        <motion.div className="bg-gradient-to-r from-amber-50 to-white rounded-2xl p-8 mb-12 border border-amber-200" {...scrollReveal}>
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-900">Our Family, Your Home</h2>
          </div>
          <p className="text-gray-600 mb-4">
            At Apex Five Cleaning, we focus on long-term client relationships, not one-off transactions. Our membership options are designed to reward regular clients with priority slots and better value over time.
          </p>
          <p className="text-gray-600">
            When you book with us, you get a team that values reliability, respect for your space, and visible quality on every visit.
          </p>
        </motion.div>
        
        <motion.div className="grid md:grid-cols-2 gap-12 mb-16" {...scrollReveal}>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-600">
              To provide cleaning services that feel straightforward and dependable, with eco-conscious products that are safe for families, pets, and workspaces.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Values</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Trust and transparency</li>
              <li>• Quality service every time</li>
              <li>• Eco-friendly practices</li>
              <li>• Customer-first approach</li>
            </ul>
          </div>
        </motion.div>

        <motion.div className="bg-teal-50 rounded-2xl p-8" {...scrollReveal}>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Service Area</h3>
          <p className="text-gray-600">
            We serve Greater London and surrounding South East areas. Share your postcode and we will quickly confirm availability.
          </p>
        </motion.div>
        <motion.div className="mt-10 bg-white border border-gray-200 rounded-2xl p-8 text-center" {...scrollReveal}>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to book with confidence?</h3>
          <p className="text-gray-600 mb-6">
            Get a fast, no-obligation quote tailored to your property and service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/request-a-quote"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Get a Free Quote
            </Link>
            <Link
              to="/contact"
              className="bg-white border border-teal-600 text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-lg font-semibold transition"
            >
              Contact Our Team
            </Link>
          </div>
        </motion.div>
        </div>
      </motion.section>
    </>
  )
}

export default About
