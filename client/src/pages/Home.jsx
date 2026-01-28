import { useNavigate } from 'react-router-dom'
import { Calculator, Sparkles, Crown, Calendar, Gift, LayoutDashboard, Star, CheckCircle } from 'lucide-react'

const Home = () => {
  const navigate = useNavigate()

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden" style={{ backgroundImage: 'url(/images/heroes/Hero_Home.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/90 to-teal-800/80"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <span className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                ✨ Eco-Friendly Cleaning Services
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your Home, <br />
                <span className="text-teal-200">Spotlessly Clean</span>
              </h1>
              <p className="text-xl text-teal-100 mb-8 max-w-lg">
                Professional residential cleaning services that bring clarity to pricing, trust to every visit, and shine to every surface.
              </p>
              
              {/* Member Banner */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6 flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-white">Join Our Family</p>
                  <p className="text-teal-200 text-sm">
                    Sign up for <span className="font-bold text-amber-300">10% OFF</span> every clean!
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/request-a-quote')}
                  className="bg-white text-teal-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-teal-50 transition shadow-xl flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" />
                  Get Your Free Quote
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  View Services
                </button>
              </div>
              
              {/* Trust Indicators */}
              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-3">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Customer" className="w-10 h-10 rounded-full border-2 border-white" />
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Customer" className="w-10 h-10 rounded-full border-2 border-white" />
                  <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Customer" className="w-10 h-10 rounded-full border-2 border-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold">4.9/5</span>
                  </div>
                  <p className="text-sm text-teal-200">From 200+ happy clients</p>
                </div>
              </div>
            </div>
            
            {/* Hero Image - Now Full Background */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-gray-800 font-semibold">100%</p>
                      <p className="text-gray-500 text-sm">Eco-Safe Products</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-amber-400 to-amber-600 text-amber-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                  <Crown className="w-4 h-4" />
                  10% OFF Members
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Member Benefits Section */}
      <section className="py-16 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-amber-600 font-semibold text-sm uppercase tracking-wider">Apex Family</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">Join Our Family & Save 10%</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Become a valued member of the Apex Five Cleaning family and enjoy exclusive benefits.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">10% Family Benefit</h3>
              <p className="text-gray-600 text-sm">As a valued member of our family</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Priority Booking</h3>
              <p className="text-gray-600 text-sm">Get the times you want, when you want them</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gift className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Member Exclusives</h3>
              <p className="text-gray-600 text-sm">Special offers and deals throughout the year</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LayoutDashboard className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Easy Management</h3>
              <p className="text-gray-600 text-sm">Manage bookings, payments & more online</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Our Services</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">What We Offer</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Professional cleaning services tailored to your needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Residential Cleaning</h3>
              <p className="text-gray-600 mb-4">Regular cleaning services for your home</p>
              <p className="text-teal-600 font-semibold mb-4">From £45 per visit</p>
              <button
                onClick={() => navigate('/services')}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Learn More →
              </button>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition">
              <h3 className="text-xl font-bold text-gray-900 mb-3">End of Tenancy</h3>
              <p className="text-gray-600 mb-4">Professional deep cleaning for move-out</p>
              <p className="text-teal-600 font-semibold mb-4">From £150</p>
              <button
                onClick={() => navigate('/services')}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Learn More →
              </button>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Airbnb Turnover</h3>
              <p className="text-gray-600 mb-4">Quick turnaround cleaning for short-term rentals</p>
              <p className="text-teal-600 font-semibold mb-4">From £60</p>
              <button
                onClick={() => navigate('/services')}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Learn More →
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
