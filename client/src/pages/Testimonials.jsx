import { motion } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { scrollReveal } from '../utils/scrollReveal'

const Testimonials = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Mitchell',
      role: 'Homeowner, Canterbury',
      rating: 5,
      image: '/images/testimonials/Testimonial_Customer_Avatar_Default.png',
      text: 'Apex Five Cleaning transformed my home. They\'re professional, punctual, and use eco-friendly products. Highly recommended!',
      service: 'Residential Cleaning'
    },
    {
      id: 2,
      name: 'James Richardson',
      role: 'Property Manager, Maidstone',
      rating: 5,
      image: '/images/testimonials/Testimonial_Customer_Avatar_Default.png',
      text: 'We use Apex Five for all our end-of-tenancy cleans. They consistently return properties to move-in condition. Outstanding service.',
      service: 'End of Tenancy Cleaning'
    },
    {
      id: 3,
      name: 'Emma Thompson',
      role: 'Airbnb Host, Dover',
      rating: 5,
      image: '/images/testimonials/Testimonial_Customer_Avatar_Default.png',
      text: 'Quick, reliable, and thorough. They understand what Airbnb guests expect. My booking rate has improved since using them.',
      service: 'Airbnb Turnover Cleaning'
    },
    {
      id: 4,
      name: 'Robert Chen',
      role: 'Office Manager, Tunbridge Wells',
      rating: 5,
      image: '/images/testimonials/Testimonial_Customer_Avatar_Default.png',
      text: 'Professional, reliable, and flexible with scheduling. They\'ve been maintaining our office perfectly for two years now.',
      service: 'Residential Cleaning'
    },
    {
      id: 5,
      name: 'Lisa Anderson',
      role: 'Landlord, Sevenoaks',
      rating: 5,
      image: '/images/testimonials/Testimonial_Customer_Avatar_Default.png',
      text: 'Impressive attention to detail and eco-conscious approach. My tenants love the clean properties. Best decision ever.',
      service: 'End of Tenancy Cleaning'
    },
    {
      id: 6,
      name: 'Michael Hughes',
      role: 'Property Owner, Ashford',
      rating: 5,
      image: '/images/testimonials/Testimonial_Customer_Avatar_Default.png',
      text: 'Consistently excellent work. They treat your home like their own. Trustworthy, professional, and fair pricing.',
      service: 'Residential Cleaning'
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const getVisibleTestimonials = () => {
    const visible = []
    for (let i = 0; i < 3; i++) {
      visible.push(testimonials[(currentSlide + i) % testimonials.length])
    }
    return visible
  }

  return (
    <motion.section className="pt-32 pb-20 bg-gradient-to-b from-white to-gray-50" {...scrollReveal}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div className="text-center mb-16" {...scrollReveal}>
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Customer Reviews</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-6">
            Loved by Thousands
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. See what our satisfied customers have to say about our cleaning services.
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

        {/* Desktop Carousel (3 visible) */}
        <div className="hidden md:grid grid-cols-3 gap-8 mb-8">
          {getVisibleTestimonials().map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100 flex flex-col h-full"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-600 text-lg mb-6 flex-grow italic">"{testimonial.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-teal-600 font-semibold">{testimonial.service}</p>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Carousel (1 visible) */}
        <div className="md:hidden mb-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            {/* Rating */}
            <div className="flex gap-1 mb-4">
              {[...Array(testimonials[currentSlide].rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* Testimonial Text */}
            <p className="text-gray-600 text-lg mb-6 italic">"{testimonials[currentSlide].text}"</p>

            {/* Author */}
            <div className="flex items-center gap-4">
              <img
                src={testimonials[currentSlide].image}
                alt={testimonials[currentSlide].name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-gray-900">{testimonials[currentSlide].name}</p>
                <p className="text-sm text-teal-600 font-semibold">{testimonials[currentSlide].service}</p>
                <p className="text-xs text-gray-500">{testimonials[currentSlide].role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevSlide}
            className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full transition shadow-lg"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Dots */}
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
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Join Thousands of Satisfied Customers</h3>
          <p className="text-teal-50 text-lg mb-8">
            Experience the Apex Five difference. Professional, eco-friendly cleaning you can trust.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-teal-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-bold transition">
              Book Now
            </button>
            <a
              href="tel:+441622621133"
              className="bg-amber-400 text-gray-900 hover:bg-amber-300 px-8 py-3 rounded-lg font-bold transition text-center"
            >
              Call +44 1622 621133
            </a>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default Testimonials
