import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { get, post, patch, getBlob, del } from "../utils/apiClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
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
	  CalendarDays,
	  PoundSterling,
	  Plus,
	  Save,
	} from "lucide-react";

const RETENTION_MONTHS = 6;
const CHART_COLORS = ["#0d9488", "#f59e0b", "#8b5cf6", "#06b6d4", "#10b981"];

const STAFF_FORM_DEFAULT = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "cleaner",
  employmentType: "part-time",
  hourlyRate: "",
  serviceAreasText: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  status: "active",
  notes: "",
};

const SHIFT_FORM_DEFAULT = {
  staffId: "",
  date: new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  endTime: "17:00",
  breakMinutes: 0,
  hourlyRateSnapshot: "",
  location: "",
  status: "scheduled",
  notes: "",
};

const monthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
};

const today = () => new Date().toISOString().slice(0, 10);

const formatCurrency = (amount = 0) => `£${Number(amount || 0).toFixed(2)}`;

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const staffName = (staff) =>
  staff ? `${staff.firstName || ""} ${staff.lastName || ""}`.trim() : "Unassigned";

const getTabFromPath = (pathname = "") => {
  if (pathname.startsWith("/admin/quotes")) return "quotes";
  if (pathname.startsWith("/admin/customers")) return "customers";
  if (pathname.startsWith("/admin/staff")) return "staff";
  return "dashboard";
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("adminToken") || "",
  );
  const [showTokenInput, setShowTokenInput] = useState(!adminToken);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [quoteImageUrls, setQuoteImageUrls] = useState({});

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

	  // Staff operations
	  const [staffList, setStaffList] = useState([]);
	  const [staffLoading, setStaffLoading] = useState(false);
	  const [staffError, setStaffError] = useState("");
	  const [staffSearch, setStaffSearch] = useState("");
	  const [staffStatusFilter, setStaffStatusFilter] = useState("active");
	  const [staffForm, setStaffForm] = useState(STAFF_FORM_DEFAULT);
	  const [editingStaffId, setEditingStaffId] = useState(null);
	  const [staffSaving, setStaffSaving] = useState(false);
	  const [shifts, setShifts] = useState([]);
	  const [shiftForm, setShiftForm] = useState(SHIFT_FORM_DEFAULT);
	  const [shiftSaving, setShiftSaving] = useState(false);
	  const [payroll, setPayroll] = useState({ summaries: [], totals: {} });
	  const [payrollLoading, setPayrollLoading] = useState(false);
	  const [staffDateRange, setStaffDateRange] = useState({
	    from: monthStart(),
	    to: today(),
	  });

  useEffect(() => {
    if (!showDetails || !selectedQuote?._id || !selectedQuote.images?.length || !adminToken) {
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
  }, [showDetails, selectedQuote?._id, selectedQuote?.images?.length, adminToken]);

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

  // Fetch analytics for dashboard tab
  const fetchAnalytics = async () => {
    if (!adminToken) return;
    setAnalyticsLoading(true);
    try {
      const data = await get("/api/admin/analytics");
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
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
      const msg = err.response?.data?.error || err.message;
      setError(msg || "Failed to delete quote");
    } finally {
      setDeletingQuoteId(null);
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

	  const staffPayloadFromForm = (form) => ({
	    firstName: form.firstName.trim(),
	    lastName: form.lastName.trim(),
	    email: form.email.trim(),
	    phone: form.phone.trim(),
	    role: form.role,
	    employmentType: form.employmentType,
	    hourlyRate: Number(form.hourlyRate || 0),
	    serviceAreas: form.serviceAreasText
	      .split(",")
	      .map((area) => area.trim())
	      .filter(Boolean),
	    emergencyContactName: form.emergencyContactName.trim(),
	    emergencyContactPhone: form.emergencyContactPhone.trim(),
	    status: form.status,
	    notes: form.notes.trim(),
	  });

	  const fetchStaff = async () => {
	    if (!adminToken) return;
	    setStaffLoading(true);
	    setStaffError("");
	    try {
	      const params = new URLSearchParams({
	        search: staffSearch,
	        status: staffStatusFilter,
	      });
	      const data = await get(`/api/admin/staff?${params}`);
	      if (data.success) {
	        setStaffList(data.data || []);
	      } else {
	        setStaffError(data.error || "Failed to load staff");
	      }
	    } catch (err) {
	      setStaffError(err.response?.data?.error || err.message);
	    } finally {
	      setStaffLoading(false);
	    }
	  };

	  const fetchShifts = async () => {
	    if (!adminToken) return;
	    try {
	      const params = new URLSearchParams({
	        from: staffDateRange.from,
	        to: staffDateRange.to,
	      });
	      const data = await get(`/api/admin/staff/shifts?${params}`);
	      if (data.success) setShifts(data.data || []);
	    } catch (err) {
	      setStaffError(err.response?.data?.error || err.message);
	    }
	  };

	  const fetchPayroll = async () => {
	    if (!adminToken) return;
	    setPayrollLoading(true);
	    try {
	      const params = new URLSearchParams({
	        from: staffDateRange.from,
	        to: staffDateRange.to,
	      });
	      const data = await get(`/api/admin/staff/payroll?${params}`);
	      if (data.success) {
	        setPayroll({
	          summaries: data.summaries || [],
	          totals: data.totals || {},
	        });
	      }
	    } catch (err) {
	      setStaffError(err.response?.data?.error || err.message);
	    } finally {
	      setPayrollLoading(false);
	    }
	  };

	  const refreshStaffOperations = async () => {
	    await Promise.all([fetchStaff(), fetchShifts(), fetchPayroll()]);
	  };

	  const resetStaffForm = () => {
	    setEditingStaffId(null);
	    setStaffForm(STAFF_FORM_DEFAULT);
	  };

	  const handleSaveStaff = async (e) => {
	    e.preventDefault();
	    setStaffSaving(true);
	    setStaffError("");
	    try {
	      const payload = staffPayloadFromForm(staffForm);
	      if (editingStaffId) {
	        await patch(`/api/admin/staff/${editingStaffId}`, payload);
	      } else {
	        await post("/api/admin/staff", payload);
	      }
	      resetStaffForm();
	      await fetchStaff();
	    } catch (err) {
	      setStaffError(err.response?.data?.error || err.message);
	    } finally {
	      setStaffSaving(false);
	    }
	  };

	  const startEditStaff = (staff) => {
	    setEditingStaffId(staff._id);
	    setStaffForm({
	      firstName: staff.firstName || "",
	      lastName: staff.lastName || "",
	      email: staff.email || "",
	      phone: staff.phone || "",
	      role: staff.role || "cleaner",
	      employmentType: staff.employmentType || "part-time",
	      hourlyRate: staff.hourlyRate ?? "",
	      serviceAreasText: (staff.serviceAreas || []).join(", "),
	      emergencyContactName: staff.emergencyContactName || "",
	      emergencyContactPhone: staff.emergencyContactPhone || "",
	      status: staff.status || "active",
	      notes: staff.notes || "",
	    });
	  };

	  const handleStaffStatus = async (staff, status) => {
	    setStaffError("");
	    try {
	      await patch(`/api/admin/staff/${staff._id}`, { ...staffPayloadFromForm({
	        firstName: staff.firstName || "",
	        lastName: staff.lastName || "",
	        email: staff.email || "",
	        phone: staff.phone || "",
	        role: staff.role || "cleaner",
	        employmentType: staff.employmentType || "part-time",
	        hourlyRate: staff.hourlyRate || 0,
	        serviceAreasText: (staff.serviceAreas || []).join(", "),
	        emergencyContactName: staff.emergencyContactName || "",
	        emergencyContactPhone: staff.emergencyContactPhone || "",
	        status,
	        notes: staff.notes || "",
	      }), status });
	      await fetchStaff();
	    } catch (err) {
	      setStaffError(err.response?.data?.error || err.message);
	    }
	  };

	  const handleShiftStaffChange = (staffId) => {
	    const selected = staffList.find((staff) => staff._id === staffId);
	    setShiftForm({
	      ...shiftForm,
	      staffId,
	      hourlyRateSnapshot: selected?.hourlyRate ?? "",
	    });
	  };

	  const handleSaveShift = async (e) => {
	    e.preventDefault();
	    setShiftSaving(true);
	    setStaffError("");
	    try {
	      await post("/api/admin/staff/shifts", {
	        ...shiftForm,
	        breakMinutes: Number(shiftForm.breakMinutes || 0),
	        hourlyRateSnapshot: Number(shiftForm.hourlyRateSnapshot || 0),
	      });
	      setShiftForm({
	        ...SHIFT_FORM_DEFAULT,
	        staffId: shiftForm.staffId,
	        hourlyRateSnapshot: shiftForm.hourlyRateSnapshot,
	      });
	      await Promise.all([fetchShifts(), fetchPayroll()]);
	    } catch (err) {
	      setStaffError(err.response?.data?.error || err.message);
	    } finally {
	      setShiftSaving(false);
	    }
	  };

	  const updateShiftStatus = async (shift, status) => {
	    setStaffError("");
	    try {
	      await patch(`/api/admin/staff/shifts/${shift._id}`, {
	        status,
	        date: new Date(shift.date).toISOString().slice(0, 10),
	        startTime: shift.startTime,
	        endTime: shift.endTime,
	        breakMinutes: shift.breakMinutes || 0,
	        hourlyRateSnapshot: shift.hourlyRateSnapshot || 0,
	        location: shift.location || "",
	        notes: shift.notes || "",
	      });
	      await Promise.all([fetchShifts(), fetchPayroll()]);
	    } catch (err) {
	      setStaffError(err.response?.data?.error || err.message);
	    }
	  };

	  const exportStaffPayroll = async () => {
	    try {
	      const params = new URLSearchParams({
	        from: staffDateRange.from,
	        to: staffDateRange.to,
	      });
	      const blob = await getBlob(`/api/admin/export/staff-payroll-csv?${params}`);
	      const url = window.URL.createObjectURL(blob);
	      const a = document.createElement("a");
	      a.href = url;
	      a.download = `staff_payroll_${staffDateRange.from}_to_${staffDateRange.to}.csv`;
	      document.body.appendChild(a);
	      a.click();
	      window.URL.revokeObjectURL(url);
	      document.body.removeChild(a);
	    } catch (err) {
	      setStaffError(err.response?.data?.error || err.message);
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

  // Keep active tab in sync with URL path.
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  // Load customers when switching to the Customers tab
  useEffect(() => {
    if (adminToken && !showTokenInput && activeTab === "customers") {
      fetchCustomers();
    }
  }, [activeTab, adminToken, showTokenInput]);

	  // Load analytics when switching to the Dashboard tab
	  useEffect(() => {
	    if (adminToken && !showTokenInput && activeTab === "dashboard") {
	      fetchAnalytics();
	    }
	  }, [activeTab, adminToken, showTokenInput]);

	  // Load staff operations when switching to Staff
	  useEffect(() => {
	    if (adminToken && !showTokenInput && activeTab === "staff") {
	      refreshStaffOperations();
	    }
	  }, [activeTab, adminToken, showTokenInput, staffStatusFilter, staffDateRange.from, staffDateRange.to]);

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

  const handleAdminLogin = async () => {
    if (!adminToken.trim()) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await post("/api/admin/login", { token: adminToken.trim() });
      if (res.success && res.token) {
        localStorage.setItem("adminToken", res.token);
        sessionStorage.setItem("adminToken", res.token);
        setAdminToken(res.token);
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
            Enter your admin token to receive a short-lived session. You may need to sign in again after about an hour.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAdminLogin()
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Token
              </label>
              <input
                type="password"
                value={adminToken}
                onChange={(e) => {
                  setAdminToken(e.target.value)
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
              disabled={loginLoading || !adminToken.trim()}
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
                  onClick={() => {
                    localStorage.removeItem("adminToken");
                    sessionStorage.removeItem("adminToken");
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
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white rounded-xl shadow p-6">
                        <h3 className="font-semibold text-gray-900 mb-1">Revenue Overview</h3>
                        <p className="text-sm text-gray-500 mb-4">Monthly income (last 12 months)</p>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.revenueByMonth || []}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `£${v}`} />
                              <Tooltip formatter={(v) => [`£` + Number(v).toFixed(2), "Income"]} />
                              <Line type="monotone" dataKey="income" stroke="#0d9488" strokeWidth={2} name="Income" dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow p-6">
                        <h3 className="font-semibold text-gray-900 mb-1">Service Distribution</h3>
                        <p className="text-sm text-gray-500 mb-4">Bookings by service type</p>
                        <div className="h-64 flex items-center justify-center">
                          {(analytics.serviceDistribution?.length && analytics.serviceDistribution.some((s) => s.count > 0)) ? (
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
                                  {(analytics.serviceDistribution || []).map((_, i) => (
                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(v) => [v, "Count"]} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <p className="text-gray-500 text-sm">No data yet</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recent bookings table */}
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                      <div className="flex justify-between items-center px-6 py-4 border-b">
                        <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
                        <button
                          type="button"
                          onClick={() => navigate("/admin/quotes")}
                          className="text-sm font-medium text-teal-600 hover:text-teal-700"
                        >
                          View All →
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        {(!analytics.recentBookings || analytics.recentBookings.length === 0) ? (
                          <div className="p-8 text-center text-gray-500 text-sm">No recent payments</div>
                        ) : (
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {analytics.recentBookings.map((b) => (
                                <tr key={b.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-3 text-sm">
                                    <span className="font-medium text-gray-900">{b.customer}</span>
                                    <span className="block text-gray-500 text-xs">{b.email}</span>
                                  </td>
                                  <td className="px-6 py-3 text-sm text-gray-600 capitalize">{b.service}</td>
                                  <td className="px-6 py-3 text-sm text-gray-600">
                                    {b.date ? new Date(b.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                                  </td>
                                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{b.amountDisplay}</td>
                                  <td className="px-6 py-3">
                                    <span
                                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                        b.status === "succeeded" ? "bg-green-100 text-green-800" : b.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {b.status === "succeeded" ? "Paid" : b.status === "pending" ? "Pending" : b.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">Unable to load analytics</div>
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
                                <div className="inline-flex items-center gap-3">
                                  <button
                                    onClick={async () => {
                                      setSelectedQuote(quote);
                                      setAdminNote(quote.adminNotes || "");
                                      setShowDetails(true);
                                      try {
                                        const data = await get(`/api/admin/quotes/${quote._id}`);
                                        if (data.success && data.quote) {
                                          setSelectedQuote(data.quote);
                                          setAdminNote(data.quote.adminNotes || "");
                                        }
                                      } catch (err) {
                                        console.error("Failed to load quote details:", err);
                                      }
                                    }}
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

	            {activeTab === "staff" && (
	              <>
	                <div className="mb-8">
	                  <h1 className="text-3xl font-bold text-gray-900">Staff Operations</h1>
	                  <p className="text-gray-600 mt-1">
	                    Register staff, schedule shifts, approve worked hours, and prepare payroll.
	                  </p>
	                </div>
	                {staffError && (
	                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
	                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
	                    <p className="text-sm text-red-700">{staffError}</p>
	                  </div>
	                )}

	                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
	                  <div className="bg-white rounded-lg shadow p-6">
	                    <div className="flex items-center justify-between mb-4">
	                      <div>
	                        <p className="text-sm font-semibold text-gray-500 uppercase">
	                          Staff Registration
	                        </p>
	                        <h2 className="text-xl font-bold text-gray-900">
	                          {editingStaffId ? "Edit Staff" : "Add Staff"}
	                        </h2>
	                      </div>
	                      <Users className="w-6 h-6 text-teal-600" />
	                    </div>
	                    <form onSubmit={handleSaveStaff} className="space-y-3">
	                      <div className="grid grid-cols-2 gap-3">
	                        <input
	                          value={staffForm.firstName}
	                          onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })}
	                          placeholder="First name"
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                          required
	                        />
	                        <input
	                          value={staffForm.lastName}
	                          onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })}
	                          placeholder="Last name"
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                          required
	                        />
	                      </div>
	                      <div className="grid grid-cols-2 gap-3">
	                        <input
	                          type="email"
	                          value={staffForm.email}
	                          onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
	                          placeholder="Email"
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                        />
	                        <input
	                          value={staffForm.phone}
	                          onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
	                          placeholder="Phone"
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                          required
	                        />
	                      </div>
	                      <div className="grid grid-cols-3 gap-3">
	                        <select
	                          value={staffForm.role}
	                          onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                        >
	                          <option value="cleaner">Cleaner</option>
	                          <option value="supervisor">Supervisor</option>
	                          <option value="admin">Admin</option>
	                        </select>
	                        <select
	                          value={staffForm.employmentType}
	                          onChange={(e) => setStaffForm({ ...staffForm, employmentType: e.target.value })}
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                        >
	                          <option value="full-time">Full-time</option>
	                          <option value="part-time">Part-time</option>
	                          <option value="contractor">Contractor</option>
	                        </select>
	                        <input
	                          type="number"
	                          min="0"
	                          step="0.01"
	                          value={staffForm.hourlyRate}
	                          onChange={(e) => setStaffForm({ ...staffForm, hourlyRate: e.target.value })}
	                          placeholder="£/hr"
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                        />
	                      </div>
	                      <input
	                        value={staffForm.serviceAreasText}
	                        onChange={(e) => setStaffForm({ ...staffForm, serviceAreasText: e.target.value })}
	                        placeholder="Service areas, comma separated"
	                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                      />
	                      <div className="grid grid-cols-2 gap-3">
	                        <input
	                          value={staffForm.emergencyContactName}
	                          onChange={(e) => setStaffForm({ ...staffForm, emergencyContactName: e.target.value })}
	                          placeholder="Emergency contact"
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                        />
	                        <input
	                          value={staffForm.emergencyContactPhone}
	                          onChange={(e) => setStaffForm({ ...staffForm, emergencyContactPhone: e.target.value })}
	                          placeholder="Emergency phone"
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                        />
	                      </div>
	                      <div className="grid grid-cols-2 gap-3">
	                        <select
	                          value={staffForm.status}
	                          onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                        >
	                          <option value="active">Active</option>
	                          <option value="inactive">Inactive</option>
	                          <option value="suspended">Suspended</option>
	                        </select>
	                        <button
	                          type="button"
	                          onClick={resetStaffForm}
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
	                        >
	                          Clear
	                        </button>
	                      </div>
	                      <textarea
	                        value={staffForm.notes}
	                        onChange={(e) => setStaffForm({ ...staffForm, notes: e.target.value })}
	                        placeholder="Internal notes"
	                        rows="2"
	                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                      />
	                      <button
	                        type="submit"
	                        disabled={staffSaving}
	                        className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold"
	                      >
	                        {editingStaffId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
	                        {staffSaving ? "Saving..." : editingStaffId ? "Save Staff" : "Add Staff"}
	                      </button>
	                    </form>
	                  </div>

	                  <div className="bg-white rounded-lg shadow p-6">
	                    <div className="flex items-center justify-between mb-4">
	                      <div>
	                        <p className="text-sm font-semibold text-gray-500 uppercase">
	                          Shift Scheduling
	                        </p>
	                        <h2 className="text-xl font-bold text-gray-900">Create Shift</h2>
	                      </div>
	                      <CalendarDays className="w-6 h-6 text-teal-600" />
	                    </div>
	                    <form onSubmit={handleSaveShift} className="space-y-3">
	                      <select
	                        value={shiftForm.staffId}
	                        onChange={(e) => handleShiftStaffChange(e.target.value)}
	                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                        required
	                      >
	                        <option value="">Select active staff</option>
	                        {staffList
	                          .filter((staff) => staff.status === "active")
	                          .map((staff) => (
	                            <option key={staff._id} value={staff._id}>
	                              {staffName(staff)} · {formatCurrency(staff.hourlyRate)}/hr
	                            </option>
	                          ))}
	                      </select>
	                      <div className="grid grid-cols-3 gap-3">
	                        <input
	                          type="date"
	                          value={shiftForm.date}
	                          onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                          required
	                        />
	                        <input
	                          type="time"
	                          value={shiftForm.startTime}
	                          onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                          required
	                        />
	                        <input
	                          type="time"
	                          value={shiftForm.endTime}
	                          onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                          required
	                        />
	                      </div>
	                      <div className="grid grid-cols-3 gap-3">
	                        <input
	                          type="number"
	                          min="0"
	                          value={shiftForm.breakMinutes}
	                          onChange={(e) => setShiftForm({ ...shiftForm, breakMinutes: e.target.value })}
	                          placeholder="Break mins"
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                        />
	                        <input
	                          type="number"
	                          min="0"
	                          step="0.01"
	                          value={shiftForm.hourlyRateSnapshot}
	                          onChange={(e) => setShiftForm({ ...shiftForm, hourlyRateSnapshot: e.target.value })}
	                          placeholder="Rate"
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                        />
	                        <select
	                          value={shiftForm.status}
	                          onChange={(e) => setShiftForm({ ...shiftForm, status: e.target.value })}
	                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                        >
	                          <option value="scheduled">Scheduled</option>
	                          <option value="completed">Completed</option>
	                          <option value="approved">Approved</option>
	                          <option value="paid">Paid</option>
	                        </select>
	                      </div>
	                      <input
	                        value={shiftForm.location}
	                        onChange={(e) => setShiftForm({ ...shiftForm, location: e.target.value })}
	                        placeholder="Location or job address"
	                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                      />
	                      <textarea
	                        value={shiftForm.notes}
	                        onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
	                        placeholder="Shift notes"
	                        rows="2"
	                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                      />
	                      <button
	                        type="submit"
	                        disabled={shiftSaving}
	                        className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold"
	                      >
	                        <Plus className="w-4 h-4" />
	                        {shiftSaving ? "Creating..." : "Create Shift"}
	                      </button>
	                    </form>
	                  </div>

	                  <div className="bg-white rounded-lg shadow p-6">
	                    <div className="flex items-center justify-between mb-4">
	                      <div>
	                        <p className="text-sm font-semibold text-gray-500 uppercase">
	                          Payroll Window
	                        </p>
	                        <h2 className="text-xl font-bold text-gray-900">Summary</h2>
	                      </div>
	                      <PoundSterling className="w-6 h-6 text-teal-600" />
	                    </div>
	                    <div className="grid grid-cols-2 gap-3 mb-4">
	                      <input
	                        type="date"
	                        value={staffDateRange.from}
	                        onChange={(e) => setStaffDateRange({ ...staffDateRange, from: e.target.value })}
	                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                      />
	                      <input
	                        type="date"
	                        value={staffDateRange.to}
	                        onChange={(e) => setStaffDateRange({ ...staffDateRange, to: e.target.value })}
	                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                      />
	                    </div>
	                    <div className="grid grid-cols-2 gap-3">
	                      <div className="bg-gray-50 rounded-lg p-4">
	                        <p className="text-xs text-gray-500">Approved Pay</p>
	                        <p className="text-2xl font-bold text-gray-900">
	                          {formatCurrency(payroll.totals?.approvedPay)}
	                        </p>
	                      </div>
	                      <div className="bg-amber-50 rounded-lg p-4">
	                        <p className="text-xs text-amber-700">Pending Payment</p>
	                        <p className="text-2xl font-bold text-amber-900">
	                          {formatCurrency(payroll.totals?.pendingPay)}
	                        </p>
	                      </div>
	                      <div className="bg-gray-50 rounded-lg p-4">
	                        <p className="text-xs text-gray-500">Approved Hours</p>
	                        <p className="text-2xl font-bold text-gray-900">
	                          {Number(payroll.totals?.approvedHours || 0).toFixed(2)}
	                        </p>
	                      </div>
	                      <div className="bg-gray-50 rounded-lg p-4">
	                        <p className="text-xs text-gray-500">Paid</p>
	                        <p className="text-2xl font-bold text-gray-900">
	                          {formatCurrency(payroll.totals?.paidPay)}
	                        </p>
	                      </div>
	                    </div>
	                    <button
	                      type="button"
	                      onClick={exportStaffPayroll}
	                      className="mt-4 w-full inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50"
	                    >
	                      <Download className="w-4 h-4" />
	                      Export Payroll CSV
	                    </button>
	                  </div>
	                </div>

	                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
	                  <div className="bg-white rounded-lg shadow">
	                    <div className="p-6 border-b">
	                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
	                        <div>
	                          <h2 className="text-xl font-bold text-gray-900">Staff Register</h2>
	                          <p className="text-sm text-gray-600">
	                            Keep active staff ready for scheduling and payroll.
	                          </p>
	                        </div>
	                        <div className="flex gap-2">
	                          <input
	                            value={staffSearch}
	                            onChange={(e) => setStaffSearch(e.target.value)}
	                            onKeyDown={(e) => e.key === "Enter" && fetchStaff()}
	                            placeholder="Search staff"
	                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                          />
	                          <select
	                            value={staffStatusFilter}
	                            onChange={(e) => setStaffStatusFilter(e.target.value)}
	                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
	                          >
	                            <option value="active">Active</option>
	                            <option value="inactive">Inactive</option>
	                            <option value="suspended">Suspended</option>
	                            <option value="all">All</option>
	                          </select>
	                          <button
	                            type="button"
	                            onClick={fetchStaff}
	                            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold"
	                          >
	                            Search
	                          </button>
	                        </div>
	                      </div>
	                    </div>
	                    <div className="overflow-x-auto">
	                      <table className="w-full">
	                        <thead className="bg-gray-50">
	                          <tr>
	                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
	                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
	                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rate</th>
	                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
	                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
	                          </tr>
	                        </thead>
	                        <tbody className="divide-y divide-gray-100">
	                          {staffLoading ? (
	                            <tr>
	                              <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
	                                Loading staff...
	                              </td>
	                            </tr>
	                          ) : staffList.length === 0 ? (
	                            <tr>
	                              <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
	                                No staff found.
	                              </td>
	                            </tr>
	                          ) : (
	                            staffList.map((staff) => (
	                              <tr key={staff._id} className="hover:bg-gray-50">
	                                <td className="px-4 py-3">
	                                  <p className="font-semibold text-gray-900">{staffName(staff)}</p>
	                                  <p className="text-xs text-gray-500">{staff.phone} {staff.email ? `· ${staff.email}` : ""}</p>
	                                  {(staff.serviceAreas || []).length > 0 && (
	                                    <p className="text-xs text-gray-500 mt-1">{staff.serviceAreas.join(", ")}</p>
	                                  )}
	                                </td>
	                                <td className="px-4 py-3 text-sm text-gray-700 capitalize">
	                                  {staff.role?.replace("-", " ")}
	                                  <p className="text-xs text-gray-500">{staff.employmentType?.replace("-", " ")}</p>
	                                </td>
	                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
	                                  {formatCurrency(staff.hourlyRate)}/hr
	                                </td>
	                                <td className="px-4 py-3">
	                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
	                                    staff.status === "active"
	                                      ? "bg-green-100 text-green-800"
	                                      : staff.status === "suspended"
	                                        ? "bg-red-100 text-red-800"
	                                        : "bg-gray-100 text-gray-700"
	                                  }`}>
	                                    {staff.status}
	                                  </span>
	                                </td>
	                                <td className="px-4 py-3 text-right">
	                                  <div className="flex justify-end gap-2">
	                                    <button
	                                      type="button"
	                                      onClick={() => startEditStaff(staff)}
	                                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
	                                    >
	                                      Edit
	                                    </button>
	                                    {staff.status === "active" ? (
	                                      <button
	                                        type="button"
	                                        onClick={() => handleStaffStatus(staff, "inactive")}
	                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
	                                      >
	                                        Deactivate
	                                      </button>
	                                    ) : (
	                                      <button
	                                        type="button"
	                                        onClick={() => handleStaffStatus(staff, "active")}
	                                        className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm"
	                                      >
	                                        Activate
	                                      </button>
	                                    )}
	                                  </div>
	                                </td>
	                              </tr>
	                            ))
	                          )}
	                        </tbody>
	                      </table>
	                    </div>
	                  </div>

	                  <div className="bg-white rounded-lg shadow">
	                    <div className="p-6 border-b">
	                      <h2 className="text-xl font-bold text-gray-900">Shift Ledger</h2>
	                      <p className="text-sm text-gray-600">
	                        Complete shifts, approve worked hours, then mark approved shifts as paid.
	                      </p>
	                    </div>
	                    <div className="overflow-x-auto">
	                      <table className="w-full">
	                        <thead className="bg-gray-50">
	                          <tr>
	                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
	                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
	                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hours</th>
	                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pay</th>
	                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
	                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
	                          </tr>
	                        </thead>
	                        <tbody className="divide-y divide-gray-100">
	                          {shifts.length === 0 ? (
	                            <tr>
	                              <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
	                                No shifts in this payroll window.
	                              </td>
	                            </tr>
	                          ) : (
	                            shifts.map((shift) => (
	                              <tr key={shift._id} className="hover:bg-gray-50">
	                                <td className="px-4 py-3 text-sm text-gray-700">
	                                  {formatDate(shift.date)}
	                                  <p className="text-xs text-gray-500">{shift.startTime}-{shift.endTime}</p>
	                                </td>
	                                <td className="px-4 py-3 text-sm">
	                                  <p className="font-semibold text-gray-900">{staffName(shift.staffId)}</p>
	                                  <p className="text-xs text-gray-500">{shift.location || "No location"}</p>
	                                </td>
	                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
	                                  {Number(shift.hoursWorked || 0).toFixed(2)}
	                                </td>
	                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
	                                  {formatCurrency(shift.payAmount)}
	                                  <p className="text-xs text-gray-500">@ {formatCurrency(shift.hourlyRateSnapshot)}/hr</p>
	                                </td>
	                                <td className="px-4 py-3">
	                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
	                                    shift.status === "paid"
	                                      ? "bg-green-100 text-green-800"
	                                      : shift.status === "approved"
	                                        ? "bg-blue-100 text-blue-800"
	                                        : shift.status === "completed"
	                                          ? "bg-amber-100 text-amber-800"
	                                          : "bg-gray-100 text-gray-700"
	                                  }`}>
	                                    {shift.status}
	                                  </span>
	                                </td>
	                                <td className="px-4 py-3 text-right">
	                                  <div className="flex justify-end gap-2">
	                                    {shift.status === "scheduled" && (
	                                      <button
	                                        type="button"
	                                        onClick={() => updateShiftStatus(shift, "completed")}
	                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
	                                      >
	                                        Complete
	                                      </button>
	                                    )}
	                                    {shift.status === "completed" && (
	                                      <button
	                                        type="button"
	                                        onClick={() => updateShiftStatus(shift, "approved")}
	                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
	                                      >
	                                        Approve
	                                      </button>
	                                    )}
	                                    {shift.status === "approved" && (
	                                      <button
	                                        type="button"
	                                        onClick={() => updateShiftStatus(shift, "paid")}
	                                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm"
	                                      >
	                                        Mark Paid
	                                      </button>
	                                    )}
	                                  </div>
	                                </td>
	                              </tr>
	                            ))
	                          )}
	                        </tbody>
	                      </table>
	                    </div>
	                  </div>
	                </div>

	                <div className="bg-white rounded-lg shadow mt-6">
	                  <div className="p-6 border-b flex items-center justify-between">
	                    <div>
	                      <h2 className="text-xl font-bold text-gray-900">Payroll by Staff</h2>
	                      <p className="text-sm text-gray-600">
	                        Payroll uses completed, approved, and paid shifts. Pending payment is approved minus paid.
	                      </p>
	                    </div>
	                    {payrollLoading && <p className="text-sm text-gray-500">Refreshing...</p>}
	                  </div>
	                  <div className="overflow-x-auto">
	                    <table className="w-full">
	                      <thead className="bg-gray-50">
	                        <tr>
	                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
	                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Shifts</th>
	                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hours</th>
	                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Approved</th>
	                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Paid</th>
	                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pending</th>
	                        </tr>
	                      </thead>
	                      <tbody className="divide-y divide-gray-100">
	                        {(payroll.summaries || []).length === 0 ? (
	                          <tr>
	                            <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
	                              No payroll activity yet.
	                            </td>
	                          </tr>
	                        ) : (
	                          payroll.summaries.map((row) => (
	                            <tr key={row.staffId} className="hover:bg-gray-50">
	                              <td className="px-4 py-3 font-semibold text-gray-900">{row.staffName}</td>
	                              <td className="px-4 py-3 text-sm text-gray-700">{row.shiftCount}</td>
	                              <td className="px-4 py-3 text-sm text-gray-700">{Number(row.hours || 0).toFixed(2)}</td>
	                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(row.approvedPay)}</td>
	                              <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(row.paidPay)}</td>
	                              <td className="px-4 py-3 text-sm font-semibold text-amber-700">{formatCurrency(row.pendingPay)}</td>
	                            </tr>
	                          ))
	                        )}
	                      </tbody>
	                    </table>
	                  </div>
	                </div>
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
                              <img
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
