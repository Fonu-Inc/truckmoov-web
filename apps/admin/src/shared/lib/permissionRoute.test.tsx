import type React from "react";
import {
  QueryClient, QueryClientProvider,
} from "@tanstack/react-query";
import {
  render, screen,
} from "@testing-library/react";
import {
  MemoryRouter, Route, Routes,
} from "react-router";
import {
  beforeEach, describe, expect, it, vi,
} from "vitest";
import {
  guardedByPermission, permissionGuardedPage,
} from "./permissionRoute";

const capabilities = vi.hoisted(() => vi.fn());

vi.mock(
  "@truckmoov/api/notification",
  () => ({
    getMessagingCapabilities: capabilities,
    getMessagingCannedReplies: vi.fn(),
    getMessagingConversation: vi.fn(),
    getMessagingConversations: vi.fn(),
    getMessagingMessages: vi.fn(),
  }),
);

function Page() {
  return <p>secret page</p>;
}

function renderAt(Component: React.ComponentType, client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/x"]}>
        <Routes>
          <Route
            path="/x"
            element={<Component />}
          />
          <Route
            path="/not-authorized"
            element={<p>not authorized</p>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe(
  "permission-guarded admin routes",
  () => {
    beforeEach(() => {
      capabilities.mockReset();
    });

    it(
      "redirects and never fetches the page chunk without the grant",
      async () => {
        capabilities.mockResolvedValue({
          portal: "admin", permissions: ["admin.tenants.read"],
        });
        const importer = vi.fn(async () => ({ default: Page }));
        renderAt(permissionGuardedPage(
          "/settings/team",
          importer,
        ));

        expect(await screen.findByText("not authorized")).toBeInTheDocument();
        expect(importer).not.toHaveBeenCalled();
      },
    );

    it(
      "fails closed when capabilities cannot be fetched",
      async () => {
        capabilities.mockRejectedValue(new Error("network"));
        const importer = vi.fn(async () => ({ default: Page }));
        renderAt(permissionGuardedPage(
          "/security",
          importer,
        ));

        expect(await screen.findByText("not authorized")).toBeInTheDocument();
        expect(importer).not.toHaveBeenCalled();
      },
    );

    it(
      "loads the page only once the grant is confirmed",
      async () => {
        capabilities.mockResolvedValue({
          portal: "admin", permissions: ["admin.staff.read"],
        });
        const importer = vi.fn(async () => ({ default: Page }));
        renderAt(permissionGuardedPage(
          "/settings/team",
          importer,
        ));

        expect(await screen.findByText("secret page")).toBeInTheDocument();
        expect(importer).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "does not cache a denial in the route: a later session with the grant gets in",
      async () => {
        // React Router runs `lazy` once per route; resolve it once, then reuse.
        const importer = vi.fn(async () => ({ default: Page }));
        const { Component } = await guardedByPermission(
          "/settings/team",
          importer,
        )();

        capabilities.mockResolvedValue({
          portal: "admin", permissions: [],
        });
        const first = renderAt(Component);
        expect(await screen.findByText("not authorized")).toBeInTheDocument();
        first.unmount();

        // New sign-in on the same tab: logout clears the query cache.
        capabilities.mockResolvedValue({
          portal: "admin", permissions: ["admin.staff.read"],
        });
        renderAt(Component);
        expect(await screen.findByText("secret page")).toBeInTheDocument();
      },
    );

    it(
      "leaves explicitly ungated paths (own 2FA) open",
      async () => {
        capabilities.mockResolvedValue({
          portal: "admin", permissions: [],
        });
        const importer = vi.fn(async () => ({ default: Page }));
        renderAt(permissionGuardedPage(
          "/settings/security",
          importer,
        ));

        expect(await screen.findByText("secret page")).toBeInTheDocument();
      },
    );
  },
);
