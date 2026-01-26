import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    {
      category: 'Residential Cleaning',
      items: [
        {
          question: 'How often should I have my home professionally cleaned?',
          answer: 'This depends on your lifestyle and home size. Most homeowners opt for weekly or bi-weekly cleaning. We recommend a trial period to find what works best for you. Contact us to discuss a customized schedule.'
        },
        {
          question: 'Are your cleaning products safe for families and pets?',
          answer: 'Absolutely! We exclusively use eco-friendly, non-toxic cleaning products that are safe for children and pets. All products are biodegradable and environmentally responsible.'
        },
        {
          question: 'Do you provide your own equipment and supplies?',
          answer: 'Yes, we bring all necessary equipment and professional-grade eco-friendly cleaning products. You don\'t need to provide anything. Just unlock the door!'
        },
        {
          question: 'What if I\'m not satisfied with the cleaning?',
          answer: 'Your satisfaction is our priority. If you\'re not happy, we offer a re-clean at no additional charge within 24 hours of service.'
        }
      ]
    },
    {
      category: 'End of Tenancy Cleaning',
      items: [
        {
          question: 'How long does an end of tenancy clean take?',
          answer: 'Duration depends on property size and condition. Most properties take 6-10 hours. We\'ll provide an accurate estimate after viewing the property.'
        },
        {
          question: 'Will my deposit be guaranteed to be returned?',
          answer: 'While we perform a thorough deep clean to professional standards, deposit return is ultimately the landlord\'s decision. However, our comprehensive service significantly improves the likelihood of full deposit return.'
        },
        {
          question: 'Do you clean inside appliances?',
          answer: 'Yes! Our end of tenancy service includes cleaning inside ovens, fridges, freezers, and other appliances as part of the comprehensive package.'
        },
        {
          question: 'Can you provide references from previous tenants?',
          answer: 'Absolutely. We have numerous testimonials from satisfied tenants and property managers. Ask us for references when you contact us for a quote.'
        }
      ]
    },
    {
      category: 'Airbnb Cleaning',
      items: [
        {
          question: 'Can you accommodate quick turnaround times between guests?',
          answer: 'Yes, we specialize in fast, reliable turnovers. We understand the importance of quick turnarounds for Airbnb properties and offer flexible scheduling to meet your needs.'
        },
        {
          question: 'Do you handle linen and towel changes?',
          answer: 'Yes! We can launder and replace linens and towels as part of our service. This ensures your property is guest-ready every time.'
        },
        {
          question: 'What if a guest checks out late?',
          answer: 'We work around your schedule. Contact us immediately if there\'s a delay, and we\'ll adjust timing when possible. Emergency same-day cleanings are available for urgent situations.'
        },
        {
          question: 'Do you create a guest-ready checklist?',
          answer: 'We provide detailed cleaning documentation and can create a guest-ready checklist showing all areas cleaned. This gives you peace of mind before each booking.'
        }
      ]
    },
    {
      category: 'Booking & Payment',
      items: [
        {
          question: 'How do I book a cleaning service?',
          answer: 'You can book online at our website, call us at +44 1622 621133, or send a message via WhatsApp. We\'ll confirm availability and send you a quote within 24 hours.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept bank transfers, card payments, and PayPal. Payment is due on the day of service unless otherwise arranged.'
        },
        {
          question: 'Can I reschedule or cancel my booking?',
          answer: 'Yes, we understand that plans change. Cancellations made 48 hours in advance receive a full refund. Shorter notice may incur a cancellation fee.'
        },
        {
          question: 'Do you offer discounts for regular services?',
          answer: 'Yes! We offer special pricing for weekly and bi-weekly recurring cleanings. Ask about our loyalty discounts when you contact us.'
        }
      ]
    },
    {
      category: 'About Us',
      items: [
        {
          question: 'Are your staff members insured and vetted?',
          answer: 'Absolutely. All our team members are fully insured, thoroughly vetting, and background checked. Your trust and home security are paramount to us.'
        },
        {
          question: 'How long has Apex Five Cleaning been in business?',
          answer: 'We\'ve been serving the Kent community since 2018, building our reputation on reliability, professionalism, and exceptional customer service.'
        },
        {
          question: 'Are you members of any professional organizations?',
          answer: 'Yes, we\'re registered with Trading Standards and maintain all necessary certifications. We also hold Fully Insured status and follow environmental best practices.'
        },
        {
          question: 'Do you offer a guarantee on your work?',
          answer: 'We guarantee your satisfaction. If you\'re not happy with our work, we\'ll re-clean at no charge within 24 hours.'
        }
      ]
    }
  ]

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.flatMap(cat => cat.items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    })))
  }

  return (
    <>
      {/* FAQ Schema Markup */}
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

      <section className="pt-32 pb-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Can't find the answer you're looking for? Contact us directly at +44 1622 621133 or via our contact form.
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {faqs.map((section, sectionIdx) => (
              <div key={sectionIdx} className="border-b border-gray-200 pb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-teal-600">{section.category}</h2>
                <div className="space-y-4">
                  {section.items.map((item, itemIdx) => {
                    const uniqueIndex = faqs
                      .slice(0, sectionIdx)
                      .reduce((sum, sec) => sum + sec.items.length, 0) + itemIdx

                    return (
                      <div key={uniqueIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setOpenIndex(openIndex === uniqueIndex ? -1 : uniqueIndex)}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition bg-white"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 text-left">{item.question}</h3>
                          <ChevronDown
                            className={`w-5 h-5 text-teal-600 transition-transform flex-shrink-0 ml-4 ${
                              openIndex === uniqueIndex ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {openIndex === uniqueIndex && (
                          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-teal-50 to-amber-50 rounded-2xl p-8 sm:p-12 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Still Have Questions?</h3>
            <p className="text-gray-600 text-lg mb-8">
              Our friendly team is ready to help. Get in touch today for a personalized quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-bold transition text-center"
              >
                Contact Us
              </a>
              <a
                href="tel:+441622621133"
                className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-8 py-3 rounded-lg font-bold transition text-center"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default FAQ
