import { Leaf, MapPin, ShieldCheck, Star } from "lucide-react";

const items = [
  {
    label: "4.9/5 rated",
    detail: "Reviewed by local clients",
    icon: Star,
  },
  {
    label: "Insured team",
    detail: "Vetted, reliable cleaners",
    icon: ShieldCheck,
  },
  {
    label: "Eco option",
    detail: "Family and pet-conscious products",
    icon: Leaf,
  },
  {
    label: "Kent, London & Essex",
    detail: "Local quote response",
    icon: MapPin,
  },
];

export default function ProofStrip({ compact = false }) {
  return (
    <div
      className={`grid gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 ${
        compact ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-4"
      }`}
    >
      {items.map(({ label, detail, icon: Icon }) => (
        <div key={label} className="bg-white p-4 sm:p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="font-semibold text-zinc-950">{label}</p>
          <p className="mt-1 text-sm text-zinc-600">{detail}</p>
        </div>
      ))}
    </div>
  );
}
