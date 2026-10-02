import { useAuthStore as useApiAuthStore } from "@truckmoov/api/lib/auth-store";

export function useCurrentUserId(): string | null {
  return useApiAuthStore(state => state.user?.id ?? null);
}
