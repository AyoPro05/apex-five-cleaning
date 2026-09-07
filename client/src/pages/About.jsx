import { Check, Leaf, ShieldCheck } from "lucide-react";
import SEO from "../components/SEO";
import MarketingCTA from "../components/marketing/MarketingCTA";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingSection from "../components/marketing/MarketingSection";
import ProofStrip from "../components/marketing/ProofStrip";
import { COMPANY_ADDRESS_LINE1, COMPANY_ADDRESS_LINE2 } from "../config/site";

export default function About() {
  return (
    <>
      <SEO title="About Apex Five Cleaning" description="Meet Apex Five Cleaning, a local team delivering reliable, eco-conscious cleaning across Kent, London, and Essex." path="/about" image="/images/services/Service_Residential_Cleaning.png" />
      <MarketingSection tone="soft" className="pt-12 sm:pt-16">
        <MarketingHeader eyebrow="About Apex Five" title="A clean you can count on." intro="Founded by Ayomide Omolewa, Apex Five Cleaning makes professional cleaning simple, reliable, and easy to book." />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="overflow-hidden rounded-lg bg-zinc-100"><img src="/images/services/Service_Residential_Cleaning.png" alt="Freshly cleaned residential room" className="aspect-[4/3] h-full w-full object-cover" /></div>
          <div className="space-y-5 text-zinc-600">
            <p>We clean homes, rentals, and workplaces across Kent, London, and Essex. Every booking starts with a clear plan for your property and priorities.</p>
            <p>We show up when we say we will, communicate clearly, and offer eco-friendly product options where they suit the job.</p>
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
