import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { scrollReveal } from '../utils/scrollReveal'

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    {
      category: 'Residential Cleaning',
      items: [
        {
          question: 'How often should I have my home professionally cleaned?',
          answer: 'Frequency depends on your lifestyle, household size, and property. Typically: weekly for busy families or homes with pets; bi-weekly for smaller households; or monthly for maintenance. A 2–4 bedroom home usually takes 2–4 hours per visit. We recommend starting with a one-off deep clean, then a trial of 2–3 recurring visits to find the right rhythm. We offer flexible scheduling and can adjust if your needs change.'
        },
        {
          question: 'Are your cleaning products safe for families and pets?',
          answer: 'Yes. We use only eco-friendly, non-toxic products that are safe for children and pets. All products are biodegradable, free from harsh chemicals (e.g. ammonia, bleach, phosphates), and meet environmental standards. We can also use fragrance-free options for sensitive households. If you have specific allergies or chemical sensitivities, tell us when you book.'
        },
        {
          question: 'Do you provide your own equipment and supplies?',
          answer: 'Yes. We bring all necessary equipment and professional-grade eco-friendly cleaning products, including vacuums, mops, microfiber cloths, and surface cleaners. You don\'t need to provide anything beyond access to power and water. If you prefer we use your vacuum or specific products, we can arrange that in advance.'
        },
        {
          question: 'What if I\'m not satisfied with the cleaning?',
          answer: 'We offer a satisfaction guarantee. If you\'re not happy with any aspect of the clean, contact us within 24 hours and we\'ll return to re-clean the affected areas at no extra charge. We don\'t consider the job complete until you\'re satisfied.'
        }
      ]
    },
    {
      category: 'End of Tenancy Cleaning',
      items: [
        {
          question: 'How long does an end of tenancy clean take?',
          answer: 'Typically 6–10 hours for a standard 2–4 bedroom property, depending on size, condition, and any extras (e.g. oven deep clean, carpet cleaning). A 1-bed flat may take 4–6 hours; a larger house can take a full day. We provide a detailed quote after reviewing the property (including photos or a visit). Rush bookings may be subject to availability and a surcharge.'
        },
        {
          question: 'Is my deposit return guaranteed if I use your service?',
          answer: 'Deposit return is decided by your landlord or letting agent. We perform a thorough, professional clean to common inventory standards to maximise the chance of full deposit return. We cannot guarantee the outcome, as it depends on the full property condition and your tenancy terms. Many of our customers report successful full deposit returns.'
        },
        {
          question: 'Do you clean inside appliances?',
          answer: 'Yes. Our end of tenancy service includes cleaning inside ovens, fridges, freezers, microwaves, and other kitchen appliances as standard. We also cover extractors, light fittings, skirting boards, and windows inside and out where accessible. Add-on services (e.g. deep tile & grout, carpet cleaning) can be included for an additional fee.'
        },
        {
          question: 'Can you provide references or proof of a professional clean?',
          answer: 'Yes. We can provide written testimonials and, where appropriate, before/after documentation. For end of tenancy cleans we keep records of the work completed. Some landlords or agents accept our standard check-out summary; others may require a formal inventory. Ask when you book if you need specific documentation.'
        }
      ]
    },
    {
      category: 'Airbnb Cleaning',
      items: [
        {
          question: 'Can you accommodate quick turnaround times between guests?',
          answer: 'Yes. We specialise in fast turnovers, typically completing a 2–3 bedroom property within 2–3 hours. Same-day and next-day slots are available in most of our service areas. For back-to-back check-in/out days, we recommend booking a flexible time window and notifying us of any delays. Recurring hosts often get priority scheduling and discounted rates.'
        },
        {
          question: 'Do you handle linen and towel changes?',
          answer: 'Yes. We can strip used linens and towels, launder them (if you provide washing facilities or a laundry service), and remake beds with fresh bedding. Alternatively, we can work with your linen service or prepare beds with linens you leave out. Tell us your preferred setup when booking.'
        },
        {
          question: 'What if a guest checks out late or I need a last-minute clean?',
          answer: 'Contact us as soon as you know there\'s a delay. We\'ll try to shift your slot where possible. For urgent same-day cleans, we offer an emergency service subject to availability and a surcharge. We recommend building a buffer (e.g. 4–6 hours) between check-out and check-in when you can.'
        },
        {
          question: 'Do you provide a guest-ready checklist or documentation?',
          answer: 'Yes. We can provide a cleaning checklist and basic documentation of what was done (e.g. rooms cleaned, linen changed, amenities restocked). This helps you verify the property is guest-ready and can support any disputes. Some hosts use this alongside their own inspection or automated messaging.'
        }
      ]
    },
    {
      category: 'Booking & Payment',
      items: [
        {
          question: 'How do I book a cleaning service?',
          answer: 'Book via our website (Request a Quote form), call +44 1622 621133, or message us on WhatsApp. We\'ll confirm availability and send a no-obligation quote within 24 hours (often sooner). For recurring services, we can set up a standing schedule. For urgent or same-day requests, call or WhatsApp for fastest response.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept card payments (via secure online link), bank transfer, and PayPal. Payment is typically due on or before the day of service unless we agree otherwise (e.g. monthly invoicing for commercial or recurring clients). We\'ll confirm payment options when sending your quote.'
        },
        {
          question: 'Can I reschedule or cancel my booking?',
          answer: 'Yes. Cancellations made at least 48 hours in advance receive a full refund. For cancellations with less notice, we may apply a fee to cover allocated time and travel. Rescheduling is free when done with 24+ hours notice. We understand that plans change and will work with you where we can.'
        },
        {
          question: 'Do you offer discounts for regular or recurring services?',
          answer: 'Yes. We offer member pricing for weekly and bi-weekly recurring cleanings, plus our Refer a Friend scheme. For every friend you refer who books our service, you get £5 off a window clean and your friend gets £5 off their first clean. Ask about membership and referral discounts when you get your quote.'
        }
      ]
    },
    {
      category: 'About Us',
      items: [
        {
          question: 'Are your team members insured and vetted?',
          answer: 'Yes. All team members are fully insured (public liability and employers\' liability where applicable) and vetted, including identity checks and references. We prioritise security and reliability. If you have specific requirements (e.g. key holder status, DBS checks), discuss these when booking.'
        },
        {
          question: 'How long has Apex Five Cleaning been in business?',
          answer: 'Apex Five Cleaning has been serving the Kent community and surrounding areas for several years, building a reputation for reliability, professionalism, and customer care. We are part of Apex Five Capital Ltd, our registered company.'
        },
        {
          question: 'Are you certified or members of professional organisations?',
          answer: 'We maintain appropriate insurance, follow industry best practices, and use COSHH-compliant and eco-friendly products. We are registered with Trading Standards and operate in line with UK cleaning and hospitality standards. If you need specific certifications for your property or contract, ask when you book.'
        },
        {
          question: 'Do you offer a guarantee on your work?',
          answer: 'Yes. We offer a satisfaction guarantee on all our cleans. If you\'re not satisfied, contact us within 24 hours and we\'ll return to re-clean the relevant areas at no extra cost. We aim to resolve any issue quickly and fairly.'
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

      <motion.section className="pt-32 pb-20 bg-white" {...scrollReveal}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div className="text-center mb-16" {...scrollReveal}>
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Can't find the answer you're looking for? Contact us directly at +44 1622 621133 or via our contact form.
            </p>
          </motion.div>

          {/* FAQ Sections */}
          <motion.div className="space-y-8" {...scrollReveal}>
            {faqs.map((section, sectionIdx) => (
              <div key={sectionIdx} className="border-b border-gray-200 pb-8">
                <h2 className="text-2xl font-bold text-teal-600 mb-6">{section.category}</h2>
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
          </motion.div>

          {/* CTA Section */}
          <motion.div className="mt-16 bg-gradient-to-r from-teal-50 to-amber-50 rounded-2xl p-8 sm:p-12 text-center" {...scrollReveal}>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Still Have Questions?</h3>
            <p className="text-gray-600 text-lg mb-8">
              Our friendly team is ready to help. Get in touch today for a personalized quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-block bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-bold transition text-center"
              >
                Contact Us
              </Link>
              <a
                href="tel:+441622621133"
                className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-8 py-3 rounded-lg font-bold transition text-center"
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

export default FAQ
