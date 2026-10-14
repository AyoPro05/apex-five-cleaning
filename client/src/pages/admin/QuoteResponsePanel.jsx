import { useState } from "react";
import { Send, RotateCcw, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function QuoteResponsePanel({quote, adminNotes, onAdminNotesChange, onQuoteChange, onSubmit, onRetry, submitState}) {
  const [validationError, setValidationError] = useState("");
  const busy = submitState === "loading";
  const delivery = quote.delivery?.approvedResponse || (quote.delivery?.status ? quote.delivery : null);
  const deliveryStatus = delivery?.status;
  const queued = ["queued", "pending", "processing"].includes(deliveryStatus);
  const sent = deliveryStatus === "completed";
  const change = (key, value) => {setValidationError(""); onQuoteChange({...quote, [key]: value});};
  const submit = (event) => {
    event.preventDefault();
    const amount = Number(quote.approvedAmount);
    if (quote.status === "converted" && (!Number.isFinite(amount) || amount <= 0 || amount > 1000000)) {
      setValidationError("Enter a positive amount from £0.01 to £1,000,000."); return;
    }
    if ((quote.customerMessage || "").length > 1000) {setValidationError("Customer message must be 1,000 characters or fewer."); return;}
    onSubmit();
  };
  const control = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 disabled:opacity-50";
  return <form onSubmit={submit} noValidate className="space-y-4 border-t pt-5">
    <h3 className="text-lg font-semibold text-gray-900">Update Quote</h3>
    <div><label htmlFor="response-status" className="block text-sm font-medium mb-2">Status</label>
      <select id="response-status" className={control} disabled={busy} value={quote.status} onChange={e => change("status", e.target.value)}>
        <option value="new">New</option><option value="contacted">Contacted</option><option value="converted">Converted</option><option value="rejected">Rejected</option>
      </select></div>
    {quote.status === "converted" && <div><label htmlFor="response-amount" className="block text-sm font-medium mb-2">Amount (£) – for Pay Online</label>
      <input id="response-amount" type="number" min="0.01" max="1000000" step="0.01" required disabled={busy} value={quote.approvedAmount ?? ""} onChange={e => change("approvedAmount", e.target.value)} className={control} />
      <p className="text-xs text-gray-500 mt-1">Lets the customer pay online without registering.</p></div>}
    <div><label htmlFor="response-message" className="block text-sm font-medium mb-2">Customer message</label>
      <textarea id="response-message" rows="4" maxLength={1000} disabled={busy} value={quote.customerMessage || ""} onChange={e => change("customerMessage", e.target.value)} className={control} aria-describedby="response-message-count" />
      <p id="response-message-count" className="text-xs text-gray-500">{(quote.customerMessage || "").length} / 1,000 characters</p></div>
    <div><label htmlFor="response-notes" className="block text-sm font-medium mb-2">Admin notes — Internal only</label>
      <textarea id="response-notes" rows="3" disabled={busy} value={adminNotes || ""} onChange={e => onAdminNotesChange(e.target.value)} className={control} />
      <p className="text-xs text-gray-500">These notes stay in the admin workspace.</p></div>
    {validationError && <p role="alert" className="text-sm text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" aria-hidden="true" />{validationError}</p>}
    {submitState === "error" && <p role="alert" className="text-sm text-red-700">The change could not be saved. Please try again.</p>}
    <div role="status" aria-live="polite" className="text-sm">
      {queued && <p className="inline-flex items-center gap-2 text-amber-900"><Clock className="w-4 h-4" aria-hidden="true" />{submitState === "success" ? "Saved and queued" : "Queued"}</p>}
      {sent && <p className="inline-flex items-center gap-2 text-green-800"><CheckCircle className="w-4 h-4" aria-hidden="true" />Sent</p>}
      {deliveryStatus === "failed" && <p className="inline-flex items-center gap-2 text-red-700"><AlertCircle className="w-4 h-4" aria-hidden="true" />Delivery failed. You can retry sending.</p>}
      {submitState === "success" && !delivery && <p>Saved</p>}
    </div>
    <div className="flex flex-col sm:flex-row gap-3">
      <button type="submit" disabled={busy} className="inline-flex justify-center items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50"><Send className="w-4 h-4" aria-hidden="true" />{busy ? "Saving..." : "Save Changes"}</button>
      {deliveryStatus === "failed" && <button type="button" disabled={busy} onClick={() => onRetry(delivery.jobId || delivery._id)} className="inline-flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-semibold disabled:opacity-50"><RotateCcw className="w-4 h-4" aria-hidden="true" />Retry delivery</button>}
    </div>
  </form>;
}
