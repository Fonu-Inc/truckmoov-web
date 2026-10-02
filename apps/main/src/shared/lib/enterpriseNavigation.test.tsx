import {
  QueryClient, QueryClientProvider,
} from "@tanstack/react-query";
import {
  cleanup, fireEvent, render, screen,
} from "@testing-library/react";
import {
  afterEach, expect, it, vi,
} from "vitest";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import {
  getEntriesForRole, getRolesForHref,
} from "@/features/dashboard/utils/sidebarNav";
import VehicleActivityPage from "@/features/reports/components/pages/VehicleActivityPage";

const activity = vi.hoisted(() => ({
  fail: false,
  trip: {
    id: "j1", reference: "JOB-001", status: "delivered", date: "2026-09-28T08:00:00Z", vehicle: "LAG-123", driver: "Ada Driver", from: "Lagos", to: "Ibadan", amountNgn: 2500,
  },
}));
vi.mock(
  "@truckmoov/api/fleet",
  async (importOriginal) => {
    const actual = await importOriginal<typeof import("@truckmoov/api/fleet")>();
    return {
      ...actual,
      getVehicleActivityQueryOptions: (payload?: { params?: { search?: string } }) => ({
        queryKey: [
          "vehicleActivity",
          payload,
        ],
        queryFn: async () => {
          if (activity.fail)
            throw new Error("Service unavailable");
          const items = payload?.params?.search ? [] : [activity.trip];
          return {
            status: true,
            message: "success",
            data: {
              totals: {
                trips: 1, completed: 1, open: 0, locationsServed: 1, tripValueNgn: 2500,
              },
              statuses: ["delivered"],
              items,
              page: 1,
              limit: 50,
              total: items.length,
            },
          };
        },
      }),
    };
  },
);

function renderVehicleActivity() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CurrencyProvider><VehicleActivityPage /></CurrencyProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  activity.fail = false;
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
  "renders and filters vehicle activity, and retries failed reports",
  async () => {
    const view = renderVehicleActivity();
    expect(await screen.findByText("JOB-001")).toBeInTheDocument();
    expect(screen.getByText("Ada Driver")).toBeInTheDocument();
    fireEvent.change(
      screen.getByPlaceholderText("Search by reference, vehicle, driver or route..."),
      { target: { value: "missing" } },
    );
    expect(await screen.findByText(
      "No trips match your filters",
      undefined,
      { timeout: 2000 },
    )).toBeInTheDocument();
    view.unmount();

    activity.fail = true;
    renderVehicleActivity();
    expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable");
    activity.fail = false;
    fireEvent.click(screen.getByRole(
      "button",
      { name: "Try again" },
    ));
    expect(await screen.findByText("JOB-001")).toBeInTheDocument();
  },
);
