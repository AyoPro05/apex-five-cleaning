import { ArrowUpRight } from "lucide-react";
import { GOOGLE_REVIEW_URL } from "../config/site";

export function getTrustedGoogleReviewUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isGoogleHost =
      hostname === "google.com" ||
      hostname.endsWith(".google.com") ||
      hostname === "g.page" ||
      hostname === "maps.app.goo.gl";

    return url.protocol === "https:" && isGoogleHost ? url.href : "";
  } catch {
    return "";
  }
}

export default function GoogleReviewCTA({ reviewUrl = GOOGLE_REVIEW_URL }) {
  const trustedUrl = getTrustedGoogleReviewUrl(reviewUrl);
  if (!trustedUrl) return null;

  return (
    <div className="mt-8 flex flex-col gap-4 border-l-2 border-brand-600 pl-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-2xl text-sm leading-6 text-zinc-600">
        Your feedback helps other local customers find a cleaning team they can trust.
      </p>
      <a
        href={trustedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        Leave Us a Google Review
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  );
}