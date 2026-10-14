import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import QuoteResponsePanel from "./QuoteResponsePanel";
import AdminDashboard from "../AdminDashboard";
import { get, patch, post } from "../../utils/apiClient";
vi.mock("../../utils/apiClient", () => ({get: vi.fn(), patch: vi.fn(), post: vi.fn(), getBlob: vi.fn(), del: vi.fn()}));
afterEach(() => {cleanup(); sessionStorage.clear(); vi.clearAllMocks();});
const setup = (quote = {}, props = {}) => {
  const onSubmit = vi.fn();
  render(<QuoteResponsePanel quote={{status: "converted", ...quote}} adminNotes="Internal detail" onAdminNotesChange={vi.fn()} onQuoteChange={vi.fn()} onSubmit={onSubmit} onRetry={vi.fn()} submitState="" {...props} />);
  return onSubmit;
};
describe("QuoteResponsePanel", () => {
  it("requires a positive bounded converted amount before submitting", () => {
    const onSubmit = setup({approvedAmount: 0});
    fireEvent.click(screen.getByRole("button", {name: /save/i}));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/positive|0.01/i);
  });
  it("keeps customer messages separate from internal notes and caps their length", () => {
    setup({approvedAmount: 100, customerMessage: "Hello"});
    expect(screen.getByLabelText(/customer message/i).maxLength).toBe(1000);
    expect(screen.getByText("5 / 1,000 characters")).toBeTruthy();
    expect(screen.getByLabelText(/internal only/i).value).toBe("Internal detail");
  });
  it.each([["pending", "Queued"], ["processing", "Queued"], ["queued", "Queued"], ["completed", "Sent"]])("labels %s delivery as %s", (status, label) => {
    setup({delivery: {status, jobId: "j1"}});
    expect(screen.getByText(label)).toBeTruthy();
  });
  it("retries failed deliveries and disables both actions while saving", () => {
    const onRetry = vi.fn();
    setup({delivery: {status: "failed", jobId: "j1"}}, {onRetry, submitState: "loading"});
    expect(screen.getByRole("button", {name: /retry/i}).disabled).toBe(true);
    expect(screen.getByRole("button", {name: /saving/i}).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", {name: /retry/i}));
    expect(onRetry).not.toHaveBeenCalled();
  });
  it("submits customer text separately and retains returned delivery feedback in the dashboard", async () => {
    sessionStorage.setItem("adminSession", "yes");
    const quote = {_id: "q1", status: "converted", approvedAmount: 90, serviceType: "deep-clean", firstName: "Ada", lastName: "Lovelace", adminNotes: "Private"};
    get.mockImplementation(async url => url === "/api/admin/quotes/q1" ? {success: true, quote, delivery: {approvedResponse: {_id: "job1", status: "failed"}}} : {success: true, data: [], stats: {}});
    patch.mockImplementation(async (_url, payload) => ({success: true, quote: {...quote, ...payload}, delivery: {approvedResponse: {_id: "job1", status: "pending"}}}));
    render(<MemoryRouter initialEntries={["/admin/quotes?quoteId=q1"]}><AdminDashboard /></MemoryRouter>);
    const message = await screen.findByLabelText(/customer message/i);
    fireEvent.change(message, {target: {value: "Your approved quote"}});
    fireEvent.click(screen.getByRole("button", {name: /save changes/i}));
    await waitFor(() => expect(patch).toHaveBeenCalledWith("/api/admin/quotes/q1", {status: "converted", approvedAmount: 90, customerMessage: "Your approved quote", adminNotes: "Private"}));
    expect(await screen.findByText("Saved and queued")).toBeTruthy();
    expect(screen.getByRole("heading", {name: "Quote Details"})).toBeTruthy();
  });
  it("retries the returned approval job then reloads quote detail", async () => {
    sessionStorage.setItem("adminSession", "yes");
    const quote = {_id: "q1", status: "converted", approvedAmount: 90, serviceType: "deep-clean"};
    let retried = false;
    post.mockImplementation(async () => {retried = true; return {success: true};});
    get.mockImplementation(async url => url === "/api/admin/quotes/q1" ? {success: true, quote, delivery: {approvedResponse: {_id: "job1", status: retried ? "completed" : "failed"}}} : {success: true, data: [], stats: {}});
    render(<MemoryRouter initialEntries={["/admin/quotes?quoteId=q1"]}><AdminDashboard /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", {name: /retry delivery/i}));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/api/admin/automation/jobs/job1/retry", {}));
    expect(await screen.findByText("Sent")).toBeTruthy();
  });
});
