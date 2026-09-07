import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";
import { PHONE_MAIN_DISPLAY, PHONE_MAIN_HREF } from "../../config/site";
import { setQuotePrefill } from "../../utils/quotePrefill";
import { quoteServiceValue } from "../../utils/serviceIntent";

const styles = {
  primary:
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-brand-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
  primaryDark:
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-base font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-700",
  secondary:
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-5 py-3 text-base font-semibold text-zinc-900 transition hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
  secondaryDark:
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-white/35 bg-white/10 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-700",
};

export default function ConversionActions({
  quoteLabel = "Get a Free Quote",
  callLabel = `Call ${PHONE_MAIN_DISPLAY}`,
  serviceType = "",
  dark = false,
  align = "left",
  className = "",
}) {
  const handleQuoteClick = () => {
    const mappedService = quoteServiceValue(serviceType);
    if (mappedService) setQuotePrefill({ serviceType: mappedService });
  };

  const wrapperClass = [
    "flex flex-col gap-3 sm:flex-row",
    align === "center" ? "sm:justify-center" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass}>
      <Link
        to="/request-a-quote"
        onClick={handleQuoteClick}
        className={`${dark ? styles.primaryDark : styles.primary} w-full sm:w-auto`}
      >
        {quoteLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <a
        href={PHONE_MAIN_HREF}
        className={`${dark ? styles.secondaryDark : styles.secondary} w-full sm:w-auto`}
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
        {callLabel}
      </a>
    </div>
  );
}
