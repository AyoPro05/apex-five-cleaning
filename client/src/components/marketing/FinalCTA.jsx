import { MapPin } from "lucide-react";
import ConversionActions from "./ConversionActions";

export default function FinalCTA({
  title = "Ready for a cleaner space?",
  intro = "Tell us what you need and we will send a clear, no-obligation quote.",
  quoteLabel = "Get a Free Quote",
  serviceType = "",
}) {
  return (
    <section className="bg-brand-700 py-16 text-white sm:py-20">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-brand-50">{intro}</p>
        <ConversionActions
          dark
          align="center"
          quoteLabel={quoteLabel}
          callLabel="Call Now"
          serviceType={serviceType}
          className="mt-8"
        />
        <p className="mt-5 inline-flex items-center justify-center gap-2 text-sm text-brand-50">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          Local teams serving Kent, London, and Essex
        </p>
      </div>
    </section>
  );
}
