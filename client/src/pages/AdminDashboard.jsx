import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { get, post, patch, getBlob, del } from "../utils/apiClient";
import FallbackImage from "../components/FallbackImage";
import QuoteResponsePanel from "./admin/QuoteResponsePanel";
import StaffOperations from "./admin/StaffOperations";
import {
  useAdminInactivityLogout,
  clearAdminActivityTimestamp,
} from "../hooks/useAdminInactivityLogout";
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
    Trash2,
	  BarChart3,
	  Users,
  MessageCircle,
	} from "lucide-react";

  const AdminAnalyticsCharts = lazy(() => import("./admin/AdminAnalyticsCharts"));
  const AdminAnalyticsTables = lazy(() => import("./admin/AdminAnalyticsTables"));

const RETENTION_MONTHS = 6;
const SUSPICION_REASON_LABELS = {
  low_captcha_score: "Low CAPTCHA score",
  captcha_unverified: "CAPTCHA not verified",
  missing_postcode: "Missing postcode",
  ip_burst: "Multiple submissions from same IP",
  email_burst: "Multiple quotes from same email (24h)",
  disposable_email: "Disposable email domain",
  missing_contact: "Missing email and phone",
  phone_only_chat: "Chat lead with phone only",
};

function formatSuspicionReasons(reasons = []) {
  return (reasons || []).map((key) => SUSPICION_REASON_LABELS[key] || key);
}

function SuspectedSpamBadge({ item }) {
  if (!item?.suspectedSpam) return null;
  const label = formatSuspicionReasons(item.suspicionReasons).join(" · ") || "Flagged for review";
  return (
    <span
      title={label}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200"
    >
      <AlertCircle className="w-3 h-3" />
      Suspected
    </span>
  );
}

const getTabFromPath = (pathname = "") => {
  if (pathname.startsWith("/admin/quotes")) return "quotes";
  if (pathname.startsWith("/admin/customers")) return "customers";
  if (pathname.startsWith("/admin/chat-leads")) return "chat-leads";
  if (pathname.startsWith("/admin/staff")) return "staff";
  return "dashboard";
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const deepLinkQuoteId = (new URLSearchParams(location.search).get("quoteId") || "").trim();
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [chatLeadUpdatingId, setChatLeadUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminTokenInput, setAdminTokenInput] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(() => {
    return !Boolean(sessionStorage.getItem("adminSession"));
  });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [quoteImageUrls, setQuoteImageUrls] = useState({});
  const [processedDeepLinkQuoteId, setProcessedDeepLinkQuoteId] = useState("");

  const adminAuthenticated = Boolean(sessionStorage.getItem('adminSession'));

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
  const [chatLeads, setChatLeads] = useState([]);
  const [chatLeadsLoading, setChatLeadsLoading] = useState(false);
  const [chatLeadsError, setChatLeadsError] = useState("");
  const [chatLeadSearch, setChatLeadSearch] = useState("");
  const [chatLeadStatusFilter, setChatLeadStatusFilter] = useState("all");
  const [selectedChatLeadIds, setSelectedChatLeadIds] = useState([]);
  const [chatLeadsPagination, setChatLeadsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  useEffect(() => {
    if (!showDetails || !selectedQuote?._id || !selectedQuote.images?.length || !adminAuthenticated) {
      setQuoteImageUrls({});
      return undefined;
    }

    let cancelled = false;
    const objectUrls = [];

    (async () => {
      const next = {};
      for (let i = 0; i < selectedQuote.images.length; i += 1) {
        try {
          const blob = await getBlob(`/api/admin/quotes/${selectedQuote._id}/images/${i}`);
          const objectUrl = URL.createObjectURL(blob);
          objectUrls.push(objectUrl);
          next[i] = objectUrl;
        } catch (err) {
          console.error("Failed to load quote image:", err);
        }
      }
      if (!cancelled) setQuoteImageUrls(next);
    })();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [showDetails, selectedQuote?._id, selectedQuote?.images?.length, adminAuthenticated]);

  // Fetch quotes
  const fetchQuotes = async () => {
    if (!adminAuthenticated) {
      setError("Admin login required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
      });
      if (filters.status === "suspected") {
        params.set("suspected", "1");
        params.set("status", "all");
      } else {
        params.set("status", filters.status === "all" ? "all" : filters.status);
      }

      const data = await get(`/api/admin/quotes?${params}`);
      if (data.success) {
        setQuotes(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openQuoteDetails = useCallback(
    async (quoteOrId) => {
      const quoteId = typeof quoteOrId === "string" ? quoteOrId : quoteOrId?._id;
      if (!quoteId) return;

      if (typeof quoteOrId === "object") {
        setSelectedQuote(quoteOrId);
        setAdminNote(quoteOrId.adminNotes || "");
        setUpdatingStatus("");
        setShowDetails(true);
      }

      try {
        const data = await get(`/api/admin/quotes/${quoteId}`);
        if (data.success && data.quote) {
          setSelectedQuote({...data.quote, delivery: data.delivery || data.quote.delivery});
          setAdminNote(data.quote.adminNotes || "");
          setUpdatingStatus("");
          setShowDetails(true);
          return;
        }
        setError(data.error || "Failed to load quote details");
      } catch (err) {
        console.error("Failed to load quote details:", err);
        setError(err.message || "Failed to load quote details");
      }
    },
    [],
  );

  // Fetch statistics
  const fetchStats = async () => {
    if (!adminAuthenticated) return;

    try {
      const data = await get("/api/admin/stats");
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      console.error("Error fetching stats:", err);
      setError(err.message || "Failed to load stats");
    }
  };

  // Fetch analytics for dashboard tab
  const fetchAnalytics = async () => {
    if (!adminAuthenticated) return;
    setAnalyticsLoading(true);
    try {
      const data = await get("/api/admin/analytics");
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      console.error("Error fetching analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleDeleteCustomer = async (customer) => {
    if (
      !window.confirm(
        `Delete customer "${customer.firstName} ${customer.lastName}" (${customer.email})? This cannot be undone.`,
      )
    )
      return;
    setDeletingId(customer._id);
    setCustomersError("");
    try {
      // GDPR: only accounts older than 6 months can be deleted (enforced by API)
      await del(`/api/admin/users/${customer._id}?olderThanMonths=6`);
      await fetchCustomers({ page: customerPagination.page });
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      const msg = err.response?.data?.error || err.message;
      const isRetentionError =
        typeof msg === "string" &&
        msg.toLowerCase().includes("gdpr retention");

      if (isRetentionError) {
        const forceDelete = window.confirm(
          `${msg}\n\nUse force delete for this account now?`,
        );
        if (forceDelete) {
          try {
            await del(`/api/admin/users/${customer._id}?olderThanMonths=6&force=true`);
            await fetchCustomers({ page: customerPagination.page });
            return;
          } catch (forceErr) {
            const forceMsg = forceErr.response?.data?.error || forceErr.message;
            setCustomersError(forceMsg);
            return;
          }
        }
      }

      setCustomersError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteQuote = async (quote) => {
    if (
      !window.confirm(
        `Delete quote "${quote.reference || quote._id}" for ${quote.firstName} ${quote.lastName}? It will be retained for 30 days before permanent removal.`,
      )
    ) {
      return;
    }
    setDeletingQuoteId(quote._id);
    setError("");
    try {
      await del(`/api/admin/quotes/${quote._id}`);
      await fetchQuotes();
      await fetchStats();
      if (activeTab === "dashboard") {
        await fetchAnalytics();
      }
      if (showDetails && selectedQuote?._id === quote._id) {
        setShowDetails(false);
      }
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      const msg = err.response?.data?.error || err.message;
      setError(msg || "Failed to delete quote");
    } finally {
      setDeletingQuoteId(null);
    }
  };

  // Fetch customers (registered users)
	  const fetchCustomers = async (options = {}) => {
    if (!adminAuthenticated) {
      setCustomersError("Admin login required");
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
      if (handleAdminAuthError(err)) return;
      setCustomersError(err.message);
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchChatLeads = async (options = {}) => {
    if (!adminAuthenticated) return;
    const page = options.page || chatLeadsPagination.page || 1;
    const limit = options.limit || chatLeadsPagination.limit || 20;
    setChatLeadsLoading(true);
    setChatLeadsError("");
    try {
      const params = new URLSearchParams({
        page,
        limit,
        search: chatLeadSearch || "",
      });
      if (chatLeadStatusFilter === "suspected") {
        params.set("suspected", "1");
        params.set("status", "all");
      } else {
        params.set("status", chatLeadStatusFilter);
      }
      const data = await get(`/api/admin/chat-leads?${params}`);
      if (data.success) {
        setChatLeads(data.data || []);
        setSelectedChatLeadIds([]);
        const { total = 0, page: p = page, limit: l = limit } = data.pagination || {};
        setChatLeadsPagination({
          page: p,
          limit: l,
          total,
        });
      } else {
        setChatLeadsError(data.error || "Failed to load chat leads");
      }
    } catch (err) {
      setChatLeadsError(err.response?.data?.error || err.message);
    } finally {
      setChatLeadsLoading(false);
    }
  };

  // Persist the response and keep delivery feedback visible in the modal.
  const updateQuote = async (quoteId, status, notes, amount, customerMessage) => {
    setUpdatingStatus("loading"); setError("");
    try {
      const payload = {status, adminNotes: notes, customerMessage: customerMessage || ""};
      if (amount !== undefined && amount !== "" && status === "converted") payload.approvedAmount = Number(amount);
      const data = await patch(`/api/admin/quotes/${quoteId}`, payload);
      if (!data.success) throw new Error(data.error || "Failed to save quote");
      setSelectedQuote({...data.quote, delivery: data.delivery || data.quote?.delivery});
      setAdminNote(data.quote?.adminNotes || "");
      setUpdatingStatus("success");
      fetchQuotes();
    } catch (err) {setUpdatingStatus("error"); setError(err.response?.data?.error || err.message);}
  };
  const retryQuoteDelivery = async jobId => {
    if (!jobId || !selectedQuote?._id) return;
    setUpdatingStatus("loading"); setError("");
    try {
      const result = await post(`/api/admin/automation/jobs/${jobId}/retry`, {});
      if (!result.success) throw new Error(result.error || "Could not retry delivery");
      const detail = await get(`/api/admin/quotes/${selectedQuote._id}`);
      if (!detail.success) throw new Error(detail.error || "Could not reload quote");
      setSelectedQuote({...detail.quote, delivery: detail.delivery || detail.quote?.delivery});
      setUpdatingStatus("success");
    } catch (err) {setUpdatingStatus("error"); setError(err.response?.data?.error || err.message);}
  };

  const clearQuoteSuspicion = async (quoteId) => {
    setUpdatingStatus("loading");
    try {
      const data = await patch(`/api/admin/quotes/${quoteId}`, { clearSuspicion: true });
      if (data.success) {
        if (data.quote) setSelectedQuote(data.quote);
        fetchQuotes();
        fetchAnalytics();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingStatus("");
    }
  };

  const clearChatLeadSuspicion = async (leadId) => {
    setChatLeadUpdatingId(leadId);
    try {
      const lead = chatLeads.find((item) => item._id === leadId);
      const result = await patch(`/api/admin/chat-leads/${leadId}`, {
        status: lead?.status || "new",
        clearSuspicion: true,
      });
      if (result?.success) {
        await fetchChatLeads();
        await fetchAnalytics();
      }
    } catch (err) {
      setChatLeadsError(err.response?.data?.error || err.message);
    } finally {
      setChatLeadUpdatingId(null);
    }
  };

  const updateChatLeadStatus = async (leadId, status) => {
    setError("");
    setChatLeadUpdatingId(leadId);
    try {
      const result = await patch(`/api/admin/chat-leads/${leadId}`, { status });
      if (!result?.success) {
        setError(result?.error || "Failed to update chat lead status");
        return;
      }
      await fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to update chat lead status");
    } finally {
      setChatLeadUpdatingId(null);
    }
  };

  const bulkUpdateChatLeadsStatus = async (status) => {
    if (!selectedChatLeadIds.length) return;
    setChatLeadsError("");
    setChatLeadUpdatingId("bulk");
    try {
      await Promise.all(
        selectedChatLeadIds.map((leadId) =>
          patch(`/api/admin/chat-leads/${leadId}`, { status }),
        ),
      );
      await Promise.all([fetchAnalytics(), fetchChatLeads({ page: chatLeadsPagination.page })]);
    } catch (err) {
      setChatLeadsError(err.response?.data?.error || err.message || "Failed to bulk update chat leads");
    } finally {
      setChatLeadUpdatingId(null);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    if (!adminAuthenticated) return;

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
    if (adminAuthenticated) {
      fetchQuotes();
      fetchStats();
    }
  }, [adminAuthenticated]);

  // Refetch when filters change
  useEffect(() => {
    if (adminAuthenticated && !showTokenInput) {
      fetchQuotes();
    }
  }, [filters, adminAuthenticated, showTokenInput]);

  // Keep active tab in sync with URL path.
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (!deepLinkQuoteId) setProcessedDeepLinkQuoteId("");
  }, [deepLinkQuoteId]);

  // Deep-link support: if email link points to /admin/?quoteId=..., route to quotes first.
  useEffect(() => {
    if (!adminAuthenticated || showTokenInput || !deepLinkQuoteId) return;
    if (location.pathname.startsWith("/admin/quotes")) return;
    navigate(`/admin/quotes?quoteId=${encodeURIComponent(deepLinkQuoteId)}`, { replace: true });
  }, [adminAuthenticated, showTokenInput, deepLinkQuoteId, location.pathname, navigate]);

  // Open the linked quote once the admin session is active and we're on the quotes tab.
  useEffect(() => {
    if (!adminAuthenticated || showTokenInput || !deepLinkQuoteId) return;
    if (!location.pathname.startsWith("/admin/quotes")) return;
    if (processedDeepLinkQuoteId === deepLinkQuoteId) return;

    setProcessedDeepLinkQuoteId(deepLinkQuoteId);
    openQuoteDetails(deepLinkQuoteId).finally(() => {
      navigate("/admin/quotes", { replace: true });
    });
  }, [adminAuthenticated, showTokenInput, deepLinkQuoteId, location.pathname, processedDeepLinkQuoteId, openQuoteDetails, navigate]);

  // Load customers when switching to the Customers tab
  useEffect(() => {
    if (adminAuthenticated && !showTokenInput && activeTab === "customers") {
      fetchCustomers();
    }
  }, [activeTab, adminAuthenticated, showTokenInput]);

  useEffect(() => {
    if (adminAuthenticated && !showTokenInput && activeTab === "chat-leads") {
      fetchChatLeads();
    }
  }, [activeTab, adminAuthenticated, showTokenInput, chatLeadStatusFilter, chatLeadSearch, chatLeadsPagination.page, chatLeadsPagination.limit]);

	  // Load analytics when switching to the Dashboard tab
    useEffect(() => {
      if (adminAuthenticated && !showTokenInput && activeTab === "dashboard") {
        fetchAnalytics();
      }
    }, [activeTab, adminAuthenticated, showTokenInput]);

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

  const adminLogout = useCallback((options = {}) => {
    // Call server logout to clear HttpOnly cookie, then clear any client-side remnants
    try {
      post('/api/admin/logout');
    } catch (e) {
      // ignore
    }
    sessionStorage.removeItem("adminJwt");
    localStorage.removeItem("adminSession");
    sessionStorage.removeItem("adminSession");
    localStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminToken");
    clearAdminActivityTimestamp();
    setAdminTokenInput("");
    setShowTokenInput(true);
    setSelectedQuote(null);
    setShowDetails(false);
    if (options.idle) {
      setLoginError(
        "You were signed out after 10 minutes of inactivity. Please sign in again.",
      );
    }
  }, []);

  const handleAdminAuthError = useCallback((err) => {
    const message =
      err?.response?.data?.message || err?.response?.data?.error || err?.message || "Authentication failed";
    if (
      err?.response?.status === 401 ||
      /authentication token|no token|invalid token|token expired/i.test(message)
    ) {
      adminLogout();
      setLoginError(
        "Your admin session has expired or is invalid. Please sign in again.",
      );
      return true;
    }
    return false;
  }, [adminLogout]);

  const handleIdleLogout = useCallback(() => {
    adminLogout({ idle: true });
    navigate("/");
  }, [adminLogout, navigate]);

  useAdminInactivityLogout(Boolean(adminAuthenticated) && !showTokenInput, handleIdleLogout);

  const handleAdminLogin = async () => {
    if (!adminTokenInput.trim()) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await post("/api/admin/login", { token: adminTokenInput.trim() });
      if (res.success) {
        // The server session is an HttpOnly cookie; this flag is UI state only.
        sessionStorage.setItem('adminSession', '1');
        localStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminToken");
        setAdminTokenInput("");
        setShowTokenInput(false);
      } else {
        setLoginError(res.error || "Login failed");
      }
    } catch (err) {
      setLoginError(err.message || "Invalid admin token");
    } finally {
      setLoginLoading(false);
    }
  };

  if (showTokenInput) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Admin Access
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Enter your admin token to receive a short-lived session. You will be signed out automatically after 10
            minutes without activity, or when your session expires.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAdminLogin()
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="adminToken" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Token
              </label>
              <input
                id="adminToken"
                name="adminToken"
                type="password"
                value={adminTokenInput}
                onChange={(e) => {
                  setAdminTokenInput(e.target.value)
                  setLoginError("")
                }}
                placeholder="Enter your admin token"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                disabled={loginLoading}
                autoComplete="one-time-code"
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading || !adminTokenInput.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2 rounded-lg font-semibold transition"
            >
              {loginLoading ? "Signing in…" : "Access Dashboard"}
            </button>
          </form>
        </div>
      </div>
    )
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
                  onClick={() => navigate("/admin")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                    activeTab === "dashboard"
                      ? "bg-teal-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/quotes")}
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
                  onClick={() => navigate("/admin/customers")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                    activeTab === "customers"
                      ? "bg-teal-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Customers
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/chat-leads")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                    activeTab === "chat-leads"
                      ? "bg-teal-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Chat Leads
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/staff")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                    activeTab === "staff"
                      ? "bg-teal-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Staff
                </button>
              </div>
              <div className="mt-6 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    adminLogout();
                    navigate("/");
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition"
                  title="Sign out of admin"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {activeTab === "dashboard" && (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-1">Overview of bookings, payments and revenue</p>
                </div>

                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
                  </div>
                ) : analytics ? (
                  <div className="space-y-8">
                    {/* KPI cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
                        <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.totalBookings}</p>
                      </div>
                      <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
                        <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.pendingPaymentsCount}</p>
                        <p className="text-sm text-purple-600 mt-0.5">£{(analytics.pendingPaymentsTotal || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-white rounded-xl shadow p-6 border-l-4 border-teal-500">
                        <p className="text-sm font-medium text-gray-600">Completed Payments</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.completedPaymentsCount}</p>
                        <p className="text-sm text-teal-600 mt-0.5">£{(analytics.completedPaymentsTotal || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-white rounded-xl shadow p-6 border-l-4 border-amber-500">
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">£{(analytics.totalRevenue || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-white rounded-xl shadow p-6 border-l-4 border-cyan-500">
                        <p className="text-sm font-medium text-gray-600">Chat Leads (Total)</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.chatLeads?.total || 0}</p>
                      </div>
                      <div className="bg-white rounded-xl shadow p-6 border-l-4 border-indigo-500">
                        <p className="text-sm font-medium text-gray-600">Chat Leads (Last 7d)</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.chatLeads?.last7d || 0}</p>
                      </div>
                      <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
                        <p className="text-sm font-medium text-gray-600">Suspected Spam</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {(analytics.suspectedQuotes || 0) + (analytics.suspectedChatLeads || 0)}
                        </p>
                        <p className="text-sm text-orange-600 mt-0.5">
                          {analytics.suspectedQuotes || 0} quotes · {analytics.suspectedChatLeads || 0} chat leads
                        </p>
                      </div>
                    </div>

                    <Suspense fallback={<div className="rounded-xl bg-white p-8 text-center text-sm text-gray-500">Loading analytics...</div>}>
                      <AdminAnalyticsCharts analytics={analytics} />
                    </Suspense>

                    <Suspense fallback={<div className="rounded-xl bg-white p-8 text-center text-sm text-gray-500">Loading dashboard tables...</div>}>
                      <AdminAnalyticsTables
                        analytics={analytics}
                        navigate={navigate}
                        chatLeadUpdatingId={chatLeadUpdatingId}
                        updateChatLeadStatus={updateChatLeadStatus}
                      />
                    </Suspense>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    <p>Unable to load analytics</p>
                    <button
                      type="button"
                      onClick={fetchAnalytics}
                      className="mt-3 inline-flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </>
            )}

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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-red-800">{error}</p>
                    <button
                      type="button"
                      onClick={fetchQuotes}
                      className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 text-sm font-semibold hover:bg-red-100"
                    >
                      Retry
                    </button>
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
                        <option value="suspected">Suspected spam</option>
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
                              Risk
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>
                                    {quote.firstName} {quote.lastName}
                                  </span>
                                  <SuspectedSpamBadge item={quote} />
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {quote.email}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                {quote.serviceType.replace("-", " ")}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {quote.suspectedSpam ? (
                                  <span className="text-amber-800" title={formatSuspicionReasons(quote.suspicionReasons).join(" · ")}>
                                    {formatSuspicionReasons(quote.suspicionReasons)[0] || "Review"}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
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
                                <div className="inline-flex items-center gap-3">
                                  <button
                                    onClick={() => openQuoteDetails(quote)}
                                    className="text-teal-600 hover:text-teal-700 font-semibold"
                                  >
                                    View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuote(quote)}
                                    disabled={deletingQuoteId === quote._id}
                                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    {deletingQuoteId === quote._id ? "Deleting..." : "Delete"}
                                  </button>
                                </div>
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-red-800">{customersError}</p>
                    <button
                      type="button"
                      onClick={() => fetchCustomers({ page: customerPagination.page || 1 })}
                      className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 text-sm font-semibold hover:bg-red-100"
                    >
                      Retry
                    </button>
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
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                              Actions
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
                              <td className="px-6 py-4 text-sm text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomer(c)}
                                  disabled={deletingId === c._id}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete customer (GDPR – only accounts older than 6 months)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {deletingId === c._id ? "Deleting..." : "Delete"}
                                </button>
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

            {activeTab === "chat-leads" && (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Chat Leads</h1>
                  <p className="text-gray-600 mt-1">Manage leads captured by the AI chat assistant</p>
                </div>

                {chatLeadsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-red-800">{chatLeadsError}</p>
                    <button
                      type="button"
                      onClick={fetchChatLeads}
                      className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 text-sm font-semibold hover:bg-red-100"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search chat leads
                      </label>
                      <input
                        type="text"
                        value={chatLeadSearch}
                        onChange={(e) => {
                          setChatLeadSearch(e.target.value);
                          setChatLeadsPagination((p) => ({ ...p, page: 1 }));
                        }}
                        placeholder="Name, email, phone, postcode, service..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={chatLeadStatusFilter}
                        onChange={(e) => {
                          setChatLeadStatusFilter(e.target.value);
                          setChatLeadsPagination((p) => ({ ...p, page: 1 }));
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      >
                        <option value="all">all</option>
                        <option value="new">new</option>
                        <option value="contacted">contacted</option>
                        <option value="qualified">qualified</option>
                        <option value="closed">closed</option>
                        <option value="suspected">suspected spam</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchChatLeads({ page: 1 })}
                      className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-600">
                    {selectedChatLeadIds.length} selected
                  </span>
                  <button
                    type="button"
                    disabled={!selectedChatLeadIds.length || chatLeadUpdatingId === "bulk"}
                    onClick={() => bulkUpdateChatLeadsStatus("contacted")}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 disabled:opacity-50"
                  >
                    Mark Contacted
                  </button>
                  <button
                    type="button"
                    disabled={!selectedChatLeadIds.length || chatLeadUpdatingId === "bulk"}
                    onClick={() => bulkUpdateChatLeadsStatus("qualified")}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 disabled:opacity-50"
                  >
                    Mark Qualified
                  </button>
                  <button
                    type="button"
                    disabled={!selectedChatLeadIds.length || chatLeadUpdatingId === "bulk"}
                    onClick={() => bulkUpdateChatLeadsStatus("closed")}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 text-gray-800 disabled:opacity-50"
                  >
                    Mark Closed
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {chatLeadsLoading ? (
                    <div className="p-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                      <p className="text-gray-600 mt-4">Loading chat leads...</p>
                    </div>
                  ) : chatLeads.length === 0 ? (
                    <div className="p-12 text-center text-gray-600">No chat leads found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                              <input
                                type="checkbox"
                                checked={
                                  chatLeads.length > 0 &&
                                  selectedChatLeadIds.length === chatLeads.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedChatLeadIds(chatLeads.map((l) => l._id));
                                  } else {
                                    setSelectedChatLeadIds([]);
                                  }
                                }}
                              />
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Contact</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Service</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Postcode</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Risk</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {chatLeads.map((lead) => (
                            <tr key={lead._id} className="hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedChatLeadIds.includes(lead._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedChatLeadIds((prev) => [...prev, lead._id]);
                                    } else {
                                      setSelectedChatLeadIds((prev) => prev.filter((id) => id !== lead._id));
                                    }
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{lead.name || "—"}</span>
                                  <SuspectedSpamBadge item={lead} />
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {lead.email || lead.phone || "—"}
                                {lead.phone && lead.email ? (
                                  <span className="block text-xs text-gray-500">{lead.phone}</span>
                                ) : null}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{lead.serviceType || "—"}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{lead.postcode || "—"}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-GB") : "—"}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {lead.suspectedSpam ? (
                                  <div className="space-y-1">
                                    <p className="text-amber-800 text-xs" title={formatSuspicionReasons(lead.suspicionReasons).join(" · ")}>
                                      {formatSuspicionReasons(lead.suspicionReasons)[0] || "Review"}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => clearChatLeadSuspicion(lead._id)}
                                      disabled={chatLeadUpdatingId === lead._id}
                                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 disabled:opacity-50"
                                    >
                                      Mark OK
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <select
                                  value={lead.status || "new"}
                                  disabled={chatLeadUpdatingId === lead._id}
                                  onChange={(e) => updateChatLeadStatus(lead._id, e.target.value)}
                                  className="px-2 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                >
                                  <option value="new">new</option>
                                  <option value="contacted">contacted</option>
                                  <option value="qualified">qualified</option>
                                  <option value="closed">closed</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {chatLeads.length > 0 && (
                  <div className="mt-6 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Page {chatLeadsPagination.page} of{" "}
                      {Math.ceil(
                        (chatLeadsPagination.total || 0) / (chatLeadsPagination.limit || 1),
                      ) || 1}
                    </p>
                    <div className="space-x-2">
                      <button
                        type="button"
                        disabled={chatLeadsPagination.page <= 1}
                        onClick={() =>
                          setChatLeadsPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronLeft className="w-4 h-4 inline" />
                      </button>
                      <button
                        type="button"
                        disabled={
                          chatLeadsPagination.page >=
                          Math.ceil(
                            (chatLeadsPagination.total || 0) / (chatLeadsPagination.limit || 1),
                          )
                        }
                        onClick={() =>
                          setChatLeadsPagination((p) => ({ ...p, page: p.page + 1 }))
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

            {activeTab === "staff" && <StaffOperations />}
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

              {selectedQuote.suspectedSpam && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Flagged as suspected spam
                      </p>
                      <ul className="mt-2 text-sm text-amber-800 list-disc list-inside space-y-1">
                        {formatSuspicionReasons(selectedQuote.suspicionReasons).map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                      {selectedQuote.captchaScore != null && (
                        <p className="text-xs text-amber-700 mt-2">
                          CAPTCHA score: {Math.round((selectedQuote.captchaScore || 0) * 100)}%
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => clearQuoteSuspicion(selectedQuote._id)}
                      disabled={updatingStatus === "loading"}
                      className="shrink-0 px-3 py-1.5 text-sm font-semibold rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                    >
                      Mark OK
                    </button>
                  </div>
                </div>
              )}

              {selectedQuote.attribution && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Lead source</p>
                  <p className="text-gray-900 font-medium">
                    {selectedQuote.attribution.leadSource || "—"}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {selectedQuote.attribution.serviceRegion && (
                      <span>
                        Region: <strong>{selectedQuote.attribution.serviceRegion}</strong>
                      </span>
                    )}
                    {selectedQuote.attribution.utmSource && (
                      <span>
                        UTM: {selectedQuote.attribution.utmSource}
                        {selectedQuote.attribution.utmMedium
                          ? ` / ${selectedQuote.attribution.utmMedium}`
                          : ""}
                      </span>
                    )}
                    {selectedQuote.attribution.referralCode && (
                      <span>Referral: {selectedQuote.attribution.referralCode}</span>
                    )}
                    {selectedQuote.attribution.landingPage && (
                      <span className="col-span-2 truncate" title={selectedQuote.attribution.landingPage}>
                        Landing: {selectedQuote.attribution.landingPage}
                      </span>
                    )}
                  </div>
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
                  {(selectedQuote.preferredDate || selectedQuote.preferredTime) && (
                    <>
                      {selectedQuote.preferredDate && (
                        <div>
                          <p className="text-sm text-gray-600">Preferred Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(selectedQuote.preferredDate).toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                      {selectedQuote.preferredTime && (
                        <div>
                          <p className="text-sm text-gray-600">Preferred Time</p>
                          <p className="font-medium text-gray-900">
                            {selectedQuote.preferredTime}
                          </p>
                        </div>
                      )}
                    </>
                  )}
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
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Property Photos</p>
                  {(selectedQuote.images && selectedQuote.images.length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedQuote.images.map((img, i) => {
                        const imageUrl = quoteImageUrls[i];
                        const label =
                          typeof img === "object" && img.filename ? img.filename : `Property ${i + 1}`;
                        return (
                          <a
                            key={i}
                            href={imageUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-teal-500 bg-gray-100"
                            onClick={(e) => {
                              if (!imageUrl) e.preventDefault();
                            }}
                          >
                            {imageUrl ? (
                              <FallbackImage
                                src={imageUrl}
                                alt={label}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="flex items-center justify-center w-full h-full text-xs text-gray-400 px-1 text-center">
                                Loading…
                              </span>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No photos uploaded</p>
                  )}
                </div>
                {selectedQuote.additionalNotes && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Additional Notes</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">
                      {selectedQuote.additionalNotes}
                    </p>
                  </div>
                )}
              </div>

              <QuoteResponsePanel quote={selectedQuote} adminNotes={adminNote} onAdminNotesChange={setAdminNote} onQuoteChange={setSelectedQuote} submitState={updatingStatus} onSubmit={() => updateQuote(selectedQuote._id, selectedQuote.status, adminNote, selectedQuote.approvedAmount, selectedQuote.customerMessage)} onRetry={retryQuoteDelivery} />
              <button type="button" onClick={() => setShowDetails(false)} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
