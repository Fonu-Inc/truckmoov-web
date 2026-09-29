import {
  cleanup, fireEvent, render, screen,
} from "@testing-library/react";
import {
  afterEach, expect, it, vi,
} from "vitest";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { BillingInvoicesTab } from "@/features/billing/components/ui/BillingInvoicesTab";
import {
  currentPlan, invoiceOutstanding, invoices, invoiceTotal,
} from "@/features/billing/utils/enterpriseBillingData";
import {
  getEntriesForRole, getRolesForHref,
} from "@/features/dashboard/utils/sidebarNav";
import VehicleActivityPage from "@/features/reports/components/pages/VehicleActivityPage";
import { buildTrend } from "@/features/reports/utils/reportsUtils";

const reportData = vi.hoisted(() => ({
  vehicles: [
    {
      id: "v1", registrationNumber: "LAG-123",
    },
  ],
  drivers: [
    {
      id: "d1", name: "Ada Driver",
    },
  ],
  jobs: [
    {
      id: "j1", reference: "JOB-001", vehicleId: "v1", driverId: "d1", status: "completed", createdAt: "2026-09-28T08:00:00", updatedAt: "2026-09-28T10:00:00", amountNgn: 2500, pickupAddress: "Lagos", deliveryAddress: "Ibadan", attachments: [],
    },
  ],
  isPending: false,
  error: null as null | { message: string },
  refetch: vi.fn(),
}));
vi.mock(
  "@/features/reports/hooks/useReportsData",
  () => ({ useReportsData: () => reportData }),
);
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  reportData.error = null;
});

it(
  "matches the enterprise sidebar and preserves fleet and aggregator access",
  () => {
    expect(getEntriesForRole("ENTERPRISE_ADMIN").map(e => e.label)).toEqual([
      "Overview",
      "Jobs",
      "My Vehicles",
      "My Drivers",
      "My Devices",
      "Live Tracking",
      "M2M IoT Bundles",
      "Communications",
      "Payouts & Invoicing",
      "Reports",
      "Analytics",
      "Billing",
      "Settings",
    ]);
    expect(getRolesForHref("/analytics")).toEqual(expect.arrayContaining([
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
    ]));
    expect(getRolesForHref("/installation")).toEqual(["FLEET_ADMIN"]);
    expect(getRolesForHref("/subscription")).toEqual(["ENTERPRISE_ADMIN"]);
  },
);

it(
  "counts created and completed jobs in separate hourly buckets",
  () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-28T12:00:00"));
    const trend = buildTrend(
      reportData.jobs,
      "today",
    );
    expect(trend[0]).toEqual({
      label: "8:00", created: 1, completed: 0,
    });
    expect(trend[1]).toEqual({
      label: "10:00", created: 0, completed: 1,
    });
    expect(buildTrend(
      reportData.jobs,
      "yesterday",
    ).every(row => row.created === 0 && row.completed === 0)).toBe(true);
    expect(buildTrend(
      reportData.jobs,
      "last_week",
    )).toHaveLength(7);
    expect(buildTrend(
      reportData.jobs,
      "last_month",
    )).toHaveLength(4);
    expect(buildTrend(
      reportData.jobs,
      "last_year",
    )).toHaveLength(12);
  },
);

it(
  "renders and filters vehicle activity, and retries failed reports",
  () => {
    const view = render(<CurrencyProvider><VehicleActivityPage /></CurrencyProvider>);
    expect(screen.getByText("JOB-001")).toBeInTheDocument();
    expect(screen.getByText("Ada Driver")).toBeInTheDocument();
    fireEvent.change(
      screen.getByPlaceholderText("Search by reference, vehicle, driver or route..."),
      { target: { value: "missing" } },
    );
    expect(screen.getByText("No trips match your filters")).toBeInTheDocument();
    reportData.error = { message: "Service unavailable" };
    view.rerender(<CurrencyProvider><VehicleActivityPage /></CurrencyProvider>);
    expect(screen.getByRole("alert")).toHaveTextContent("Service unavailable");
    fireEvent.click(screen.getByRole(
      "button",
      { name: "Try again" },
    ));
    expect(reportData.refetch).toHaveBeenCalledOnce();
  },
);

it(
  "opens billing invoice details and keeps totals consistent",
  () => {
    render(<CurrencyProvider><BillingInvoicesTab /></CurrencyProvider>);
    fireEvent.click(screen.getAllByRole(
      "button",
      { name: "View" },
    )[0]);
    expect(screen.getByRole("dialog")).toHaveTextContent(invoices[0].number);
    expect(invoiceTotal(invoices[0])).toBe(1540000);
    expect(invoiceOutstanding({
      ...invoices[0], amountPaid: 2000000,
    })).toBe(0);
    expect(currentPlan()?.renewalDate).toBe("2027-09-02");
  },
);
