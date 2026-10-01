import type { Invoice } from "@/features/billing/utils/enterpriseBillingData";
import {
  cleanup, fireEvent, render, screen,
} from "@testing-library/react";
import {
  afterEach, expect, it, vi,
} from "vitest";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { BillingInvoicesTab } from "@/features/billing/components/ui/BillingInvoicesTab";
import {
  currentPlan, invoiceOutstanding, invoiceTotal,
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
      "Reports",
      "Analytics",
      "Billing",
      "Settings",
    ]);
    expect(getRolesForHref("/analytics")).toEqual(expect.arrayContaining([
      "FLEET_ADMIN",
      "AGGREGATOR_ADMIN",
    ]));
    expect(getRolesForHref("/installation")).toEqual([
      "FLEET_ADMIN",
      "OPERATIONS_MANAGER",
    ]);
    expect(getEntriesForRole("OPERATIONS_MANAGER").map(e => e.label)).toEqual([
      "Fleet Operations",
      "Dispatch",
      "Vehicles",
      "Drivers",
      "Devices",
      "Installation",
      "IoT SIMS",
      "M2M IoT Bundles",
      "Live Map & Zones",
      "Communications",
      "Reports",
      "Analytics",
      "Profile",
    ]);
    expect(getRolesForHref("/subscription")).toEqual([
      "ENTERPRISE_ADMIN",
      "OWNER_OPERATOR",
    ]);
    expect(getEntriesForRole("OWNER_OPERATOR").map(e => e.label)).toEqual([
      "Overview",
      "Jobs",
      "My Vehicles",
      "My Drivers",
      "My Devices",
      "Live Tracking",
      "M2M IoT Bundles",
      "Communications",
      "Reports",
      "Analytics",
      "Billing",
      "Settings",
    ]);
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
  "shows an empty invoice history and keeps totals consistent",
  () => {
    render(<CurrencyProvider><BillingInvoicesTab /></CurrencyProvider>);
    expect(screen.getByText("No invoices match your filters.")).toBeInTheDocument();
    expect(currentPlan()).toBeUndefined();

    const invoice: Invoice = {
      id: "i1",
      number: "INV-1",
      billingPeriod: "Sep 2026",
      invoiceDate: "2026-09-01",
      dueDate: "2026-09-15",
      amountPaid: 0,
      status: "pending",
      taxRate: 0.1,
      paymentRefs: [],
      lines: [
        {
          id: "l1", name: "M2M STANDARD", category: "Licensing", quantity: 2, unitCharge: 50000,
        },
      ],
    };
    expect(invoiceTotal(invoice)).toBe(110000);
    expect(invoiceOutstanding({
      ...invoice, amountPaid: 200000,
    })).toBe(0);
  },
);
