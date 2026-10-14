import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Download,
  Plus,
  PoundSterling,
} from "lucide-react";
import { get, post, patch, getBlob } from "../../utils/apiClient";
import StaffRegistrationForm from "./StaffRegistrationForm";
import StaffRegister from "./StaffRegister";
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

const formatDateInput = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const monthStart = (now = new Date()) =>
  formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));

export const today = (now = new Date()) => formatDateInput(now);

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
  staff
    ? `${staff.firstName || ""} ${staff.lastName || ""}`.trim()
    : "Unassigned";

export default function StaffOperations() {
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffSuccess, setStaffSuccess] = useState("");
  const [staffFilters, setStaffFilters] = useState({
    search: "",
    role: "all",
    status: "active",
  });
  const [staffPage, setStaffPage] = useState(1);
  const [staffPagination, setStaffPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  });
  const [search, setSearch] = useState("");
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffBusyId, setStaffBusyId] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [updatingShiftId, setUpdatingShiftId] = useState(null);
  const [shiftForm, setShiftForm] = useState({ ...SHIFT_FORM_DEFAULT });
  const [shiftSaving, setShiftSaving] = useState(false);
  const [payroll, setPayroll] = useState({ summaries: [], totals: {} });
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [staffDateRange, setStaffDateRange] = useState({
    from: monthStart(),
    to: today(),
  });
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentResults, setAssignmentResults] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const staffRequest = useRef(0);
  const assignmentRequest = useRef(0);
  const assignmentOptions =
    selectedAssignment &&
    !assignmentResults.some((staff) => staff._id === selectedAssignment._id)
      ? [selectedAssignment, ...assignmentResults]
      : assignmentResults;
  const apiError = (err) =>
    err.response?.data?.error ||
    err.message ||
    "Request failed. Please try again.";
  useEffect(() => {
    const timer = setTimeout(() => setSearch(staffFilters.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [staffFilters.search]);
  const changeStaffFilters = (updates) => {
    setStaffFilters((current) => ({ ...current, ...updates }));
    setStaffPage(1);
  };
  const fetchStaff = useCallback(async () => {
    const request = ++staffRequest.current;
    setStaffLoading(true);
    setStaffError("");
    try {
      const params = new URLSearchParams({
        page: staffPage,
        limit: 20,
        search,
        role: staffFilters.role,
        status: staffFilters.status,
      });
      const data = await get(`/api/admin/staff?${params}`);
      if (request !== staffRequest.current) return;
      if (!data.success) throw new Error(data.error || "Failed to load staff");
      setStaffList(data.staff || data.data || []);
      const pagination = data.pagination || {};
      setStaffPagination({
        total: pagination.total || 0,
        page: Number(pagination.page || staffPage),
        limit: Number(pagination.limit || 20),
        pages: Number(pagination.pages || 1),
      });
    } catch (err) {
      if (request === staffRequest.current) setStaffError(apiError(err));
    } finally {
      if (request === staffRequest.current) setStaffLoading(false);
    }
  }, [staffPage, search, staffFilters.role, staffFilters.status]);
  useEffect(() => {
    fetchStaff();
    return () => {
      staffRequest.current += 1;
    };
  }, [fetchStaff]);
  const fetchAssignmentOptions = useCallback(async () => {
    const request = ++assignmentRequest.current;
    try {
      const params = new URLSearchParams({
        search: assignmentSearch.trim(),
        limit: 20,
      });
      const data = await get(`/api/admin/staff/options?${params}`);
      if (request === assignmentRequest.current) {
        if (!data.success)
          throw new Error(data.error || "Failed to find staff");
        setAssignmentResults(data.staff || data.data || []);
      }
    } catch (err) {
      if (request === assignmentRequest.current) setStaffError(apiError(err));
    }
  }, [assignmentSearch]);
  useEffect(() => {
    const timer = setTimeout(
      fetchAssignmentOptions,
      assignmentSearch ? 300 : 0,
    );
    return () => {
      clearTimeout(timer);
      assignmentRequest.current += 1;
    };
  }, [fetchAssignmentOptions, assignmentSearch]);
  const fetchShifts = useCallback(async () => {
    setShiftsLoading(true);
    try {
      const data = await get(
        `/api/admin/staff/shifts?${new URLSearchParams(staffDateRange)}`,
      );
      if (!data.success) throw new Error(data.error || "Failed to load shifts");
      setShifts(data.data || []);
    } catch (err) {
      setStaffError(apiError(err));
    } finally {
      setShiftsLoading(false);
    }
  }, [staffDateRange]);
  const fetchPayroll = useCallback(async () => {
    setPayrollLoading(true);
    try {
      const data = await get(
        `/api/admin/staff/payroll?${new URLSearchParams(staffDateRange)}`,
      );
      if (!data.success)
        throw new Error(data.error || "Failed to load payroll");
      setPayroll({
        summaries: data.summaries || [],
        totals: data.totals || {},
      });
    } catch (err) {
      setStaffError(apiError(err));
    } finally {
      setPayrollLoading(false);
    }
  }, [staffDateRange]);
  useEffect(() => {
    fetchShifts();
    fetchPayroll();
  }, [fetchShifts, fetchPayroll]);
  const refreshStaffOperations = () =>
    Promise.all([
      fetchStaff(),
      fetchShifts(),
      fetchPayroll(),
      fetchAssignmentOptions(),
    ]);
  const handleSaveStaff = async (payload) => {
    setStaffError("");
    setStaffSuccess("");
    const result = editingStaff
      ? await patch(`/api/admin/staff/${editingStaff._id}`, payload)
      : await post("/api/admin/staff", payload);
    if (!result.success)
      throw { message: result.error || "Could not save staff", ...result };
    setEditingStaff(null);
    setStaffSuccess("Staff saved.");
    await Promise.all([fetchStaff(), fetchAssignmentOptions()]);
  };
  const handleStaffStatus = async (staff, status) => {
    setStaffBusyId(staff._id);
    setStaffError("");
    setStaffSuccess("");
    try {
      const result = await patch(`/api/admin/staff/${staff._id}`, { status });
      if (!result.success)
        throw new Error(result.error || "Could not update staff");
      if (selectedAssignment?._id === staff._id && status !== "active") {
        setSelectedAssignment(null);
        setShiftForm((current) => ({ ...current, staffId: "" }));
      }
      setStaffSuccess(
        `Staff ${status === "active" ? "activated" : "deactivated"}.`,
      );
      await Promise.all([fetchStaff(), fetchAssignmentOptions()]);
    } catch (err) {
      setStaffError(apiError(err));
    } finally {
      setStaffBusyId(null);
    }
  };
  const handleShiftStaffChange = (staffId) => {
    const staff = assignmentOptions.find((item) => item._id === staffId);
    setSelectedAssignment(staff || null);
    setShiftForm((current) => ({
      ...current,
      staffId,
      hourlyRateSnapshot: staff?.hourlyRate ?? "",
    }));
  };
  const handleSaveShift = async (e) => {
    e.preventDefault();
    if (shiftSaving) return;
    setShiftSaving(true);
    setStaffError("");
    setStaffSuccess("");
    try {
      const result = await post("/api/admin/staff/shifts", {
        ...shiftForm,
        breakMinutes: Number(shiftForm.breakMinutes || 0),
        hourlyRateSnapshot: Number(shiftForm.hourlyRateSnapshot || 0),
      });
      if (!result.success)
        throw new Error(result.error || "Could not create shift");
      setStaffSuccess("Shift created.");
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
    setStaffSuccess("");
    setUpdatingShiftId(shift._id);
    try {
      const result = await patch(`/api/admin/staff/shifts/${shift._id}`, {
        status,
        date: new Date(shift.date).toISOString().slice(0, 10),
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakMinutes: Number(shift.breakMinutes || 0),
        hourlyRateSnapshot: Number(shift.hourlyRateSnapshot || 0),
        location: shift.location || "",
        notes: shift.notes || "",
      });
      if (!result.success)
        throw new Error(result.error || "Could not update shift");
      setStaffSuccess("Shift saved.");
      await Promise.all([fetchShifts(), fetchPayroll()]);
    } catch (err) {
      setStaffError(err.response?.data?.error || err.message);
    } finally {
      setUpdatingShiftId(null);
    }
  };

  const exportStaffPayroll = async () => {
    try {
      const params = new URLSearchParams({
        from: staffDateRange.from,
        to: staffDateRange.to,
      });
      const blob = await getBlob(
        `/api/admin/export/staff-payroll-csv?${params}`,
      );
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

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Staff Operations</h1>
        <p className="text-gray-600 mt-1">
          Register staff, schedule shifts, approve worked hours, and prepare
          payroll.
        </p>
      </div>
      {staffSuccess && (
        <p
          role="status"
          aria-live="polite"
          className="mb-4 text-sm text-green-800"
        >
          {staffSuccess}
        </p>
      )}
      {staffError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p role="alert" className="text-sm text-red-700">
              {staffError}
            </p>
          </div>
          <button
            type="button"
            onClick={refreshStaffOperations}
            className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 text-sm font-semibold hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <StaffRegistrationForm
          initialValue={editingStaff}
          onSave={handleSaveStaff}
          onCancel={() => setEditingStaff(null)}
        />
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
            <label className="block text-sm font-medium text-gray-700">
              Find staff for assignment
              <input
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
              />
            </label>
            <select
              aria-label="Assign staff"
              value={shiftForm.staffId}
              onChange={(e) => handleShiftStaffChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
              required
            >
              <option value="">Select active staff</option>
              {assignmentOptions
                .filter((staff) => staff.status === "active")
                .map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staffName(staff)} · {formatCurrency(staff.hourlyRate)}/hr
                  </option>
                ))}
            </select>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="date"
                aria-label="Shift date"
                value={shiftForm.date}
                onChange={(e) =>
                  setShiftForm({ ...shiftForm, date: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                required
              />
              <input
                type="time"
                aria-label="Shift start time"
                value={shiftForm.startTime}
                onChange={(e) =>
                  setShiftForm({ ...shiftForm, startTime: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                required
              />
              <input
                type="time"
                aria-label="Shift end time"
                value={shiftForm.endTime}
                onChange={(e) =>
                  setShiftForm({ ...shiftForm, endTime: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="number"
                min="0"
                aria-label="Break minutes"
                value={shiftForm.breakMinutes}
                onChange={(e) =>
                  setShiftForm({ ...shiftForm, breakMinutes: e.target.value })
                }
                placeholder="Break mins"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                aria-label="Shift hourly rate"
                value={shiftForm.hourlyRateSnapshot}
                onChange={(e) =>
                  setShiftForm({
                    ...shiftForm,
                    hourlyRateSnapshot: e.target.value,
                  })
                }
                placeholder="Rate"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
              />
              <select
                aria-label="Shift status"
                value={shiftForm.status}
                onChange={(e) =>
                  setShiftForm({ ...shiftForm, status: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <input
              aria-label="Shift location"
              value={shiftForm.location}
              onChange={(e) =>
                setShiftForm({ ...shiftForm, location: e.target.value })
              }
              placeholder="Location or job address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
            />
            <textarea
              aria-label="Shift notes"
              value={shiftForm.notes}
              onChange={(e) =>
                setShiftForm({ ...shiftForm, notes: e.target.value })
              }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input
              type="date"
              aria-label="Payroll from"
              value={staffDateRange.from}
              onChange={(e) =>
                setStaffDateRange({ ...staffDateRange, from: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
            />
            <input
              type="date"
              aria-label="Payroll to"
              value={staffDateRange.to}
              onChange={(e) =>
                setStaffDateRange({ ...staffDateRange, to: e.target.value })
              }
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
        <StaffRegister
          staff={staffList}
          filters={staffFilters}
          pagination={staffPagination}
          loading={staffLoading}
          busyId={staffBusyId}
          onFiltersChange={changeStaffFilters}
          onPageChange={(page) => setStaffPage(page)}
          onEdit={setEditingStaff}
          onStatusChange={handleStaffStatus}
        />
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Shift Ledger</h2>
            {shiftsLoading && (
              <p role="status" className="text-sm text-gray-500">
                Loading shifts...
              </p>
            )}
            <p className="text-sm text-gray-600">
              Complete shifts, approve worked hours, then mark approved shifts
              as paid.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Staff
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Hours
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Pay
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shifts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No shifts in this payroll window.
                    </td>
                  </tr>
                ) : (
                  shifts.map((shift) => (
                    <tr key={shift._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(shift.date)}
                        <p className="text-xs text-gray-500">
                          {shift.startTime}-{shift.endTime}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-semibold text-gray-900">
                          {staffName(shift.staffId)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {shift.location || "No location"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {Number(shift.hoursWorked || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {formatCurrency(shift.payAmount)}
                        <p className="text-xs text-gray-500">
                          @ {formatCurrency(shift.hourlyRateSnapshot)}/hr
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            shift.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : shift.status === "approved"
                                ? "bg-blue-100 text-blue-800"
                                : shift.status === "completed"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {shift.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {shift.status === "scheduled" && (
                            <button
                              type="button"
                              disabled={updatingShiftId === shift._id}
                              onClick={() =>
                                updateShiftStatus(shift, "completed")
                              }
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                            >
                              Complete
                            </button>
                          )}
                          {shift.status === "completed" && (
                            <button
                              type="button"
                              disabled={updatingShiftId === shift._id}
                              onClick={() =>
                                updateShiftStatus(shift, "approved")
                              }
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
                            >
                              Approve
                            </button>
                          )}
                          {shift.status === "approved" && (
                            <button
                              type="button"
                              disabled={updatingShiftId === shift._id}
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
            <h2 className="text-xl font-bold text-gray-900">
              Payroll by Staff
            </h2>
            <p className="text-sm text-gray-600">
              Payroll uses completed, approved, and paid shifts. Pending payment
              is approved minus paid.
            </p>
          </div>
          {payrollLoading && (
            <p className="text-sm text-gray-500">Refreshing...</p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Staff
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Shifts
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Hours
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Approved
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Paid
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Pending
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(payroll.summaries || []).length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No payroll activity yet.
                  </td>
                </tr>
              ) : (
                payroll.summaries.map((row) => (
                  <tr key={row.staffId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {row.staffName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {row.shiftCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {Number(row.hours || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {formatCurrency(row.approvedPay)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(row.paidPay)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-amber-700">
                      {formatCurrency(row.pendingPay)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
