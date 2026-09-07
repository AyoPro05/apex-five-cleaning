import ConversionActions from "./ConversionActions";

export default function MarketingCTA({ title = "Ready for a cleaner space?", intro = "Get a free quote from our local team." }) {
  return (
    <section className="bg-brand-700 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-100">Ready when you are</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold sm:text-4xl">{title}</h2>
          <p className="mt-3 max-w-xl text-brand-100">{intro}</p>
        </div>
        <ConversionActions dark />
      </div>
    </section>
  );
}