import {
  fireEvent, render, screen,
} from "@testing-library/react";
import {
  beforeEach, describe, expect, it, vi,
} from "vitest";
import DriverManagement from "./DriverManagement";

Element.prototype.scrollIntoView = vi.fn();

const mocks = vi.hoisted(() => ({
  query: {
    data: {
      data: [
        {
          id: "driver-1",
          firstName: "Ada",
          lastName: "Okafor",
          name: "Ada Okafor",
          phone: "+2348011111111",
          email: "ada@example.com",
          licenseNumber: "LIC-ADA",
          licenseExpiryDate: "2030-01-01",
          tenantId: "tenant-1",
          status: { value: "available" },
          communicationPreference: { value: "whatsapp" },
          assignedVehicleId: null,
          contactChannels: {
            whatsappNumber: null,
            smsNumber: null,
            voiceNumber: null,
          },
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
        {
          id: "driver-2",
          firstName: "Bola",
          lastName: "Musa",
          name: "Bola Musa",
          phone: "+2348022222222",
          email: null,
          licenseNumber: "LIC-BOLA",
          licenseExpiryDate: null,
          tenantId: "tenant-1",
          status: { value: "offline" },
          communicationPreference: { value: "sms" },
          assignedVehicleId: "vehicle-1",
          contactChannels: {
            whatsappNumber: null,
            smsNumber: null,
            voiceNumber: null,
          },
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ],
    },
    error: null as Error | null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  },
  mutation: {
    isPending: false,
    mutateAsync: vi.fn().mockResolvedValue({}),
  },
  startCall: vi.fn().mockResolvedValue(undefined),
}));

const initialDrivers = mocks.query.data.data;

vi.mock(
  "@truckmoov/api/fleet",
  () => ({
    useDrivers: () => mocks.query,
    useCreateDriver: () => mocks.mutation,
    useUpdateDriver: () => mocks.mutation,
    useDeleteDriver: () => mocks.mutation,
    useImportDrivers: () => mocks.mutation,
  }),
);
vi.mock(
  "@truckmoov/api/lib/auth-store",
  () => ({ useAuthStore: () => ({ user: { tenantId: "tenant-1" } }) }),
);
vi.mock(
  "@truckmoov/api/notification",
  () => ({ useSendNotifyMessage: () => mocks.mutation }),
);
vi.mock(
  "@/contexts/FonuCallContext",
  () => ({
    useFonuCall: () => ({
      startCall: mocks.startCall,
      endCall: vi.fn(),
      status: "idle",
      durationSeconds: 0,
    }),
  }),
);
vi.mock(
  "@/components/communications/CallInteractionModal",
  () => ({ CallInteractionModal: () => null }),
);
vi.mock(
  "@/components/drivers/DriverBehaviorTab",
  () => ({ DriverBehaviorTab: () => <div>Behavior content</div> }),
);
vi.mock(
  "@/components/drivers/DriverFatigueTab",
  () => ({ DriverFatigueTab: () => <div>Fatigue content</div> }),
);
vi.mock(
  "@/components/drivers/DriverMessagesInbox",
  () => ({ DriverMessagesInbox: () => <div>Inbox content</div> }),
);
vi.mock(
  "@/components/drivers/DriverFormDialog",
  () => ({ DriverFormDialog: () => null }),
);
vi.mock(
  "@/components/drivers/DriverBulkUploadDialog",
  () => ({ DriverBulkUploadDialog: () => null }),
);

describe(
  "driverManagement",
  () => {
    beforeEach(() => {
      mocks.query.data = { data: initialDrivers };
      mocks.query.error = null;
      mocks.query.isError = false;
      mocks.query.isLoading = false;
      mocks.query.refetch.mockClear();
    });

    it(
      "renders API drivers and filters by search",
      () => {
        render(<DriverManagement />);

        expect(screen.getByText("Ada Okafor")).toBeInTheDocument();
        expect(screen.getByText("Bola Musa")).toBeInTheDocument();

        fireEvent.change(
          screen.getByRole(
            "textbox",
            { name: "Search drivers" },
          ),
          { target: { value: "LIC-BOLA" } },
        );

        expect(screen.queryByText("Ada Okafor")).not.toBeInTheDocument();
        expect(screen.getByText("Bola Musa")).toBeInTheDocument();
      },
    );

    it(
      "shows the filtered empty state",
      () => {
        render(<DriverManagement />);
        fireEvent.change(
          screen.getByRole(
            "textbox",
            { name: "Search drivers" },
          ),
          { target: { value: "not-a-driver" } },
        );
        expect(screen.getByText("No drivers match your filters.")).toBeInTheDocument();
      },
    );

    it(
      "filters by status and preferred channel",
      async () => {
        render(<DriverManagement />);

        fireEvent.click(screen.getByRole(
          "combobox",
          { name: "Filter by status" },
        ));
        fireEvent.click(await screen.findByRole(
          "option",
          { name: "offline" },
        ));
        expect(screen.queryByText("Ada Okafor")).not.toBeInTheDocument();
        expect(screen.getByText("Bola Musa")).toBeInTheDocument();

        fireEvent.click(screen.getByRole(
          "combobox",
          { name: "Filter by preferred channel" },
        ));
        fireEvent.click(await screen.findByRole(
          "option",
          { name: "whatsapp" },
        ));
        expect(screen.getByText("No drivers match your filters.")).toBeInTheDocument();
      },
    );

    it(
      "shows loading and empty roster states",
      () => {
        mocks.query.isLoading = true;
        const {
          container, rerender,
        } = render(<DriverManagement />);
        expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);

        mocks.query.isLoading = false;
        mocks.query.data = { data: [] };
        rerender(<DriverManagement />);
        expect(screen.getByText("No drivers have been added yet.")).toBeInTheDocument();
      },
    );

    it(
      "wires driver communication actions",
      async () => {
        const open = vi.spyOn(
          window,
          "open",
        ).mockImplementation(() => null);
        render(<DriverManagement />);

        fireEvent.click(screen.getAllByTitle("WhatsApp")[0]);
        expect(open).toHaveBeenCalledWith(
          "https://wa.me/2348011111111?text=Hello%20Ada%20Okafor%2C%20this%20is%20Fleet%20Management.",
          "_blank",
          "noopener,noreferrer",
        );

        fireEvent.click(screen.getAllByTitle("Call")[0]);
        expect(mocks.startCall).toHaveBeenCalledWith(
          "Ada Okafor",
          "+2348011111111",
          [
            "X-Driver-ID: driver-1",
            "X-Driver-Name: Ada Okafor",
          ],
        );

        fireEvent.click(screen.getAllByTitle("SMS")[0]);
        expect(screen.getByRole(
          "dialog",
          { name: /Send SMS to Ada Okafor/ },
        )).toBeInTheDocument();
      },
    );

    it(
      "shows an API error and retries",
      () => {
        mocks.query.data = { data: [] };
        mocks.query.error = new Error("Driver service unavailable");
        mocks.query.isError = true;
        render(<DriverManagement />);

        expect(screen.getByText("Driver service unavailable")).toBeInTheDocument();
        fireEvent.click(screen.getByRole(
          "button",
          { name: "Try again" },
        ));
        expect(mocks.query.refetch).toHaveBeenCalledOnce();
      },
    );
  },
);
