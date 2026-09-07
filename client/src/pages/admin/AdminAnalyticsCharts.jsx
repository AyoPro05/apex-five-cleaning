import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = ["#0d9488", "#f59e0b", "#8b5cf6", "#06b6d4", "#10b981"];

export default function AdminAnalyticsCharts({ analytics }) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="mb-1 font-semibold text-gray-900">Revenue Overview</h3>
        <p className="mb-4 text-sm text-gray-500">Monthly income (last 12 months)</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.revenueByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `£${value}`} />
              <Tooltip formatter={(value) => [`£${Number(value).toFixed(2)}`, "Income"]} />
              <Line type="monotone" dataKey="income" stroke="#0d9488" strokeWidth={2} name="Income" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="mb-1 font-semibold text-gray-900">Service Distribution</h3>
        <p className="mb-4 text-sm text-gray-500">Bookings by service type</p>
        <div className="flex h-64 items-center justify-center">
          {analytics.serviceDistribution?.length && analytics.serviceDistribution.some((service) => service.count > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.serviceDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, count }) => `${name} ${count}`}
                >
                  {analytics.serviceDistribution.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Count"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}