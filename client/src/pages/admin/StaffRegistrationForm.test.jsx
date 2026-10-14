import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import StaffRegistrationForm from "./StaffRegistrationForm";
afterEach(cleanup);
function fill() {
  fireEvent.change(screen.getByLabelText(/first name/i), {target: {value: " Ada "}});
  fireEvent.change(screen.getByLabelText(/last name/i), {target: {value: " Lovelace "}});
  fireEvent.change(screen.getByLabelText(/^phone/i), {target: {value: "020 0000 0000"}});
}
describe("StaffRegistrationForm", () => {
  it("validates required fields inline before saving", () => {
    const onSave = vi.fn(); render(<StaffRegistrationForm onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", {name: /add staff/i}));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/first name/i).getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("First name is required.")).toBeTruthy();
  });
  it("normalizes details and resets successfully", async () => {
    const onSave = vi.fn().mockResolvedValue({}); render(<StaffRegistrationForm onSave={onSave} />); fill();
    fireEvent.change(screen.getByLabelText(/^email/i), {target: {value: " ADA@EXAMPLE.COM "}});
    fireEvent.click(screen.getByRole("button", {name: /add staff/i}));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", hourlyRate: 0});
    await waitFor(() => expect(screen.getByLabelText(/first name/i).value).toBe(""));
    expect(screen.queryByText(/invite|password|login/i)).toBeNull();
  });
  it("rejects invalid email and rates", () => {
    const onSave = vi.fn(); render(<StaffRegistrationForm onSave={onSave} />); fill();
    fireEvent.change(screen.getByLabelText(/^email/i), {target: {value: "broken"}});
    fireEvent.change(screen.getByLabelText(/hourly rate/i), {target: {value: "10001"}});
    fireEvent.click(screen.getByRole("button", {name: /add staff/i}));
    expect(onSave).not.toHaveBeenCalled(); expect(screen.getByText(/valid email/i)).toBeTruthy(); expect(screen.getByText(/between 0 and 10,000/i)).toBeTruthy();
  });
  it("shows backend field errors and disables save while awaiting the server", async () => {
    let reject; const onSave = vi.fn(() => new Promise((_, fail) => { reject = fail; }));
    render(<StaffRegistrationForm onSave={onSave} />); fill(); fireEvent.click(screen.getByRole("button", {name: /add staff/i}));
    expect(screen.getByRole("button", {name: /saving/i}).disabled).toBe(true);
    reject({response: {data: {error: "Please check staff details", errors: {phone: "Phone is invalid"}}}});
    await waitFor(() => expect(screen.getByText("Phone is invalid")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toMatch(/check staff/i);
  });
});
