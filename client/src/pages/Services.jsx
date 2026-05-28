import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck, Star } from "lucide-react";
import SEO from "../components/SEO";
import SmartImage from "../components/SmartImage";
import ImageLightbox from "../components/ImageLightbox";
import { SERVICES } from "../data/servicesCatalog";
import { buildBreadcrumbSchema } from "../config/seoSchemas";
import { PHONE_MAIN_DISPLAY, PHONE_MAIN_HREF } from "../config/site";
import {
  scrollReveal,
  scrollRevealVisible,
  staggerContainer,
  staggerItem,
} from "../utils/scrollReveal";

const servicesPageSchemas = [
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Apex Five Cleaning Service Pages",
    itemListElement: SERVICES.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: service.title,
      url: `https://www.apexfivecleaning.co.uk/services/${service.id}`,
    })),
  },
  buildBreadcrumbSchema([
    { name: "Home", url: "https://www.apexfivecleaning.co.uk/" },
    { name: "Services", url: "https://www.apexfivecleaning.co.uk/services" },
  ]),
];

export default function Services() {
  const navigate = useNavigate();
  const [lightboxImage, setLightboxImage] = useState("");

  return (
    <>
      <SEO
        title="Cleaning Services for Homes, Rentals and Businesses"
        description="Choose from domestic, deep cleaning, end of tenancy, Airbnb, office, and commercial cleaning services. Clear scope, transparent pricing guidance, and fast quotes."
        path="/services"
        jsonLd={servicesPageSchemas}
      />
      <motion.section
        className="pt-32 pb-20 bg-white min-h-screen"
        {...scrollRevealVisible}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" {...scrollReveal}>
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">
              Services
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-5">
              Cleaning services built around your property and schedule
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pick the service that fits your needs, see what is included, then
              request a quote in minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate("/request-a-quote")}
                className="bg-teal-600 hover:bg-teal-700 text-white px-7 py-3 rounded-lg font-semibold"
              >
                Get a Free Quote
              </button>
              <a
                href={PHONE_MAIN_HREF}
                className="bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 px-7 py-3 rounded-lg font-semibold"
              >
                Call Now: {PHONE_MAIN_DISPLAY}
              </a>
            </div>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, amount: 0.08 }}
          >
            {SERVICES.map((service) => (
              <motion.div
                key={service.id}
                variants={staggerItem}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                  <SmartImage
                    src={service.image}
                    alt={service.title}
                    className="h-full transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md w-fit mb-3">
                    Best For: {service.bestFor}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {service.title}
                  </h2>
                  <p className="text-gray-600 mt-3">{service.shortDescription}</p>
                  <div className="mt-4 rounded-lg bg-teal-50 p-4">
                    <p className="text-teal-700 font-bold">{service.priceGuide}</p>
                    <p className="text-sm text-teal-800 mt-1">
                      Typical duration: {service.typicalDuration}
                    </p>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-gray-700">
                    {service.includes.slice(0, 3).map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 w-fit">
                    Before/after examples available
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/services/${service.id}`)}
                    className="mt-6 inline-flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-lg font-semibold"
                  >
                    View Service Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-14 rounded-2xl border border-gray-200 bg-gray-50 p-8"
            {...scrollReveal}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Why clients choose Apex Five Cleaning
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <ShieldCheck className="w-7 h-7 text-teal-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">Insured and vetted</p>
                <p className="text-sm text-gray-600 mt-2">
                  Trusted teams with clear standards and accountability.
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <Star className="w-7 h-7 text-teal-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">Consistent quality</p>
                <p className="text-sm text-gray-600 mt-2">
                  Repeatable cleaning quality for homes and businesses.
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <ArrowRight className="w-7 h-7 text-teal-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">Fast quote flow</p>
                <p className="text-sm text-gray-600 mt-2">
                  Simple quote process with response typically within one business day.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div className="mt-12" {...scrollReveal}>
            <div className="text-center mb-7">
              <h3 className="text-2xl font-bold text-gray-900">Before and after examples</h3>
              <p className="text-gray-600 mt-2">
                Visual clarity on expected outcomes across our most requested services.
              </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              {SERVICES.slice(0, 3).map((service) => (
                <div key={`${service.id}-before-after`} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{service.title}</p>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="relative">
                    <button
                      type="button"
                      onClick={() => setLightboxImage(service.beforeAfter.beforeImage)}
                      className="w-full group relative"
                    >
                      <SmartImage
                        src={service.beforeAfter.beforeImage}
                        alt={`${service.title} before cleaning example`}
                        className="aspect-[4/3]"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 right-2 text-[10px] uppercase tracking-wide bg-black/70 text-white px-2 py-1 rounded opacity-90 group-hover:opacity-100">
                        View full image
                      </span>
                    </button>
                      <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide bg-gray-900/75 text-white px-2 py-1 rounded">
                        Before
                      </span>
                    </div>
                    <div className="relative">
                    <button
                      type="button"
                      onClick={() => setLightboxImage(service.beforeAfter.afterImage)}
                      className="w-full group relative"
                    >
                      <SmartImage
                        src={service.beforeAfter.afterImage}
                        alt={`${service.title} after cleaning example`}
                        className="aspect-[4/3]"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 right-2 text-[10px] uppercase tracking-wide bg-black/70 text-white px-2 py-1 rounded opacity-90 group-hover:opacity-100">
                        View full image
                      </span>
                    </button>
                      <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide bg-teal-700/90 text-white px-2 py-1 rounded">
                        After
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-gray-500 md:hidden">Tap any image to zoom</p>
          </motion.div>

          <motion.div
            className="mt-10 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 sm:p-10 text-center"
            {...scrollReveal}
          >
            <h3 className="text-3xl font-bold text-white mb-3">
              Ready to book the right service?
            </h3>
            <p className="text-teal-50 text-lg mb-7 max-w-2xl mx-auto">
              Tell us what you need and we will send a tailored, no-obligation quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate("/request-a-quote")}
                className="bg-white text-teal-700 hover:bg-teal-50 px-7 py-3 rounded-lg font-semibold"
              >
                Get a Free Quote
              </button>
              <a
                href={PHONE_MAIN_HREF}
                className="bg-amber-400 text-gray-900 hover:bg-amber-300 px-7 py-3 rounded-lg font-semibold"
              >
                Call {PHONE_MAIN_DISPLAY}
              </a>
            </div>
          </motion.div>
        </div>
      </motion.section>
      <ImageLightbox
        image={lightboxImage}
        alt="Expanded service example"
        onClose={() => setLightboxImage("")}
      />
    </>
  );
}
