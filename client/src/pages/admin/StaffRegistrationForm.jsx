import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
const defaults = {firstName: "", lastName: "", email: "", phone: "", role: "cleaner", employmentType: "part-time", hourlyRate: "", serviceAreasText: "", emergencyContactName: "", emergencyContactPhone: "", status: "active", notes: ""};
export const STAFF_ROLES = ["cleaner", "supervisor", "admin"];
export const STAFF_STATUSES = ["active", "inactive", "suspended"];
const employmentTypes = ["full-time", "part-time", "contractor"];
const fromStaff = staff => ({...defaults, ...staff, serviceAreasText: (staff?.serviceAreas || []).join(", ")});

export default function StaffRegistrationForm({onSave, initialValue = null, onCancel}) {
  const [form, setForm] = useState(() => fromStaff(initialValue));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  useEffect(() => {setForm(fromStaff(initialValue)); setErrors({}); setError(""); setSuccess("");}, [initialValue]);
  const change = (key, value) => {setForm({...form, [key]: value}); setErrors({...errors, [key]: ""}); setSuccess("");};
  const submit = async e => {
    e.preventDefault(); if (saving) return;
    const nextErrors = {};
    for (const [key, label] of [["firstName", "First name"], ["lastName", "Last name"], ["phone", "Phone"]]) if (!form[key].trim()) nextErrors[key] = `${label} is required.`;
    const email = form.email.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email address.";
    const hourlyRate = Number(form.hourlyRate || 0);
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 10000) nextErrors.hourlyRate = "Hourly rate must be between 0 and 10,000.";
    for (const [key, options] of [["role", STAFF_ROLES], ["employmentType", employmentTypes], ["status", STAFF_STATUSES]]) if (!options.includes(form[key])) nextErrors[key] = "Select a valid option.";
    setErrors(nextErrors); setError(""); if (Object.keys(nextErrors).length) return;
    const payload = {firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim(), email, role: form.role, employmentType: form.employmentType, hourlyRate, status: form.status, serviceAreas: form.serviceAreasText.split(",").map(area => area.trim()).filter(Boolean), emergencyContactName: form.emergencyContactName.trim(), emergencyContactPhone: form.emergencyContactPhone.trim(), notes: form.notes.trim()};
    setSaving(true);
    try {await onSave(payload); setForm({...defaults}); setSuccess("Staff saved.");}
    catch (err) {
      const data = err.response?.data || err;
      const fieldErrors = Array.isArray(data.errors) ? Object.fromEntries(data.errors.map(item => [item.path || item.field, item.msg || item.message])) : data.errors || {};
      setErrors(fieldErrors); setError(data.error || err.message || "Could not save staff. Please try again.");
    } finally {setSaving(false);}
  };
  const field = (key, label, options, extra = {}) => <div className={key === "notes" || key === "serviceAreasText" ? "md:col-span-2" : ""} key={key}>
    <label htmlFor={`staff-${key}`} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {options ? <select id={`staff-${key}`} value={form[key]} onChange={e => change(key, e.target.value)} disabled={saving} aria-describedby={errors[key] ? `staff-${key}-error` : undefined} aria-invalid={Boolean(errors[key])} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{options.map(value => <option key={value} value={value}>{value.replaceAll("-", " ")}</option>)}</select> : key === "notes" ? <textarea id={`staff-${key}`} value={form[key]} disabled={saving} onChange={e => change(key, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="2" /> : <input id={`staff-${key}`} value={form[key]} disabled={saving} onChange={e => change(key, e.target.value)} aria-describedby={errors[key] ? `staff-${key}-error` : undefined} aria-invalid={Boolean(errors[key])} className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-teal-500" {...extra} />}
    {errors[key] && <p id={`staff-${key}-error`} className="mt-1 text-sm text-red-700">{errors[key]}</p>}
  </div>;
  return <section className="bg-white rounded-lg shadow p-6">
    <p className="text-sm font-semibold text-gray-500 uppercase">Staff Registration</p><h2 className="text-xl font-bold text-gray-900 mb-4">{initialValue ? "Edit Staff" : "Add Staff"}</h2>
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {field("firstName", "First name", null, {required: true})}{field("lastName", "Last name", null, {required: true})}
        {field("email", "Email", null, {type: "email"})}{field("phone", "Phone", null, {required: true, type: "tel"})}
        {field("role", "Role", STAFF_ROLES)}{field("employmentType", "Employment type", employmentTypes)}
        {field("hourlyRate", "Hourly rate (£)", null, {type: "number", min: 0, max: 10000, step: "0.01"})}{field("status", "Status", STAFF_STATUSES)}
        {field("serviceAreasText", "Service areas (comma separated)")}{field("emergencyContactName", "Emergency contact name")}{field("emergencyContactPhone", "Emergency contact phone", null, {type: "tel"})}{field("notes", "Internal notes")}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}{success && <p role="status" aria-live="polite" className="text-sm text-green-800">{success}</p>}
      <div className="flex flex-col sm:flex-row gap-2">
        <button type="submit" disabled={saving} className="flex-1 inline-flex justify-center items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50">{initialValue ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{saving ? "Saving..." : initialValue ? "Save Staff" : "Add Staff"}</button>
        <button type="button" disabled={saving} onClick={() => {setForm({...defaults}); setErrors({}); setError(""); onCancel?.();}} className="px-4 py-2 border border-gray-300 rounded-lg">{initialValue ? "Cancel" : "Clear"}</button>
      </div>
    </form>
  </section>;
}
