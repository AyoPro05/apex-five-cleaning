import { ArrowUpRight, Check, ChevronRight, Leaf, ShieldCheck, Star } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import ConversionActions from "../components/marketing/ConversionActions";
import MarketingSection from "../components/marketing/MarketingSection";
import ProofStrip from "../components/marketing/ProofStrip";
import QuoteStarter from "../components/marketing/QuoteStarter";
import { SERVICES } from "../data/servicesCatalog";

const featuredServices = SERVICES.slice(0, 6);

const testimonials = [
  {
    quote: "They’re reliable, thorough, and always leave the house feeling fresh and calm.",
    name: "Sarah M.",
    detail: "Domestic cleaning client",
  },
  {
    quote: "The place looked move-in ready and the handover was straightforward with no surprises.",
    name: "James R.",
    detail: "Property manager",
  },
  {
    quote: "The deep clean made a huge difference. Every room felt reset and properly finished.",
    name: "Michael H.",
    detail: "Homeowner",
  },
];

function ServiceCard({ service }) {
  return (
    <Link
      to={`/services/${service.id}`}
      className="group overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-950/10"
    >
      <div className="aspect-[4/3] overflow-hidden bg-zinc-100">
        <img
          src={service.image}
          alt={service.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">For {service.bestFor}</p>
        <h3 className="mt-2 text-xl font-semibold text-zinc-950">{service.title}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{service.shortDescription}</p>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
          Explore service
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <SEO
        title="Cleaning services across Kent, London & Essex"
        description="Reliable domestic, tenancy, Airbnb and commercial cleaning from a local team. Request a free quote from Apex Five Cleaning."
        path="/"
      />

      <section className="relative isolate overflow-hidden bg-zinc-950 text-white">
        <img
          src="/images/heroes/Hero_Services.png"
          alt="Bright, freshly cleaned modern kitchen"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,18,17,.92),rgba(9,18,17,.58),rgba(9,18,17,.2))]" />
        <div className="mx-auto grid min-h-[min(760px,calc(100vh-5rem))] max-w-7xl items-end gap-12 px-4 pb-14 pt-24 sm:px-6 sm:pb-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:pt-20">
          <div className="max-w-2xl animate-[fade-up_.7s_ease-out_both]">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-100">Cleaning across Kent, London & Essex</p>
            <h1 className="max-w-xl text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">More time for life. Less time cleaning.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-200 sm:text-xl">Reliable cleaning for homes, rentals, and workplaces.</p>
            <div className="mt-8"><ConversionActions dark /></div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-200">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-brand-200" /> Free quote</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-brand-200" /> Fast local reply</span>
            </div>
          </div>

          <div className="w-full max-w-md justify-self-end animate-[fade-up_.7s_.12s_ease-out_both]">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><span className="h-2 w-2 rounded-full bg-brand-300" /> Check your area</div>
            <QuoteStarter />
          </div>
        </div>
      </section>

      <MarketingSection className="pt-8 sm:pt-10" tone="soft"><ProofStrip /></MarketingSection>

      <MarketingSection eyebrow="Our services" title="Cleaning that fits your life" intro="Choose the service you need, then request a quote in minutes." tone="soft">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featuredServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
        <div className="mt-8 text-center"><Link to="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900">View all cleaning services <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div>
      </MarketingSection>

      <MarketingSection tone="white">
        <div className="grid items-center gap-10 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">Why Apex Five</p>
            <h2 className="text-3xl font-semibold leading-tight text-zinc-950 sm:text-4xl">A dependable clean, every visit.</h2>
            <p className="mt-5 text-lg leading-8 text-zinc-600">Clear communication, careful work, and product options for homes, families, and pets.</p>
            <ul className="mt-7 space-y-4 text-sm text-zinc-700">
              <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" /><span><strong className="text-zinc-950">Insured team</strong><br />Clear expectations and reliable service.</span></li>
              <li className="flex gap-3"><Leaf className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" /><span><strong className="text-zinc-950">Eco-friendly options</strong><br />Lower-fragrance products available.</span></li>
              <li className="flex gap-3"><Star className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" /><span><strong className="text-zinc-950">Local support</strong><br />A real team to answer your questions.</span></li>
            </ul>
            <div className="mt-8"><Link to="/about" className="text-sm font-semibold text-brand-700 hover:text-brand-900">Meet the team <ArrowUpRight className="ml-1 inline h-4 w-4" aria-hidden="true" /></Link></div>
          </div>
          <div className="overflow-hidden rounded-lg bg-zinc-100"><img src="/images/services/Service_Residential_Cleaning.png" alt="Freshly cleaned residential room" loading="lazy" className="aspect-[4/3] h-full w-full object-cover" /></div>
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Reviews" title="Trusted by local clients" tone="soft">
        <div className="grid gap-5 lg:grid-cols-3">{testimonials.map((testimonial) => <figure key={testimonial.name} className="border-t-2 border-brand-600 pt-5"><div className="flex gap-1 text-brand-600" aria-label="5 out of 5 stars">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-current" aria-hidden="true" />)}</div><blockquote className="mt-5 text-lg leading-8 text-zinc-800">“{testimonial.quote}”</blockquote><figcaption className="mt-6 text-sm"><strong className="text-zinc-950">{testimonial.name}</strong><span className="ml-2 text-zinc-500">{testimonial.detail}</span></figcaption></figure>)}</div>
        <div className="mt-8"><Link to="/testimonials" className="text-sm font-semibold text-brand-700 hover:text-brand-900">Read more reviews <ArrowUpRight className="ml-1 inline h-4 w-4" aria-hidden="true" /></Link></div>
      </MarketingSection>

      <section className="bg-brand-700 text-white"><div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-16"><div><p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-100">Ready when you are</p><h2 className="mt-2 max-w-2xl text-3xl font-semibold sm:text-4xl">A cleaner space is one conversation away.</h2></div><ConversionActions dark /></div></section>
    </>
  );
}