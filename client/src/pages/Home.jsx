import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Leaf,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import SEO from "../components/SEO";
import ServiceAreaMap from "../components/ServiceAreaMap";
import SmartImage from "../components/SmartImage";
import ImageLightbox from "../components/ImageLightbox";
import { buildLocalBusinessSchema, buildWebSiteSchema } from "../config/seoSchemas";
import { PHONE_MAIN_DISPLAY, PHONE_MAIN_HREF } from "../config/site";
import { SERVICES } from "../data/servicesCatalog";
import { useAuth } from "../context/AuthContext";

const serviceCards = [
  {
    title: "Domestic Cleaning",
    subtitle: "For busy homeowners",
    description: "Regular weekly or bi-weekly cleaning that keeps your home consistently fresh.",
  },
  {
    title: "End of Tenancy",
    subtitle: "For tenants and landlords",
    description: "Detailed move-out cleaning designed to help properties pass inventory checks.",
  },
  {
    title: "Airbnb Cleaning",
    subtitle: "For hosts and short lets",
    description: "Fast, reliable turnover cleaning between guests with consistent standards.",
  },
  {
    title: "Office & Commercial",
    subtitle: "For businesses",
    description: "Professional cleaning plans for offices, retail spaces, and commercial sites.",
  },
];

const testimonialHighlights = [
  {
    name: "Sarah M.",
    service: "Domestic Cleaning",
    quote: "Reliable team, spotless finish, and easy communication every time.",
  },
  {
    name: "James R.",
    service: "End of Tenancy",
    quote: "The property looked move-in ready. Great attention to detail.",
  },
  {
    name: "Emma T.",
    service: "Airbnb Cleaning",
    quote: "Quick turnaround and consistent quality for every guest changeover.",
  },
];

const GOOGLE_REVIEW_URL = "https://share.google/ByNUvIHRlpT95uh09";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: "easeOut" },
};

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, openSignIn } = useAuth();

  useEffect(() => {
    if (isAuthenticated) return;
    if (location.state?.from) {
      openSignIn?.();
    }
  }, [isAuthenticated, location.state, openSignIn]);
  const [lightboxImage, setLightboxImage] = useState("");
  const homeSchemas = [buildWebSiteSchema(), buildLocalBusinessSchema()];
  const beforeAfterHighlights = [
    SERVICES.find((s) => s.id === "domestic-cleaning"),
    SERVICES.find((s) => s.id === "end-of-tenancy-cleaning"),
    SERVICES.find((s) => s.id === "airbnb-cleaning"),
  ].filter(Boolean);

  return (
    <>
      <SEO
        title="Eco-Friendly Cleaning Services | Kent, London & Essex"
        description="Professional domestic, end of tenancy, Airbnb, and office cleaning across Kent, London, and Essex. Get a fast quote from Apex Five Cleaning."
        path="/"
        jsonLd={homeSchemas}
      />

      <section className="relative min-h-[78vh] flex items-center overflow-hidden pt-28">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/images/heroes/Hero_Services.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/75 via-teal-900/70 to-slate-900/65" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <motion.div {...fadeUp} className="max-w-3xl text-white">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-100 mb-4">
              Professional Cleaning Services
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Eco-friendly cleaning for homes and businesses across Kent, London, and Essex.
            </h1>
            <p className="text-lg text-teal-50 mt-5 max-w-2xl">
              Trusted by homeowners, tenants, landlords, Airbnb hosts, and commercial clients who need reliable results and clear communication.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate("/request-a-quote")}
                className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-lg font-semibold"
              >
                Get a Free Quote
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={PHONE_MAIN_HREF}
                className="inline-flex items-center justify-center gap-2 bg-teal-500/30 border border-teal-200/50 hover:bg-teal-500/40 px-6 py-3 rounded-lg font-semibold"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </a>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate("/pay-online")}
                className="inline-flex items-center justify-center gap-2 bg-white/15 border border-white/30 hover:bg-white/25 px-6 py-3 rounded-lg font-semibold"
              >
                Pay Online
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isAuthenticated) navigate("/dashboard");
                  else openSignIn?.();
                }}
                className="inline-flex items-center justify-center gap-2 bg-slate-900/30 border border-white/30 hover:bg-slate-900/40 px-6 py-3 rounded-lg font-semibold"
              >
                {isAuthenticated ? "Dashboard" : "Login"}
              </button>
            </div>

            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                <p className="text-xs uppercase text-teal-100 mb-1">Reviews</p>
                <p className="font-semibold">4.9/5 rating from verified clients</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                <p className="text-xs uppercase text-teal-100 mb-1">Trusted Team</p>
                <p className="font-semibold">Insured, vetted, and reliable</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                <p className="text-xs uppercase text-teal-100 mb-1">Local Coverage</p>
                <p className="font-semibold">Serving Kent, London, and Essex</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Choose your service type</h2>
            <p className="text-gray-600 mt-3">Select the service that matches your property and goals.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceCards.map((card) => (
              <motion.button
                {...fadeUp}
                key={card.title}
                type="button"
                onClick={() => navigate("/services")}
                className="text-left p-5 rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-sm transition bg-gray-50/60"
              >
                <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                <p className="text-sm text-teal-700 mt-1 font-medium">{card.subtitle}</p>
                <p className="text-sm text-gray-600 mt-3">{card.description}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Before and after clarity</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">Real cleaning outcomes, not vague promises</h2>
            <p className="text-gray-600 mt-3 max-w-3xl mx-auto">
              See the transformation style we aim for across domestic, tenancy, and short-let cleanups.
            </p>
          </motion.div>
          <div className="grid lg:grid-cols-3 gap-6">
            {beforeAfterHighlights.map((service) => (
              <motion.div {...fadeUp} key={service.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">{service.title}</h3>
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
                        alt={`${service.title} before cleaning`}
                        className="aspect-[4/3]"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 right-2 text-[10px] uppercase tracking-wide bg-black/70 text-white px-2 py-1 rounded opacity-90 group-hover:opacity-100">
                        View full image
                      </span>
                    </button>
                    <span className="absolute top-2 left-2 text-[11px] bg-gray-900/75 text-white px-2 py-1 rounded">
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
                        alt={`${service.title} after cleaning`}
                        className="aspect-[4/3]"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 right-2 text-[10px] uppercase tracking-wide bg-black/70 text-white px-2 py-1 rounded opacity-90 group-hover:opacity-100">
                        View full image
                      </span>
                    </button>
                    <span className="absolute top-2 left-2 text-[11px] bg-teal-700/90 text-white px-2 py-1 rounded">
                      After
                    </span>
                  </div>
                </div>
                <div className="p-4 text-sm text-gray-600">
                  <p>{service.beforeAfter.beforeLabel}</p>
                  <p className="mt-1 text-teal-700 font-medium">{service.beforeAfter.afterLabel}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-gray-500 md:hidden">Tap any image to zoom</p>
        </div>
      </section>

      <section className="py-12 bg-teal-50 border-y border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-4">
          <motion.div {...fadeUp} className="rounded-xl bg-white p-5 border border-gray-100">
            <div className="flex items-center gap-2 text-teal-700 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <p className="font-semibold">Insured and dependable</p>
            </div>
            <p className="text-sm text-gray-600">Professional teams with clear standards and quality checks.</p>
          </motion.div>
          <motion.div {...fadeUp} className="rounded-xl bg-white p-5 border border-gray-100">
            <div className="flex items-center gap-2 text-teal-700 mb-2">
              <Leaf className="w-5 h-5" />
              <p className="font-semibold">Eco-friendly approach</p>
            </div>
            <p className="text-sm text-gray-600">Safer, non-harsh products available for family and pet-friendly spaces.</p>
          </motion.div>
          <motion.div {...fadeUp} className="rounded-xl bg-white p-5 border border-gray-100">
            <div className="flex items-center gap-2 text-teal-700 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <p className="font-semibold">Fast quote response</p>
            </div>
            <p className="text-sm text-gray-600">Most quote requests are answered within one business day.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Reviews</p>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">What clients say before they rebook</h2>
            </div>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-teal-700 font-semibold hover:text-teal-800"
            >
              Read Google reviews
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonialHighlights.map((item) => (
              <motion.div {...fadeUp} key={item.name} className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700">&quot;{item.quote}&quot;</p>
                <p className="mt-4 text-sm font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-teal-700">{item.service}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Service area proof</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">Local cleaning coverage you can verify</h2>
          </motion.div>
          <motion.div {...fadeUp} className="rounded-2xl overflow-hidden border border-gray-200 bg-white p-4">
            <ServiceAreaMap height="360px" />
          </motion.div>
          <motion.div {...fadeUp} className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate("/service-areas")}
              className="px-6 py-3 rounded-lg bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 font-semibold"
            >
              View service areas
            </button>
            <a
              href={PHONE_MAIN_HREF}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold"
            >
              <Phone className="w-4 h-4" />
              Call {PHONE_MAIN_DISPLAY}
            </a>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-teal-700 to-teal-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-bold">Ready for a cleaner home or workspace?</h2>
            <p className="text-teal-100 mt-3 text-lg">
              Tell us what you need and we will send a clear, no-obligation quote.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/request-a-quote")}
                className="px-6 py-3 rounded-lg bg-white text-teal-700 hover:bg-teal-50 font-semibold"
              >
                Get a Free Quote
              </button>
              <a
                href={PHONE_MAIN_HREF}
                className="px-6 py-3 rounded-lg bg-amber-400 text-gray-900 hover:bg-amber-300 font-semibold"
              >
                Call Now
              </a>
            </div>
            <p className="mt-4 text-sm text-teal-100 inline-flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Local teams serving Kent, London, and Essex
            </p>
          </motion.div>
        </div>
      </section>
      <ImageLightbox
        image={lightboxImage}
        alt="Expanded cleaning result example"
        onClose={() => setLightboxImage("")}
      />
    </>
  );
}
