import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { setQuotePrefill } from "../../utils/quotePrefill";
import { normalisePostcode, quoteServiceValue } from "../../utils/serviceIntent";

export default function QuoteStarter({ serviceType = "", className = "" }) {
  const navigate = useNavigate();
  const [postcode, setPostcode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const formattedPostcode = normalisePostcode(postcode);
    if (!formattedPostcode) {
      setError("Enter your postcode");
      return;
    }

    setQuotePrefill({
      postcode: formattedPostcode,
      serviceType: quoteServiceValue(serviceType),
    });
    navigate("/request-a-quote");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-lg border border-white/35 bg-white/95 p-2 shadow-xl shadow-zinc-950/10 backdrop-blur ${className}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="quote-postcode">
          Postcode
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
            aria-hidden="true"
          />
          <input
            id="quote-postcode"
            name="postcode"
            value={postcode}
            onChange={(event) => {
              setPostcode(event.target.value);
              if (error) setError("");
            }}
            placeholder="Postcode"
            autoComplete="postal-code"
            className="min-h-[52px] w-full rounded-md border border-zinc-300 bg-white px-12 py-3 text-base text-zinc-950 placeholder:text-zinc-500 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          />
        </div>
        <button
          type="submit"
          className="min-h-[52px] rounded-md bg-brand-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Get My Free Quote
        </button>
      </div>
      {error && <p className="px-2 pt-2 text-sm font-semibold text-red-700">{error}</p>}
    </form>
  );
}
