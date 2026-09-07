import { MessageCircle } from "lucide-react";

function SuspectedSpamBadge({ item }) {
  if (!item?.suspectedSpam) return null;
  return (
    <span title={(item.suspicionReasons || []).join(" · ") || "Flagged for review"} className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
      Suspected
    </span>
  );
}

export default function AdminAnalyticsTables({ analytics, navigate, chatLeadUpdatingId, updateChatLeadStatus }) {
  return (
    <>
      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
          <button type="button" onClick={() => navigate("/admin/quotes")} className="text-sm font-medium text-teal-600 hover:text-teal-700">View All →</button>
        </div>
        <div className="overflow-x-auto">
          {!analytics.recentBookings?.length ? <div className="p-8 text-center text-sm text-gray-500">No recent payments</div> : (
            <table className="w-full"><thead className="bg-gray-50"><tr>{["Customer", "Service", "Date", "Amount", "Status"].map((heading) => <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">{heading}</th>)}</tr></thead>
              <tbody className="divide-y">{analytics.recentBookings.map((booking) => <tr key={booking.id} className="hover:bg-gray-50"><td className="px-6 py-3 text-sm"><span className="font-medium text-gray-900">{booking.customer}</span><span className="block text-xs text-gray-500">{booking.email}</span></td><td className="px-6 py-3 text-sm capitalize text-gray-600">{booking.service}</td><td className="px-6 py-3 text-sm text-gray-600">{booking.date ? new Date(booking.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}</td><td className="px-6 py-3 text-sm font-medium text-gray-900">{booking.amountDisplay}</td><td className="px-6 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${booking.status === "succeeded" ? "bg-green-100 text-green-800" : booking.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>{booking.status === "succeeded" ? "Paid" : booking.status === "pending" ? "Pending" : booking.status}</span></td></tr>)}</tbody>
            </table>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <div className="flex items-center justify-between border-b px-6 py-4"><h3 className="flex items-center gap-2 font-semibold text-gray-900"><MessageCircle className="h-4 w-4 text-cyan-600" />Recent Chat Leads</h3><button type="button" onClick={() => navigate("/admin/customers")} className="text-sm font-medium text-teal-600 hover:text-teal-700">Open Customers →</button></div>
        <div className="overflow-x-auto">
          {!analytics.chatLeads?.recent?.length ? <div className="p-8 text-center text-sm text-gray-500">No chat leads captured yet</div> : (
            <table className="w-full"><thead className="bg-gray-50"><tr>{["Name", "Contact", "Service", "Date", "Status"].map((heading) => <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">{heading}</th>)}</tr></thead>
              <tbody className="divide-y">{analytics.chatLeads.recent.map((lead) => <tr key={lead._id} className="hover:bg-gray-50"><td className="px-6 py-3 text-sm font-medium text-gray-900"><div className="flex flex-wrap items-center gap-2"><span>{lead.name || "—"}</span><SuspectedSpamBadge item={lead} /></div></td><td className="px-6 py-3 text-sm text-gray-600">{lead.email || lead.phone || "—"}{lead.postcode ? <span className="block text-xs text-gray-500">{lead.postcode}</span> : null}</td><td className="px-6 py-3 text-sm text-gray-600">{lead.serviceType || "—"}</td><td className="px-6 py-3 text-sm text-gray-600">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}</td><td className="px-6 py-3 text-sm"><select value={lead.status || "new"} disabled={chatLeadUpdatingId === lead._id} onChange={(event) => updateChatLeadStatus(lead._id, event.target.value)} className="rounded-full border border-cyan-200 bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-800 focus:outline-none focus:ring-1 focus:ring-cyan-400"><option value="new">new</option><option value="contacted">contacted</option><option value="qualified">qualified</option><option value="closed">closed</option></select></td></tr>)}</tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}