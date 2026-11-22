import { useQuery } from "@tanstack/react-query";
import { getInstallationStatusQueryOptions } from "@truckmoov/api/auth";
import { useAuthStore } from "@/features/auth/stores/authStore";
import {
  GET_STARTED_ROLES, isInstallationPending,
} from "@/features/get-started/utils/installationProgress";

/** True while purchases and device/SIM additions wait for the installation to finish. */
export function useInstallationPending(): boolean {
  const role = useAuthStore(s => s.user?.role);
  const { data } = useQuery({
    ...getInstallationStatusQueryOptions(),
    enabled: Boolean(role && GET_STARTED_ROLES.includes(role)),
    staleTime: 60 * 1000,
  });
  return isInstallationPending(data?.data);
}
