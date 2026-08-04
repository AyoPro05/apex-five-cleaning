import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  PoundSterling,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import SEO from "../components/SEO";
import SmartImage from "../components/SmartImage";
import ImageLightbox from "../components/ImageLightbox";
import { SERVICES_BY_ID } from "../data/servicesCatalog";
import { buildBreadcrumbSchema } from "../config/seoSchemas";
import { PHONE_MAIN_DISPLAY, PHONE_MAIN_HREF, whatsappHref } from "../config/site";
import { scrollReveal, scrollRevealVisible } from "../utils/scrollReveal";

const LEGACY_ID_MAP = {
  residential: "domestic-cleaning",
  "end-of-tenancy": "end-of-tenancy-cleaning",
  airbnb: "airbnb-cleaning",
  commercial: "commercial-cleaning",
};

const BUGGY_WHATSAPP_TEXT =
  "Hi Apex Five Cleaning, I'd like to book your buggy, car seat & toy cleaning service (with the Posh loaner pram). Please give me a call back.";

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [lightboxImage, setLightboxImage] = useState("");

  const normalizedId = LEGACY_ID_MAP[serviceId] || serviceId;
  const service =
    SERVICES_BY_ID[normalizedId] || SERVICES_BY_ID["domestic-cleaning"];

  const serviceSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.title,
      description: service.shortDescription,
      provider: {
        "@type": "Organization",
        name: "Apex Five Cleaning",
      },
      areaServed: ["Kent", "London", "Essex"],
      offers: {
        "@type": "Offer",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "GBP",
          description: service.priceGuide,
        },
      },
      url: `https://www.apexfivecleaning.co.uk/services/${service.id}`,
    },
    buildBreadcrumbSchema([
      { name: "Home", url: "https://www.apexfivecleaning.co.uk/" },
      { name: "Services", url: "https://www.apexfivecleaning.co.uk/services" },
      {
        name: service.title,
        url: `https://www.apexfivecleaning.co.uk/services/${service.id}`,
      },
    ]),
  ];

  return (
    <>
      <SEO
        title={`${service.title} in Kent, London and Essex`}
        description={`${service.shortDescription} ${service.priceGuide}. See what is included, who it is for, how pricing works, and book with Apex Five Cleaning.`}
        path={`/services/${service.id}`}
        jsonLd={serviceSchemas}
      />

      <motion.section
        className="pt-32 pb-20 bg-white min-h-screen"
        {...scrollRevealVisible}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/services")}
            className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </button>

          <motion.div {...scrollReveal} className="grid lg:grid-cols-2 gap-8 mb-10">
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
              <SmartImage
                src={service.image}
                alt={service.title}
                className="min-h-[320px]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="inline-block text-xs uppercase tracking-wider font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md w-fit mb-3">
                Best For: {service.bestFor}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
                {service.title}
              </h1>
              <p className="text-lg text-gray-600 mt-4">{service.shortDescription}</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                <div className="rounded-lg bg-teal-50 p-4">
                  <p className="text-sm text-teal-700 font-medium inline-flex items-center gap-1">
                    <PoundSterling className="w-4 h-4" />
                    Price guidance
                  </p>
                  <p className="font-bold text-teal-800 mt-1">{service.priceGuide}</p>
                </div>
                <div className="rounded-lg bg-teal-50 p-4">
                  <p className="text-sm text-teal-700 font-medium inline-flex items-center gap-1">
                    <Clock3 className="w-4 h-4" />
                    Typical duration
                  </p>
                  <p className="font-bold text-teal-800 mt-1">{service.typicalDuration}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {service.ctaMode === "phone-only" ? (
                  <>
                    <a
                      href={whatsappHref(BUGGY_WHATSAPP_TEXT)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      WhatsApp Us
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <a
                      href={PHONE_MAIN_HREF}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50 font-semibold"
                    >
                      Call {PHONE_MAIN_DISPLAY}
                    </a>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate("/request-a-quote")}
                      className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      Get a Quote
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <a
                      href={PHONE_MAIN_HREF}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50 font-semibold"
                    >
                      Call {PHONE_MAIN_DISPLAY}
                    </a>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div {...scrollReveal} className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What’s included</h2>
              <ul className="space-y-3">
                {service.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 p-6 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Who it’s for</h2>
              <p className="text-gray-700">{service.whoFor}</p>
            </div>
          </motion.div>

          <motion.div {...scrollReveal} className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="rounded-2xl border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What affects pricing</h2>
              <ul className="space-y-3">
                {service.priceFactors.map((factor) => (
                  <li key={factor} className="flex items-start gap-2 text-gray-700">
                    <PoundSterling className="w-4 h-4 text-teal-600 flex-shrink-0 mt-1" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Key benefits</h2>
              <ul className="space-y-3">
                {service.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-gray-700">
                    <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0 mt-1" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div {...scrollReveal} className="rounded-2xl border border-teal-100 bg-teal-50 p-6 mb-8">
            <p className="text-sm uppercase tracking-wider text-teal-700 font-semibold mb-2">
              Client feedback
            </p>
            <blockquote className="text-xl text-gray-800 font-medium">
              “{service.testimonial.quote}”
            </blockquote>
            <p className="text-sm text-teal-700 mt-2 inline-flex items-center gap-1">
              <UserRoundCheck className="w-4 h-4" />
              {service.testimonial.by}
            </p>
          </motion.div>

          {service.beforeAfter && (
            <motion.div {...scrollReveal} className="rounded-2xl border border-gray-200 p-6 mb-8 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Before and after example</h2>
              <p className="text-gray-600 mb-5">
                A clear visual example of the level of transformation this service is designed to achieve.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setLightboxImage(service.beforeAfter.beforeImage)}
                      className="w-full group relative"
                    >
                      <SmartImage
                        src={service.beforeAfter.beforeImage}
                        alt={`${service.title} before cleaning`}
                        className="aspect-[4/3]"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 right-2 text-[10px] uppercase tracking-wide bg-black/70 text-white px-2 py-1 rounded opacity-90 group-hover:opacity-100">
                        View full image
                      </span>
                    </button>
                    <span className="absolute top-3 left-3 bg-gray-900/80 text-white text-xs px-2 py-1 rounded">
                      Before
                    </span>
                  </div>
                  <div className="p-3 text-sm text-gray-600">{service.beforeAfter.beforeLabel}</div>
                </div>
                <div className="rounded-xl overflow-hidden border border-teal-200">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setLightboxImage(service.beforeAfter.afterImage)}
                      className="w-full group relative"
                    >
                      <SmartImage
                        src={service.beforeAfter.afterImage}
                        alt={`${service.title} after cleaning`}
                        className="aspect-[4/3]"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 right-2 text-[10px] uppercase tracking-wide bg-black/70 text-white px-2 py-1 rounded opacity-90 group-hover:opacity-100">
                        View full image
                      </span>
                    </button>
                    <span className="absolute top-3 left-3 bg-teal-700/90 text-white text-xs px-2 py-1 rounded">
                      After
                    </span>
                  </div>
                  <div className="p-3 text-sm text-teal-700 font-medium">{service.beforeAfter.afterLabel}</div>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-gray-500 md:hidden">Tap any image to zoom</p>
            </motion.div>
          )}

          <motion.div {...scrollReveal} className="rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Service FAQs</h2>
            <div className="space-y-4">
              {service.faqs.map((faq) => (
                <div key={faq.q} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <h3 className="font-semibold text-gray-900">{faq.q}</h3>
                  <p className="text-gray-700 mt-1">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            {...scrollReveal}
            className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 text-center"
          >
            <h2 className="text-3xl font-bold text-white">Ready to book {service.title}?</h2>
            <p className="text-teal-50 mt-3 text-lg">
              {service.ctaMode === "phone-only"
                ? "Call or WhatsApp us to confirm a drop-off slot and we'll have a loaner ready."
                : "Request a quote now and we'll respond with clear next steps."}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              {service.ctaMode === "phone-only" ? (
                <>
                  <a
                    href={PHONE_MAIN_HREF}
                    className="bg-amber-400 text-gray-900 hover:bg-amber-300 px-7 py-3 rounded-lg font-semibold"
                  >
                    Call Now
                  </a>
                  <a
                    href={whatsappHref(BUGGY_WHATSAPP_TEXT)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-teal-700 hover:bg-teal-50 px-7 py-3 rounded-lg font-semibold"
                  >
                    WhatsApp Us
                  </a>
                </>
              ) : (
                <>
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
                    Call Now
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.section>
      <ImageLightbox
        image={lightboxImage}
        alt="Expanded before after example"
        onClose={() => setLightboxImage("")}
      />
    </>
  );
}
