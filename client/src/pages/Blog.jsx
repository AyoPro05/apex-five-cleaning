import { useNavigate } from 'react-router-dom'
import { Clock, User, ArrowRight, Search } from 'lucide-react'
import { useState } from 'react'

const Blog = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const blogPosts = [
    {
      id: 1,
      title: 'The Ultimate Guide to End of Tenancy Cleaning',
      slug: 'guide-end-of-tenancy-cleaning',
      excerpt: 'Get your full deposit back with our comprehensive end of tenancy cleaning guide. Includes checklist, tips, and what landlords are looking for.',
      content: 'Full content here...',
      author: 'Apex Five Team',
      date: '2026-01-24',
      readTime: '8 min read',
      category: 'Cleaning Tips',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
      featured: true
    },
    {
      id: 2,
      title: 'Eco-Friendly Cleaning Products: What Really Works',
      slug: 'eco-friendly-cleaning-products',
      excerpt: 'Discover the best eco-friendly cleaning products that actually work. Learn why green cleaning is better for your health and the environment.',
      content: 'Full content here...',
      author: 'Apex Five Team',
      date: '2026-01-20',
      readTime: '6 min read',
      category: 'Eco-Friendly',
      image: 'https://images.unsplash.com/photo-1563453392-0a8f0dd88be4?w=800&h=400&fit=crop',
      featured: true
    },
    {
      id: 3,
      title: 'How to Prepare Your Home for Professional Cleaning',
      slug: 'prepare-home-professional-cleaning',
      excerpt: 'Simple steps to prepare your home before your cleaning appointment. These tips help us deliver the best possible results.',
      content: 'Full content here...',
      author: 'Sarah Thompson',
      date: '2026-01-18',
      readTime: '5 min read',
      category: 'Cleaning Tips',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop'
    },
    {
      id: 4,
      title: 'Cleaning for Airbnb Hosts: Turnaround Best Practices',
      slug: 'airbnb-cleaning-best-practices',
      excerpt: 'Essential cleaning strategies for Airbnb hosts to maintain high ratings and guest satisfaction. Quick turnarounds and guest-ready homes.',
      content: 'Full content here...',
      author: 'Apex Five Team',
      date: '2026-01-15',
      readTime: '7 min read',
      category: 'Airbnb Tips',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=400&fit=crop'
    },
    {
      id: 5,
      title: 'Spring Cleaning Checklist: Room by Room',
      slug: 'spring-cleaning-checklist',
      excerpt: 'Complete room-by-room spring cleaning checklist for homeowners. Don\'t miss any spots with this comprehensive guide.',
      content: 'Full content here...',
      author: 'Emily Carter',
      date: '2026-01-12',
      readTime: '9 min read',
      category: 'Cleaning Tips',
      image: 'https://images.unsplash.com/photo-1551632786-15e0eaf0c547?w=800&h=400&fit=crop'
    },
    {
      id: 6,
      title: 'Why Professional Cleaning Saves Time and Money',
      slug: 'professional-cleaning-saves-time-money',
      excerpt: 'The real cost of DIY cleaning vs professional services. Find out why investing in professional cleaning is the smart choice.',
      content: 'Full content here...',
      author: 'Apex Five Team',
      date: '2026-01-10',
      readTime: '6 min read',
      category: 'Insights',
      image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&h=400&fit=crop'
    }
  ]

  const categories = ['All', ...new Set(blogPosts.map(post => post.category))]
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredPosts = blogPosts.filter(post => post.featured).slice(0, 2)

  return (
    <section className="pt-32 pb-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Blog & Resources</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-6">
            Cleaning Tips & Expert Advice
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn from our cleaning experts. Discover tips, best practices, and insider knowledge to keep your home spotless.
          </p>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {featuredPosts.map(post => (
              <div
                key={post.id}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="cursor-pointer group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute top-4 right-4 bg-amber-400 text-gray-900 px-4 py-1 rounded-full text-xs font-bold">
                    Featured
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex gap-2 mb-3">
                    <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {post.category}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-teal-600 transition">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <p className="font-semibold text-gray-700">{post.author}</p>
                      <p>{new Date(post.date).toLocaleDateString()}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-teal-600 group-hover:translate-x-2 transition" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filters */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-semibold transition ${
                  selectedCategory === category
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <div
                key={post.id}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="cursor-pointer group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <div className="p-5">
                  <div className="flex gap-2 mb-3">
                    <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-xs font-semibold">
                      {post.category}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="text-xs text-gray-500">
                    <p className="font-semibold text-gray-700">{post.author}</p>
                    <p>{new Date(post.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 text-lg">No articles found. Try adjusting your filters.</p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 sm:p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Need Help With Cleaning?</h3>
          <p className="text-teal-50 text-lg mb-8">
            Found what you're looking for? Get professional help from the experts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/contact')}
              className="bg-white text-teal-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-bold transition"
            >
              Contact Us
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

export default Blog
