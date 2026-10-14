import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import StaffOperations, { monthStart, today } from "./StaffOperations";
import { get, patch, post } from "../../utils/apiClient";
vi.mock("../../utils/apiClient", () => ({get: vi.fn(), post: vi.fn(), patch: vi.fn(), getBlob: vi.fn()}));
afterEach(cleanup);
it("uses local calendar dates for payroll defaults", () => {
  const originalTimezone = process.env.TZ;
  process.env.TZ = "Europe/London";
  try {
    expect(monthStart(new Date(2026, 6, 15, 12))).toBe("2026-07-01");
    expect(today(new Date(2026, 6, 1, 0, 30))).toBe("2026-07-01");
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});

beforeEach(() => {
  vi.clearAllMocks(); patch.mockResolvedValue({success: true}); post.mockResolvedValue({success: true});
  get.mockImplementation(async url => url.includes("/options?") ? {success: true, data: [{_id: "off-page", firstName: "Grace", lastName: "Hopper", role: "cleaner", hourlyRate: 18, status: "active"}]} : url.includes("/payroll?") ? {success: true, summaries: [], totals: {}} : url.includes("/shifts?") ? {success: true, data: []} : {success: true, data: [{_id: "s1", firstName: "Ada", lastName: "Lovelace", role: "cleaner", status: "active"}], pagination: {page: new URLSearchParams(url.split("?")[1]).get("page") * 1, total: 45, pages: 3, limit: 20}});
});
it("bounds register requests, resets filtered pages and patches only status", async () => {
  render(<StaffOperations />);
  await waitFor(() => expect(screen.getAllByText("Ada Lovelace").length).toBeGreaterThan(0));
  expect(get.mock.calls.some(([url]) => /staff\?/.test(url) && url.includes("page=1") && url.includes("limit=20") && url.includes("role=all"))).toBe(true);
  fireEvent.click(screen.getByRole("button", {name: /next/i}));
  await waitFor(() => expect(get.mock.calls.some(([url]) => /staff\?/.test(url) && url.includes("page=2"))).toBe(true));
  fireEvent.change(screen.getByLabelText(/filter role/i), {target: {value: "supervisor"}});
  await waitFor(() => expect(get.mock.calls.some(([url]) => /staff\?/.test(url) && url.includes("page=1") && url.includes("role=supervisor"))).toBe(true));
  fireEvent.click(screen.getAllByRole("button", {name: /deactivate/i})[0]);
  await waitFor(() => expect(patch).toHaveBeenCalledWith("/api/admin/staff/s1", {status: "inactive"}));
});
it("assigns staff independently of the current register page", async () => {
  render(<StaffOperations />);
  await waitFor(() => expect(screen.getByRole("option", {name: /Grace Hopper/i})).toBeTruthy());
  fireEvent.change(screen.getByLabelText("Assign staff"), {target: {value: "off-page"}});
  expect(screen.getByLabelText("Shift hourly rate").value).toBe("18");
  fireEvent.click(screen.getByRole("button", {name: /^create shift/i}));
  await waitFor(() => expect(post.mock.calls[0]).toEqual(["/api/admin/staff/shifts", expect.objectContaining({staffId: "off-page", hourlyRateSnapshot: 18})]));
});
it("does not offer payroll-approved states when creating a shift", () => {
  render(<StaffOperations />);
  expect(screen.queryByRole("option", {name: "Approved"})).toBeNull();
  expect(screen.queryByRole("option", {name: "Paid"})).toBeNull();
});
it("surfaces rejected shift transitions without reporting them saved", async () => {
  get.mockImplementation(async url => url.includes("/shifts?") ? {success: true, data: [{_id: "shift1", status: "approved", date: "2026-10-14", startTime: "09:00", endTime: "17:00", staffId: {firstName: "Ada", lastName: "Lovelace"}}]} : url.includes("/payroll?") ? {success: true, summaries: [], totals: {}} : {success: true, staff: [], pagination: {total: 0, page: 1, limit: 20, pages: 1}});
  patch.mockResolvedValue({success: false, error: "Payment transition rejected"});
  render(<StaffOperations />);
  fireEvent.click(await screen.findByRole("button", {name: /mark paid/i}));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Payment transition rejected");
  expect(screen.queryByText("Shift saved.")).toBeNull();
});
