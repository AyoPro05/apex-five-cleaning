import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { scrollReveal, scrollRevealVisible } from '../utils/scrollReveal'

const About = () => {
  return (
    <motion.section className="pt-32 pb-20 bg-white min-h-screen" {...scrollRevealVisible}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...scrollReveal}>
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">About Us</span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-6">About Apex Five Cleaning</h1>
        <p className="text-xl text-gray-600 mb-12">
          We're a professional cleaning company built on trust, clarity, and exceptional service. Based in Kent, serving homeowners across the South East.
        </p>
        </motion.div>
        
        {/* Member-focused About Section */}
        <motion.div className="bg-gradient-to-r from-amber-50 to-white rounded-2xl p-8 mb-12 border border-amber-200" {...scrollReveal}>
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-900">Our Family, Your Home</h2>
          </div>
          <p className="text-gray-600 mb-4">
            At Apex Five Cleaning, we don't just see you as a customer – we see you as part of our family. Our membership program is designed to give you the best possible experience, with exclusive discounts and priority service.
          </p>
          <p className="text-gray-600">
            When you join our family, you become part of a community that values quality, trust, and genuine care for your home.
          </p>
        </motion.div>
        
        <motion.div className="grid md:grid-cols-2 gap-12 mb-16" {...scrollReveal}>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-600">
              To provide exceptional cleaning services that exceed expectations, using eco-friendly products that are safe for your family and the environment.
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
            We proudly serve Kent and the surrounding South East England area. Contact us to see if we cover your location.
          </p>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default About
