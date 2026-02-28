/**
 * WEBSITE CONTENT KNOWLEDGE BASE
 * Used by Apex Assistant bot and site search.
 * Content sourced from: Home, Services, FAQ, About, Contact, PayOnline, etc.
 */

export const websiteKnowledge = [
  // Services
  { keywords: ['residential', 'home cleaning', 'regular clean', 'weekly', 'bi-weekly'],
    topic: 'Residential Cleaning',
    answer: 'Our residential cleaning starts from £45 per visit (2-4 hours). Includes kitchen & bathroom deep clean, dusting, vacuuming, mopping, window cleaning. Eco-friendly products available. Flexible weekly or bi-weekly scheduling.',
    link: '/services' },
  { keywords: ['end of tenancy', 'tenancy', 'deposit', 'move out', 'checkout'],
    topic: 'End of Tenancy',
    answer: 'End of tenancy cleaning from £150, typically 6-10 hours. Includes inside appliances, windows inside/out, carpet cleaning. We maximise your chance of full deposit return. Book via our Request a Quote form.',
    link: '/services' },
  { keywords: ['airbnb', 'short let', 'turnover', 'between guests'],
    topic: 'Airbnb Cleaning',
    answer: 'Airbnb turnover from £60, 2-3 hours. Same-day available. We strip linens, remake beds, sanitise. Recurring hosts get priority and discounts.',
    link: '/services' },
  { keywords: ['commercial', 'office', 'business'],
    topic: 'Commercial Cleaning',
    answer: 'Commercial cleaning from £80. Offices, retail, business premises. Tailored schedules and quotes.',
    link: '/services' },
  // Pricing
  { keywords: ['price', 'cost', 'quote', 'how much', 'pricing'],
    topic: 'Pricing',
    answer: 'Residential from £45, end of tenancy from £150, Airbnb from £60, commercial from £80. Exact price depends on property size. Get a free quote on our website or call +44 7377 280558.',
    link: '/request-a-quote' },
  // Booking
  { keywords: ['book', 'appointment', 'schedule', 'how to book'],
    topic: 'Booking',
    answer: 'Book via Request a Quote on our website, call +44 7377 280558, or WhatsApp. We send a no-obligation quote within 24 hours. Urgent requests: call or WhatsApp for fastest response.',
    link: '/request-a-quote' },
  // Contact
  { keywords: ['contact', 'phone', 'email', 'address', 'where', 'location'],
    topic: 'Contact',
    answer: 'Address: 123, Main road, Broadway, Sittingbourne plaza ME11 2BY. Phone: +44 7377 280558. Email: info@apexfivecleaning.co.uk. We reply within 24 hours.',
    link: '/contact' },
  // Payment
  { keywords: ['pay', 'payment', 'card', 'pay online'],
    topic: 'Payment',
    answer: 'We accept cards (secure online link), bank transfer, PayPal. Pay Online for approved quotes on our website. Log in first, then enter your quote reference (e.g. AP12345678) from your approval email.',
    link: '/pay-online' },
  // Eco / Products
  { keywords: ['eco', 'eco-friendly', 'product', 'chemical', 'safe', 'pet', 'children'],
    topic: 'Eco-Friendly',
    answer: 'Yes! We use plant-based, non-toxic products safe for children and pets. Biodegradable, no harsh chemicals. Fragrance-free option available. Eco option: £5 surcharge per visit.',
    link: '/services' },
  // Areas
  { keywords: ['area', 'kent', 'swale', 'sittingbourne', 'where do you serve', 'coverage'],
    topic: 'Service Areas',
    answer: 'We serve Kent, Swale, and Greater London. Including Sittingbourne, Canterbury, Maidstone, Dover and surrounding areas. Check our Service Areas page for details.',
    link: '/service-areas' },
  // Cancellation / Reschedule
  { keywords: ['cancel', 'reschedule', 'refund'],
    topic: 'Cancellation',
    answer: '48+ hours notice: full refund. Less notice: fee may apply. Rescheduling free with 24+ hours notice.',
    link: '/faq' },
  // Referral
  { keywords: ['referral', 'refer a friend', 'discount', '£10', '£5'],
    topic: 'Refer a Friend',
    answer: 'Refer a Friend: you get £5 off a window clean, your friend gets £5 off their first clean. Share £10 total!',
    link: '/dashboard' },
  // Satisfaction / Guarantee
  { keywords: ['satisfaction', 'guarantee', 'not happy', 'complaint'],
    topic: 'Satisfaction Guarantee',
    answer: 'We offer a satisfaction guarantee. Not happy? Contact us within 24 hours and we\'ll re-clean the affected areas at no extra charge.',
    link: '/faq' },
  // Equipment
  { keywords: ['equipment', 'supplies', 'bring', 'provide'],
    topic: 'Equipment',
    answer: 'We bring all equipment: vacuums, mops, microfiber cloths, eco-friendly products. You only need to provide access to power and water.',
    link: '/faq' },
  // Team / Insurance
  { keywords: ['insured', 'vetted', 'team', 'staff', 'security'],
    topic: 'Team',
    answer: 'All team members are fully insured and vetted with identity checks and references. We follow industry best practices and are registered with Trading Standards.',
    link: '/faq' },
  // About
  { keywords: ['about', 'who', 'company', 'mission', 'family'],
    topic: 'About Us',
    answer: 'Apex Five Cleaning is a professional cleaning company based in Kent, part of Apex Five Capital Ltd. Built on trust, clarity, and exceptional service. We serve the South East.',
    link: '/about' },
  // FAQ
  { keywords: ['faq', 'questions', 'common'],
    topic: 'FAQ',
    answer: 'We have detailed FAQs on residential, end of tenancy, Airbnb, booking, and more. Visit our FAQ page.',
    link: '/faq' },
  // Blog
  { keywords: ['blog', 'articles', 'tips'],
    topic: 'Blog',
    answer: 'Check our blog for cleaning tips, guides, and articles.',
    link: '/blog' },
  // Testimonials
  { keywords: ['review', 'testimonial', 'customer', 'rating'],
    topic: 'Reviews',
    answer: 'See what our customers say on our Testimonials page. We have excellent ratings.',
    link: '/testimonials' },
  // Privacy / Terms
  { keywords: ['privacy', 'data', 'gdpr'],
    topic: 'Privacy',
    answer: 'Our Privacy Policy explains how we handle your data under UK GDPR. See our Privacy Policy page.',
    link: '/privacy-policy' },
  { keywords: ['terms', 'conditions'],
    topic: 'Terms',
    answer: 'See our Terms of Service page for full details.',
    link: '/terms-of-service' },
]

/**
 * Search the knowledge base for a query.
 * Returns matching entries sorted by relevance (keyword matches).
 */
export function searchKnowledge(query, limit = 3) {
  if (!query || !query.trim()) return []
  const lower = query.toLowerCase().trim()
  const words = lower.split(/\s+/).filter(Boolean)

  const scored = websiteKnowledge.map((entry) => {
    const text = [...entry.keywords, entry.topic, entry.answer].join(' ').toLowerCase()
    let score = 0
    for (const word of words) {
      if (text.includes(word)) score += 1
      if (entry.keywords.some((k) => k.includes(word) || word.includes(k))) score += 2
    }
    return { ...entry, score }
  })

  return scored
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Get best answer for chat bot from user message.
 */
export function getBotResponse(userMessage) {
  const results = searchKnowledge(userMessage, 1)
  if (results.length > 0) {
    return {
      text: results[0].answer,
      link: results[0].link,
      topic: results[0].topic,
    }
  }
  return null
}
