export default function MarketingSection({
  eyebrow,
  title,
  intro,
  children,
  tone = "white",
  className = "",
  align = "left",
}) {
  const toneClass =
    tone === "soft"
      ? "bg-zinc-50"
      : tone === "dark"
        ? "bg-zinc-950 text-white"
        : "bg-white";

  return (
    <section className={`py-16 sm:py-20 ${toneClass} ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(eyebrow || title || intro) && (
          <div
            className={`mb-10 max-w-3xl ${
              align === "center" ? "mx-auto text-center" : ""
            }`}
          >
            {eyebrow && (
              <p
                className={`mb-3 text-sm font-semibold ${
                  tone === "dark" ? "text-brand-100" : "text-brand-700"
                }`}
              >
                {eyebrow}
              </p>
            )}
            {title && (
              <h2
                className={`text-3xl font-semibold leading-tight sm:text-4xl ${
                  tone === "dark" ? "text-white" : "text-zinc-950"
                }`}
              >
                {title}
              </h2>
            )}
            {intro && (
              <p
                className={`mt-4 text-lg leading-8 ${
                  tone === "dark" ? "text-zinc-300" : "text-zinc-600"
                }`}
              >
                {intro}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
