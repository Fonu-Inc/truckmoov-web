import {
  act, fireEvent, render, screen,
} from "@testing-library/react";
import {
  beforeEach, describe, expect, it, vi,
} from "vitest";

import { DispatchPreferencesPanel } from "./DispatchPreferencesPanel";

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
    getDispatchPreferencesQueryOptions: () => ({ queryKey: ["dispatchPreferences"] }),
    useUpdateDispatchPreferences: () => ({
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

const dispatcherPreferences = {
  timezone: "Africa/Lagos",
  shiftStart: "09:00",
  shiftEnd: "17:00",
  workDays: [
    1,
    2,
    3,
    4,
    5,
  ],
};

function successfulQuery() {
  return {
    data: {
      status: true,
      message: "Preferences retrieved",
      data: {
        userId: "user-1", dispatcherPreferences,
      },
    },
    error: null,
    isError: false,
    isPending: false,
  };
}

describe(
  "dispatchPreferencesPanel",
  () => {
    beforeEach(() => {
      useQueryMock.mockReturnValue(successfulQuery());
      mutateMock.mockReset();
      mutationState.isPending = false;
      successToastMock.mockReset();
      errorToastMock.mockReset();
      vi.useFakeTimers();
    });

    it(
      "renders shift, timezone, and working days from the server",
      () => {
        render(<DispatchPreferencesPanel />);

        expect((screen.getByLabelText("Start") as HTMLInputElement).value).toBe("09:00");
        expect((screen.getByLabelText("End") as HTMLInputElement).value).toBe("17:00");
        expect(screen.getByRole(
          "button",
          { name: "Monday" },
        )).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        expect(screen.getByRole(
          "button",
          { name: "Sunday" },
        )).toHaveAttribute(
          "aria-pressed",
          "false",
        );
        expect(screen.getByRole(
          "img",
          { name: "Shift from 09:00 to 17:00" },
        )).toBeInTheDocument();
      },
    );

    it(
      "patches workDays when a day chip is toggled",
      () => {
        mutateMock.mockImplementation((_payload, callbacks) => callbacks.onSuccess());
        render(<DispatchPreferencesPanel />);

        fireEvent.click(screen.getByRole(
          "button",
          { name: "Saturday" },
        ));

        expect(mutateMock).toHaveBeenCalledWith(
          {
            data: {
              workDays: [
                1,
                2,
                3,
                4,
                5,
                6,
              ],
            },
          },
          expect.objectContaining({
            onSuccess: expect.any(Function), onError: expect.any(Function),
          }),
        );
        expect(successToastMock).toHaveBeenCalledWith("Dispatch preferences updated");
      },
    );

    it(
      "debounces time edits and rolls back on failure",
      () => {
        mutateMock.mockImplementation((_payload, callbacks) => callbacks.onError({ message: "Update failed" }));
        render(<DispatchPreferencesPanel />);
        const start = screen.getByLabelText("Start") as HTMLInputElement;

        fireEvent.change(
          start,
          { target: { value: "10:00" } },
        );
        expect(mutateMock).not.toHaveBeenCalled();

        act(() => {
          vi.advanceTimersByTime(400);
        });

        expect(mutateMock).toHaveBeenCalledWith(
          { data: { shiftStart: "10:00" } },
          expect.anything(),
        );
        expect((screen.getByLabelText("Start") as HTMLInputElement).value).toBe("09:00");
        expect(errorToastMock).toHaveBeenCalledWith("Update failed");
      },
    );

    it(
      "labels overnight shifts and renders loading / error states",
      () => {
        useQueryMock.mockReturnValue({
          data: {
            status: true,
            message: "ok",
            data: {
              userId: "user-1",
              dispatcherPreferences: {
                ...dispatcherPreferences, shiftStart: "22:00", shiftEnd: "06:00",
              },
            },
          },
          error: null,
          isError: false,
          isPending: false,
        });
        const { rerender } = render(<DispatchPreferencesPanel />);
        expect(screen.getByRole(
          "img",
          { name: "Overnight shift, 22:00 to 06:00" },
        )).toBeInTheDocument();

        useQueryMock.mockReturnValue({
          data: undefined, error: null, isError: false, isPending: true,
        });
        rerender(<DispatchPreferencesPanel />);
        expect(screen.getByLabelText("Loading dispatch preferences")).toBeInTheDocument();

        useQueryMock.mockReturnValue({
          data: undefined,
          error: { message: "Request failed" },
          isError: true,
          isPending: false,
        });
        rerender(<DispatchPreferencesPanel />);
        expect(screen.getByText("Unable to load dispatch preferences")).toBeInTheDocument();
        expect(screen.getByText("Request failed")).toBeInTheDocument();
      },
    );
  },
);
