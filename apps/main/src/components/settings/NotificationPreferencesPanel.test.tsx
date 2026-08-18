import {
  fireEvent, render, screen,
} from "@testing-library/react";
import {
  beforeEach, describe, expect, it, vi,
} from "vitest";

import { NotificationPreferencesPanel } from "./NotificationPreferencesPanel";

const {
  useQueryMock, mutateMock, mutationState, successToastMock, errorToastMock,
} = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  mutateMock: vi.fn(),
  mutationState: { isPending: false },
  successToastMock: vi.fn(),
  errorToastMock: vi.fn(),
}));

vi.mock(
  "@tanstack/react-query",
  () => ({ useQuery: (...args: unknown[]) => useQueryMock(...args) }),
);

vi.mock(
  "@truckmoov/api/auth",
  () => ({
    getNotificationPreferencesQueryOptions: () => ({ queryKey: ["notificationPreferences"] }),
    useUpdateNotificationPreferences: () => ({
      mutate: mutateMock, isPending: mutationState.isPending,
    }),
  }),
);

vi.mock(
  "sonner",
  () => ({
    toast: {
      success: successToastMock, error: errorToastMock,
    },
  }),
);

const notificationPreferences = {
  emailAlerts: false,
  smsAlerts: true,
  pushAlerts: false,
  incidentAlerts: true,
  jobUpdates: false,
  marketingAnnouncements: false,
};

function successfulQuery() {
  return {
    data: {
      status: true,
      message: "Preferences retrieved",
      data: {
        userId: "user-1", notificationPreferences,
      },
    },
    error: null,
    isError: false,
    isPending: false,
  };
}

describe(
  "notificationPreferencesPanel",
  () => {
    beforeEach(() => {
      useQueryMock.mockReturnValue(successfulQuery());
      mutateMock.mockReset();
      mutationState.isPending = false;
      successToastMock.mockReset();
      errorToastMock.mockReset();
    });

    it(
      "maps server values to the supported UI switches",
      () => {
        render(<NotificationPreferencesPanel />);

        expect(screen.getByRole(
          "switch",
          { name: "Driver Alerts" },
        )).toBeChecked();
        expect(screen.getByRole(
          "switch",
          { name: "SMS Alerts" },
        )).toBeChecked();
        expect(screen.getByRole(
          "switch",
          { name: "Push Notifications" },
        )).not.toBeChecked();
      },
    );

    it.each([
      [
        "Driver Alerts",
        "incidentAlerts",
        false,
      ],
      [
        "SMS Alerts",
        "smsAlerts",
        false,
      ],
      [
        "Push Notifications",
        "pushAlerts",
        true,
      ],
    ])(
      "pATCHes %s using %s",
      (label, apiKey, nextValue) => {
        render(<NotificationPreferencesPanel />);

        fireEvent.click(screen.getByRole(
          "switch",
          { name: label },
        ));

        expect(mutateMock).toHaveBeenCalledWith(
          { data: { [apiKey]: nextValue } },
          expect.objectContaining({
            onSuccess: expect.any(Function), onError: expect.any(Function),
          }),
        );
      },
    );

    it(
      "disables preferences that the endpoint cannot represent",
      () => {
        render(<NotificationPreferencesPanel />);

        for (const label of [
          "Job Assignments",
          "Job Completions",
          "Maintenance Reminders",
          "Fuel Alerts",
          "Geofence Alerts",
          "Email Digest",
        ]) {
          expect(screen.getByRole(
            "switch",
            { name: label },
          )).toBeDisabled();
        }
        expect(screen.getAllByText("Backend support required")).toHaveLength(6);
        expect(mutateMock).not.toHaveBeenCalled();
      },
    );

    it(
      "rolls an optimistic change back when PATCH fails",
      () => {
        mutateMock.mockImplementation((_payload, callbacks) => callbacks.onError({ message: "Update failed" }));
        render(<NotificationPreferencesPanel />);
        const driverAlerts = screen.getByRole(
          "switch",
          { name: "Driver Alerts" },
        );

        fireEvent.click(driverAlerts);

        expect(driverAlerts).toBeChecked();
        expect(errorToastMock).toHaveBeenCalledWith("Update failed");
      },
    );

    it(
      "shows success feedback and disables supported switches while saving",
      () => {
        mutateMock.mockImplementation((_payload, callbacks) => callbacks.onSuccess());
        const { unmount } = render(<NotificationPreferencesPanel />);
        fireEvent.click(screen.getByRole(
          "switch",
          { name: "Push Notifications" },
        ));
        expect(successToastMock).toHaveBeenCalledWith("Notification preference updated");
        unmount();

        mutationState.isPending = true;
        render(<NotificationPreferencesPanel />);
        expect(screen.getByRole(
          "switch",
          { name: "Driver Alerts" },
        )).toBeDisabled();
        expect(screen.getByRole(
          "switch",
          { name: "SMS Alerts" },
        )).toBeDisabled();
        expect(screen.getByRole(
          "switch",
          { name: "Push Notifications" },
        )).toBeDisabled();
      },
    );

    it(
      "renders loading and request-error states",
      () => {
        useQueryMock.mockReturnValue({
          data: undefined, error: null, isError: false, isPending: true,
        });
        const { rerender } = render(<NotificationPreferencesPanel />);
        expect(screen.getByLabelText("Loading notification preferences")).toBeInTheDocument();

        useQueryMock.mockReturnValue({
          data: undefined,
          error: { message: "Request failed" },
          isError: true,
          isPending: false,
        });
        rerender(<NotificationPreferencesPanel />);
        expect(screen.getByText("Unable to load notification preferences")).toBeInTheDocument();
        expect(screen.getByText("Request failed")).toBeInTheDocument();
      },
    );
  },
);
