import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, patch, getBlob, getImageUrl } from "../utils/apiClient";
import {
  Download,
  Eye,
  EyeOff,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  LogOut,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("quotes");
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("adminToken") || "",
  );
  const [showTokenInput, setShowTokenInput] = useState(!adminToken);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: "new",
    search: "",
    page: 1,
    limit: 20,
  });

  // Update note for selected quote
  const [adminNote, setAdminNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState("");

  // Customers (registered users)
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPagination, setCustomerPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  // Fetch quotes
  const fetchQuotes = async () => {
    if (!adminToken) {
      setError("Admin token required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        status: filters.status === "all" ? "all" : filters.status,
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
      });

      const data = await get(`/api/admin/quotes?${params}`);
      if (data.success) {
        setQuotes(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    if (!adminToken) return;

    try {
      const data = await get("/api/admin/stats");
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch customers (registered users)
  const fetchCustomers = async (options = {}) => {
    if (!adminToken) {
      setCustomersError("Admin token required");
      return;
    }

    const page = options.page || customerPagination.page || 1;
    const limit = options.limit || customerPagination.limit || 20;

    setCustomersLoading(true);
    setCustomersError("");

    try {
      const params = new URLSearchParams({
        page,
        limit,
        search: customerSearch || "",
      });
      const data = await get(`/api/admin/users?${params}`);
      if (data.success) {
        setCustomers(data.data || []);
        const { total = 0, page: p = page, limit: l = limit } =
          data.pagination || {};
        setCustomerPagination({
          page: p,
          limit: l,
          total,
        });
      } else {
        setCustomersError(data.error || "Failed to load customers");
      }
    } catch (err) {
      setCustomersError(err.message);
    } finally {
      setCustomersLoading(false);
    }
  };

  // Update quote
  const updateQuote = async (quoteId, status, notes, amount) => {
    setUpdatingStatus("loading");
    try {
      const payload = { status, adminNotes: notes };
      if (amount !== undefined && status === "converted") payload.approvedAmount = amount;
      const data = await patch(`/api/admin/quotes/${quoteId}`, payload);

      if (data.success) {
        setUpdatingStatus("success");
        setTimeout(() => {
          setUpdatingStatus("");
          setShowDetails(false);
          fetchQuotes();
        }, 1500);
      }
    } catch (err) {
      setUpdatingStatus("error");
      setError(err.message);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    if (!adminToken) return;

    try {
      const params = new URLSearchParams({
        status: filters.status === "all" ? "all" : filters.status,
      });

      const blob = await getBlob(`/api/admin/export/csv?${params}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotes_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to export CSV");
    }
  };

  // Initial load
  useEffect(() => {
    if (adminToken) {
      fetchQuotes();
      fetchStats();
    }
  }, [adminToken]);

  // Refetch when filters change
  useEffect(() => {
    if (adminToken && !showTokenInput) {
      fetchQuotes();
    }
  }, [filters, adminToken]);

  // Load customers when switching to the Customers tab
  useEffect(() => {
    if (adminToken && !showTokenInput && activeTab === "customers") {
      fetchCustomers();
    }
  }, [activeTab, adminToken, showTokenInput]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "new":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "contacted":
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case "converted":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      new: { bg: "bg-yellow-100", text: "text-yellow-800", label: "New" },
      contacted: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Contacted",
      },
      converted: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Converted",
      },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
    };
    const config = statusMap[status] || statusMap["new"];
    return `${config.bg} ${config.text}`;
  };

  if (showTokenInput) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Admin Access
          </h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Token
              </label>
              <input
                type="password"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="Enter your admin token"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <button
              onClick={() => {
                if (adminToken) {
                  localStorage.setItem("adminToken", adminToken);
                  setShowTokenInput(false);
                }
              }}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-semibold transition"
            >
              Access Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Sidebar navigation */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Admin Menu
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("quotes")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                    activeTab === "quotes"
                      ? "bg-teal-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Quotes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("customers")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                    activeTab === "customers"
                      ? "bg-teal-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Customers
                </button>
              </div>
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={() => {
                    localStorage.removeItem("adminToken");
                    setAdminToken("");
                    setShowTokenInput(true);
                    navigate("/");
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition"
                  title="Log out when stepping away from your desk"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {activeTab === "quotes" && (
              <>
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Quote Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Manage and export customer quotes
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={exportToCSV}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                {/* Statistics */}
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-lg p-6 shadow">
                      <div className="text-gray-600 text-sm font-medium">
                        Total Quotes
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.totalQuotes}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow">
                      <div className="text-yellow-600 text-sm font-medium">
                        New
                      </div>
                      <div className="text-3xl font-bold text-yellow-600 mt-2">
                        {stats.newQuotes}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow">
                      <div className="text-blue-600 text-sm font-medium">
                        Contacted
                      </div>
                      <div className="text-3xl font-bold text-blue-600 mt-2">
                        {stats.contactedQuotes}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow">
                      <div className="text-green-600 text-sm font-medium">
                        Converted
                      </div>
                      <div className="text-3xl font-bold text-green-600 mt-2">
                        {stats.convertedQuotes}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow">
                      <div className="text-red-600 text-sm font-medium">
                        Rejected
                      </div>
                      <div className="text-3xl font-bold text-red-600 mt-2">
                        {stats.rejectedQuotes}
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            status: e.target.value,
                            page: 1,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search
                      </label>
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            search: e.target.value,
                            page: 1,
                          })
                        }
                        placeholder="Name, email, phone..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Per Page
                      </label>
                      <select
                        value={filters.limit}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            limit: parseInt(e.target.value),
                            page: 1,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Quotes Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                      <p className="text-gray-600 mt-4">Loading quotes...</p>
                    </div>
                  ) : quotes.length === 0 ? (
                    <div className="p-12 text-center text-gray-600">
                      No quotes found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Service
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Date
                            </th>
                            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {quotes.map((quote) => (
                            <tr
                              key={quote._id}
                              className="hover:bg-gray-50 transition"
                            >
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {quote.firstName} {quote.lastName}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {quote.email}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                {quote.serviceType.replace("-", " ")}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(quote.status)}`}
                                >
                                  {getStatusIcon(quote.status)}
                                  {quote.status.charAt(0).toUpperCase() +
                                    quote.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {new Date(
                                  quote.createdAt,
                                ).toLocaleDateString("en-GB")}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedQuote(quote);
                                    setAdminNote(quote.adminNotes || "");
                                    setShowDetails(true);
                                  }}
                                  className="text-teal-600 hover:text-teal-700 font-semibold"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {!loading && quotes.length > 0 && (
                  <div className="mt-6 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Page {filters.page} of{" "}
                      {Math.ceil(stats?.totalQuotes / filters.limit) || 1}
                    </p>
                    <div className="space-x-2">
                      <button
                        onClick={() =>
                          setFilters({
                            ...filters,
                            page: Math.max(1, filters.page - 1),
                          })
                        }
                        disabled={filters.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronLeft className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() =>
                          setFilters({
                            ...filters,
                            page: filters.page + 1,
                          })
                        }
                        disabled={
                          filters.page >=
                          Math.ceil(stats?.totalQuotes / filters.limit)
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronRight className="w-4 h-4 inline" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "customers" && (
              <>
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Customers
                    </h1>
                    <p className="text-gray-600 mt-1">
                      View registered customer accounts
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const blob = await getBlob("/api/admin/export/users-csv");
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `customers_${new Date().toISOString().split("T")[0]}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (err) {
                          setCustomersError("Failed to export customers CSV");
                        }
                      }}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {customersError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800">{customersError}</p>
                  </div>
                )}

                {/* Search */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <div className="flex flex-col md:flex-row gap-4 md:items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search customers
                      </label>
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Name, email, phone..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchCustomers({ page: 1 })}
                      className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </button>
                  </div>
                </div>

                {/* Customers table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {customersLoading ? (
                    <div className="p-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                      <p className="text-gray-600 mt-4">Loading customers...</p>
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="p-12 text-center text-gray-600">
                      No customers found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Phone
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Verified
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Joined
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {customers.map((c) => (
                            <tr key={c._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {c.firstName} {c.lastName}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {c.email}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {c.phone}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span
                                  className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                    c.isVerified
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {c.isVerified ? "Verified" : "Pending"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                {c.role || "member"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {c.createdAt
                                  ? new Date(c.createdAt).toLocaleDateString(
                                      "en-GB",
                                    )
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Customers pagination */}
                {customers.length > 0 && (
                  <div className="mt-6 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Page {customerPagination.page} of{" "}
                      {Math.ceil(
                        (customerPagination.total || 0) /
                          (customerPagination.limit || 1),
                      ) || 1}
                    </p>
                    <div className="space-x-2">
                      <button
                        type="button"
                        disabled={customerPagination.page <= 1}
                        onClick={() =>
                          fetchCustomers({
                            page: Math.max(1, customerPagination.page - 1),
                          })
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronLeft className="w-4 h-4 inline" />
                      </button>
                      <button
                        type="button"
                        disabled={
                          customerPagination.page >=
                          Math.ceil(
                            (customerPagination.total || 0) /
                              (customerPagination.limit || 1),
                          )
                        }
                        onClick={() =>
                          fetchCustomers({
                            page: customerPagination.page + 1,
                          })
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronRight className="w-4 h-4 inline" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quote Details Modal */}
      {showDetails && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Quote Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Quote Reference */}
              {selectedQuote.reference && (
                <div className="bg-teal-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Quote Reference</p>
                  <p className="font-mono font-semibold text-gray-900 text-lg tracking-wider">
                    {selectedQuote.reference}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Customer can use this to pay online (Pay Online page)
                  </p>
                </div>
              )}

              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">First Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedQuote.firstName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedQuote.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">
                      {selectedQuote.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">
                      {selectedQuote.phone}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">
                      {selectedQuote.address}
                      {selectedQuote.postcode && (
                        <span className="ml-1 font-semibold"> {selectedQuote.postcode}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Property Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Property Type</p>
                    <p className="font-medium text-gray-900">
                      {{
                        house: "House",
                        flat: "Flat/Apartment",
                        bungalow: "Bungalow",
                        commercial: "Commercial",
                        "sharehouse-room": "Sharehouse/Room",
                      }[selectedQuote.propertyType] || selectedQuote.propertyType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Service Type</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {selectedQuote.serviceType.replace("-", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bedrooms</p>
                    <p className="font-medium text-gray-900">
                      {selectedQuote.bedrooms}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bathrooms</p>
                    <p className="font-medium text-gray-900">
                      {selectedQuote.bathrooms}
                    </p>
                  </div>
                </div>
                {(selectedQuote.additionalServices || []).length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Additional Services</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuote.additionalServices.map((id) => {
                        const labels = {
                          "interior-fridge-freezer": "Fridge & Freezer",
                          "oven-hob-extractor": "Oven, Hob & Extractor",
                          "microwave-deep-cleaning": "Microwave Deep Clean",
                          "washing-machine-cleaning": "Washing Machine",
                          "interior-window-blind": "Window & Blind",
                          "deep-tile-grout": "Tile & Grout",
                          "skirting-board-cleaning": "Skirting Board",
                          "changing-bedsheet": "Changing Bedsheet",
                          "carpet-rug-cleaning": "Carpet & Rug",
                          "cabinet-cupboard-organization": "Cabinet Organization",
                          "sanitizing-high-touch": "Sanitizing",
                        };
                        return (
                          <span
                            key={id}
                            className="inline-block px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm"
                          >
                            {labels[id] || id}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {(selectedQuote.images || []).length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Property Photos</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuote.images.map((img, i) => {
                        const imageUrl = getImageUrl(img.url);
                        return (
                          <a
                            key={i}
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-teal-500"
                          >
                            <img
                              src={imageUrl}
                              alt={`Property ${i + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%239ca3af'%3E%3Crect width='80' height='80' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='10'%3EImage%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
                {selectedQuote.additionalNotes && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Additional Notes</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">
                      {selectedQuote.additionalNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Update */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Update Quote
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedQuote.status}
                      onChange={(e) =>
                        setSelectedQuote({
                          ...selectedQuote,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  {selectedQuote.status === "converted" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (£) – for Pay Online
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={selectedQuote.approvedAmount ?? ""}
                        onChange={(e) =>
                          setSelectedQuote({
                            ...selectedQuote,
                            approvedAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                          })
                        }
                        placeholder="e.g. 150"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Lets customer pay online without registering.
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes
                    </label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add notes about this quote..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      rows="4"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
                >
                  Close
                </button>
                <button
                  onClick={() =>
                    updateQuote(
                      selectedQuote._id,
                      selectedQuote.status,
                      adminNote,
                      selectedQuote.status === "converted" ? selectedQuote.approvedAmount : undefined,
                    )
                  }
                  disabled={updatingStatus === "loading"}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition ${
                    updatingStatus === "loading"
                      ? "bg-gray-400 cursor-not-allowed"
                      : updatingStatus === "success"
                        ? "bg-green-600"
                        : updatingStatus === "error"
                          ? "bg-red-600"
                          : "bg-teal-600 hover:bg-teal-700"
                  }`}
                >
                  {updatingStatus === "loading"
                    ? "Saving..."
                    : updatingStatus === "success"
                      ? "Saved!"
                      : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
