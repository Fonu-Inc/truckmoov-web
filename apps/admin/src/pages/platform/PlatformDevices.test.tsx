import {
  fireEvent, render, screen,
} from "@testing-library/react";
import {
  describe, expect, it, vi,
} from "vitest";
import PlatformDevices from "./PlatformDevices";

vi.mock(
  "@/components/devices/PlatformDeviceManagement",
  () => ({ PlatformDeviceManagement: ({ inventory }: { inventory?: boolean }) => <div>{inventory ? "Available stock list" : "Tenant devices list"}</div> }),
);
vi.mock(
  "@/components/devices/DeviceCatalogManager",
  () => ({ DeviceCatalogManager: () => <div>Model catalog list</div> }),
);
vi.mock(
  "@/components/devices/DeviceSetupRequestsQueue",
  () => ({ DeviceSetupRequestsQueue: () => <div>Device requests list</div> }),
);

describe(
  "platform devices",
  () => {
    it(
      "opens on physical inventory and keeps models and tenant devices in separate tabs",
      async () => {
        render(<PlatformDevices />);
        expect(screen.getByText("Available stock list")).toBeTruthy();
        expect(screen.queryByText("Model catalog list")).toBeNull();

        fireEvent.mouseDown(
          screen.getByRole(
            "tab",
            { name: "Supported Models" },
          ),
          {
            button: 0, ctrlKey: false,
          },
        );
        expect(await screen.findByText("Model catalog list")).toBeTruthy();
        expect(screen.queryByText("Available stock list")).toBeNull();

        fireEvent.mouseDown(
          screen.getByRole(
            "tab",
            { name: "Assigned Devices" },
          ),
          {
            button: 0, ctrlKey: false,
          },
        );
        expect(await screen.findByText("Tenant devices list")).toBeTruthy();
      },
    );
  },
);
