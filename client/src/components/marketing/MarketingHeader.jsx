export default function MarketingHeader({ eyebrow, title, intro, align = "left" }) {
  return (
    <div className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-5xl">{title}</h1>
      {intro && <p className="mt-5 text-lg leading-8 text-zinc-600 sm:text-xl">{intro}</p>}
    </div>
  );
}