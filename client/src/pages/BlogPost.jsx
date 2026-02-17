import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, User, Share2, ArrowLeft, ArrowRight } from 'lucide-react'
import { scrollReveal } from '../utils/scrollReveal'
import { SITE_URL } from '../config/site'

const BlogPost = () => {
  const { slug } = useParams()
  const navigate = useNavigate()

  // Blog posts database
  const blogDatabase = {
    'guide-end-of-tenancy-cleaning': {
      title: 'The Ultimate Guide to End of Tenancy Cleaning',
      author: 'Apex Five Team',
      date: '2026-01-24',
      readTime: '8 min read',
      category: 'Cleaning Tips',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
      content: `
        <h2>Introduction</h2>
        <p>Getting your full deposit back is every tenant's goal. Professional end of tenancy cleaning is essential to meet landlord expectations and pass the final inspection. In this guide, we'll walk you through everything you need to know.</p>
        
        <h2>Why Professional Cleaning Matters</h2>
        <p>Landlords and property managers have high standards for end of tenancy properties. The difference between DIY cleaning and professional cleaning can mean the difference between getting your full deposit back or losing money.</p>
        <p>Professional cleaners know exactly what to look for, have specialized equipment, and can handle deep cleaning tasks that most people can't do alone.</p>
        
        <h2>The Complete Checklist</h2>
        <h3>Kitchen</h3>
        <ul>
          <li>Clean inside oven, hob, and extractor fan</li>
          <li>Degrease all surfaces and backsplash</li>
          <li>Clean inside fridge and freezer</li>
          <li>Polish all taps and handles</li>
          <li>Clean behind and under appliances</li>
        </ul>
        
        <h3>Bathrooms</h3>
        <ul>
          <li>Remove limescale from taps, shower heads, and tiles</li>
          <li>Deep clean toilets, including under the rim</li>
          <li>Scrub grout between tiles</li>
          <li>Clean mirrors and lights</li>
          <li>Polish all metal fixtures</li>
        </ul>
        
        <h3>Bedrooms & Living Areas</h3>
        <ul>
          <li>Vacuum all carpets thoroughly</li>
          <li>Wipe down all light switches and door handles</li>
          <li>Clean windows inside and out</li>
          <li>Remove any marks or damage from walls</li>
          <li>Dust all surfaces and shelving</li>
        </ul>
        
        <h2>When to Book</h2>
        <p>Book your professional end of tenancy cleaning at least 2 weeks before your move-out date. This gives you time to address any issues the cleaner identifies and ensures a thorough job.</p>
        
        <h2>Cost Expectations</h2>
        <p>Professional end of tenancy cleaning typically costs between £150-£400 depending on property size. While this might seem like an investment, it's often much less than what you'd lose from your deposit.</p>
        
        <h2>Final Tips</h2>
        <ul>
          <li>Take photos of the cleaned property for records</li>
          <li>Request a cleaning certificate or checklist from your cleaner</li>
          <li>Be present for the final inspection if possible</li>
          <li>Keep all receipts and documentation for your deposit claim</li>
        </ul>
        
        <h2>Conclusion</h2>
        <p>Professional end of tenancy cleaning is a worthwhile investment that can save you hundreds of pounds in lost deposit money. When you book with Apex Five Cleaning, you get the peace of mind that your property will be returned in pristine condition.</p>
      `
    },
    'eco-friendly-cleaning-products': {
      title: 'Eco-Friendly Cleaning Products: What Really Works',
      author: 'Apex Five Team',
      date: '2026-01-20',
      readTime: '6 min read',
      category: 'Eco-Friendly',
      image: 'https://images.unsplash.com/photo-1563453392-0a8f0dd88be4?w=1200&h=600&fit=crop',
      content: `
        <h2>Why Go Eco-Friendly?</h2>
        <p>Traditional cleaning products contain harsh chemicals that are bad for your health, your family, and the environment. Eco-friendly cleaning products offer a safer, more sustainable alternative without compromising on cleaning power.</p>
        
        <h2>Top Eco-Friendly Cleaning Products</h2>
        <h3>1. Vinegar</h3>
        <p>One of nature's best cleaning agents. Great for windows, mirrors, and cutting through grease. Mix with water for a powerful all-purpose cleaner.</p>
        
        <h3>2. Baking Soda</h3>
        <p>Perfect for scrubbing surfaces, removing odors, and tough stains. Safe, non-toxic, and incredibly versatile.</p>
        
        <h3>3. Lemon Juice</h3>
        <p>Natural degreaser with a fresh scent. Works wonders on stainless steel and cutting boards.</p>
        
        <h3>4. Castile Soap</h3>
        <p>Plant-based soap that's biodegradable and effective for floor cleaning and general surfaces.</p>
        
        <h2>DIY Recipes</h2>
        <h3>All-Purpose Cleaner</h3>
        <ul>
          <li>2 cups water</li>
          <li>2 tablespoons vinegar</li>
          <li>10 drops lemon essential oil</li>
        </ul>
        <p>Mix in a spray bottle and use on most surfaces.</p>
        
        <h2>Environmental Benefits</h2>
        <ul>
          <li>Biodegradable formulas don't harm aquatic life</li>
          <li>No toxic fumes released into your home</li>
          <li>Reduced plastic waste with concentrated products</li>
          <li>Lower carbon footprint overall</li>
        </ul>
        
        <h2>Cost Comparison</h2>
        <p>Eco-friendly products are often cheaper than traditional cleaners when you make your own. Vinegar and baking soda cost just pennies and can replace dozens of commercial products.</p>
        
        <h2>Conclusion</h2>
        <p>Making the switch to eco-friendly cleaning products is good for your health, your wallet, and the planet. You don't need harsh chemicals to keep your home clean.</p>
      `
    },
    'prepare-home-professional-cleaning': {
      title: 'How to Prepare Your Home for Professional Cleaning',
      author: 'Sarah Thompson',
      date: '2026-01-18',
      readTime: '5 min read',
      category: 'Cleaning Tips',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
      content: `
        <h2>Preparation is Key</h2>
        <p>When you prepare your home properly for professional cleaning, you get better results and the cleaning team can work more efficiently. Here's what to do:</p>
        
        <h2>Before the Cleaners Arrive</h2>
        <h3>1. Declutter</h3>
        <p>Remove personal items, toys, and clutter from surfaces. This allows cleaners to properly dust and clean without constantly moving things.</p>
        
        <h3>2. Clear the Floors</h3>
        <p>Pick up items from the floor so vacuuming and mopping can be done quickly and thoroughly.</p>
        
        <h3>3. Do a Quick Tidy</h3>
        <p>Put away dishes, make beds, and organize items. A tidy home is easier to clean.</p>
        
        <h3>4. Secure Valuables</h3>
        <p>Move expensive items out of sight for security. Lock any valuable jewelry or documents away.</p>
        
        <h3>5. Give Access</h3>
        <p>Ensure all areas that need cleaning are accessible. Unlock any rooms or cabinets that cleaners need to access.</p>
        
        <h2>During Cleaning</h2>
        <ul>
          <li>Stay out of the way - let professionals work</li>
          <li>Provide any specific instructions for delicate items</li>
          <li>Ensure pets are in a safe, separate area</li>
          <li>Keep children supervised and away from cleaning products</li>
        </ul>
        
        <h2>After Cleaning</h2>
        <p>To maintain your freshly cleaned home, develop good habits like wiping spills immediately, doing dishes daily, and doing a quick 15-minute tidy each evening.</p>
        
        <h2>Conclusion</h2>
        <p>Proper preparation helps your professional cleaners deliver the best possible results. It's a simple way to maximize the value of your cleaning investment.</p>
      `
    }
  }

  const post = blogDatabase[slug]

  if (!post) {
    return (
      <section className="pt-32 pb-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Article Not Found</h1>
          <p className="text-xl text-gray-600 mb-8">Sorry, we couldn't find that article.</p>
          <button
            onClick={() => navigate('/blog')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-bold"
          >
            Back to Blog
          </button>
        </div>
      </section>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Blog schema markup
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.image,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: post.author
    },
    description: post.title
  }

  return (
    <>
      {/* Schema Markup */}
      <script type="application/ld+json">{JSON.stringify(blogSchema)}</script>

      <motion.section className="pt-20 pb-20" {...scrollReveal}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/blog')}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </button>

          {/* Hero Image - Full Width Background */}
          <div className="relative mb-12 rounded-2xl overflow-hidden min-h-80 -mx-4 px-4">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover absolute inset-0 rounded-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent rounded-2xl"></div>
            <div className="relative z-10 h-80 flex flex-col justify-end pb-8">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <span className="inline-block bg-amber-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                  {post.category}
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">{post.title}</h1>
              </div>
            </div>
          </div>

          {/* Article Header */}
          <div className="mb-12">

            {/* Meta Information */}
            <div className="flex flex-wrap gap-6 text-gray-600 border-b border-gray-200 pb-6">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{formatDate(post.date)}</span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* Share Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-12 border border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-semibold text-gray-900">Found this helpful?</p>
                <p className="text-gray-600 text-sm">Share it with others</p>
              </div>
              <div className="flex gap-3">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${SITE_URL}/blog/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition"
                >
                  <Share2 className="w-5 h-5" />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`${SITE_URL}/blog/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black hover:bg-gray-800 text-white p-3 rounded-lg transition"
                >
                  <Share2 className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 sm:p-12 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">Ready for Professional Cleaning?</h3>
            <p className="text-teal-50 text-lg mb-8">
              Let Apex Five Cleaning handle it. Get a free quote today.
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

          {/* More Articles */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">More Articles</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
                  onClick={() => navigate('/blog')}
                >
                  <div className="h-40 bg-gray-200"></div>
                  <div className="p-4">
                    <p className="text-sm text-teal-600 font-semibold mb-2">Cleaning Tips</p>
                    <p className="font-bold text-gray-900 line-clamp-2">Read more cleaning tips and guides</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </>
  )
}

export default BlogPost
