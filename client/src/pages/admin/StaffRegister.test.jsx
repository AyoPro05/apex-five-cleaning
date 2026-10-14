import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import StaffRegister from "./StaffRegister";
afterEach(cleanup);
const staff = [{_id: "s1", firstName: "Ada", lastName: "Lovelace", phone: "020", role: "cleaner", employmentType: "part-time", hourlyRate: 12, status: "active", serviceAreas: ["London"]}];
const defaults = {staff, filters: {search: "", role: "all", status: "active"}, pagination: {total: 45, page: 2, limit: 20, pages: 3}, onFiltersChange: vi.fn(), onPageChange: vi.fn(), onEdit: vi.fn(), onStatusChange: vi.fn()};
it("supports filter changes and server-driven pagination", () => {
  const onFiltersChange = vi.fn(), onPageChange = vi.fn(); render(<StaffRegister {...defaults} onFiltersChange={onFiltersChange} onPageChange={onPageChange} />);
  fireEvent.change(screen.getByLabelText(/search staff/i), {target: {value: "Ada"}});
  expect(onFiltersChange).toHaveBeenCalledWith({search: "Ada"});
  fireEvent.change(screen.getByLabelText(/filter role/i), {target: {value: "supervisor"}});
  expect(onFiltersChange).toHaveBeenCalledWith({role: "supervisor"});
  fireEvent.change(screen.getByLabelText(/filter status/i), {target: {value: "inactive"}});
  expect(onFiltersChange).toHaveBeenCalledWith({status: "inactive"});
  fireEvent.click(screen.getByRole("button", {name: /next/i})); expect(onPageChange).toHaveBeenCalledWith(3);
  fireEvent.click(screen.getByRole("button", {name: /previous/i})); expect(onPageChange).toHaveBeenCalledWith(1);
});
it("offers edit and activation commands in desktop and mobile rows", () => {
  const onStatusChange = vi.fn(), onEdit = vi.fn(); render(<StaffRegister {...defaults} onStatusChange={onStatusChange} onEdit={onEdit} />);
  fireEvent.click(screen.getAllByRole("button", {name: /deactivate/i})[0]); expect(onStatusChange).toHaveBeenCalledWith(staff[0], "inactive");
  fireEvent.click(screen.getAllByRole("button", {name: /^edit/i})[0]); expect(onEdit).toHaveBeenCalledWith(staff[0]);
});
it("shows an empty state and disables unavailable pages", () => {
  render(<StaffRegister {...defaults} staff={[]} pagination={{page: 1, pages: 1, total: 0, limit: 20}} />);
  expect(screen.getByText("No staff found.")).toBeTruthy(); expect(screen.getByRole("button", {name: /next/i}).disabled).toBe(true);
});
