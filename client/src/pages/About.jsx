import { Check, Leaf, ShieldCheck } from "lucide-react";
import SEO from "../components/SEO";
import MarketingCTA from "../components/marketing/MarketingCTA";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingSection from "../components/marketing/MarketingSection";
import ProofStrip from "../components/marketing/ProofStrip";
import { COMPANY_ADDRESS_LINE1, COMPANY_ADDRESS_LINE2 } from "../config/site";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <>
      <SEO title="About Apex Five" description="Meet Apex Five Cleaning, a local team delivering reliable, eco-conscious cleaning across Kent, London, and Essex." path="/about" image="/images/services/Service_Residential_Cleaning.png" />
      <MarketingSection tone="soft" className="pt-12 sm:pt-16">
        <MarketingHeader eyebrow="About Apex Five" title="Meet the Person Behind Apex Five Cleaning" intro="A clean environment should be within reach for everyone." />
        <div className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <figure className="overflow-hidden rounded-lg bg-zinc-100">
            <img
              src="/images/Professional_Business_Headshot.jpg"
              alt="Portrait of Ayomide Omolewa, founder of Apex Five Cleaning, in a professional setting"
              width="1122"
              height="1402"
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover"
            />
            <figcaption className="sr-only">Ayomide Omolewa, founder of Apex Five Cleaning</figcaption>
          </figure>
          <div className="space-y-5 text-zinc-600">
            <p>I started Apex Five Cleaning because I believe everyone deserves a clean environment, whether they are young or old, well or unwell. The places we live in shape our everyday routines and can help us feel more comfortable and supported. I wanted cleaning to feel like a practical, respectful service that helps people care for the environment around them.</p>
            <p>That belief is still at the heart of the company. We work with homes, rentals and workplaces, listening to what each space needs and agreeing a clear plan before we begin. I want customers to feel that a clean, welcoming environment is something they deserve, not a luxury reserved for a few. I also want people to feel confident about the care and communication they can expect from us.</p>
            <p className="border-l-2 border-brand-600 pl-4 font-medium text-zinc-900">Apex Five Cleaning exists to make professional cleaning simple, reliable and stress-free — so you always know who is coming into your home, what to expect, and that the job will be done properly.</p>
            <Link to="/request-a-quote" className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
              Get Your Free Quote
            </Link>
            <div className="flex items-center gap-3 border-l-2 border-brand-600 pl-4 text-sm font-semibold text-zinc-900"><Leaf className="h-5 w-5 text-brand-700" aria-hidden="true" /> Local team. Clear service.</div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="How we work" title="Clear standards, human service" intro={`Our registered office is at ${COMPANY_ADDRESS_LINE1}, ${COMPANY_ADDRESS_LINE2}, and our team supports properties throughout the surrounding South East.`}>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [ShieldCheck, "Reliable by design", "Clear scopes, consistent checklists, and a team that respects your space."],
            [Leaf, "Conscious choices", "Eco-friendly options are available for homes, families, pets, and workplaces."],
            [Check, "Easy to arrange", "A short quote flow, responsive communication, and no-obligation guidance."],
          ].map(([Icon, title, text]) => <div key={title} className="border-t-2 border-brand-600 pt-5"><Icon className="h-6 w-6 text-brand-700" aria-hidden="true" /><h2 className="mt-4 text-xl font-semibold text-zinc-950">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p></div>)}
        </div>
        <div className="mt-12"><ProofStrip compact /></div>
      </MarketingSection>

      <MarketingCTA title="Ready for a cleaner space?" intro="Get a free quote for your home, rental, or workplace." />
    </>
  );
}
