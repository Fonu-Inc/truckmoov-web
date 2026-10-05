import { queryClient } from "@truckmoov/api/lib/query-client";
import {
  describe, expect, it,
} from "vitest";
import { useAuthStore } from "./authStore";

describe(
  "admin logout",
  () => {
    it(
      "drops cached server answers so the next user is not judged by the last one's grants",
      () => {
        queryClient.setQueryData(
          [
            "platform-messaging",
            "capabilities",
          ],
          {
            portal: "admin", permissions: ["admin.staff.read"],
          },
        );
        useAuthStore.getState().logout();
        expect(queryClient.getQueryData([
          "platform-messaging",
          "capabilities",
        ])).toBeUndefined();
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
      },
    );
  },
);
