import { useQuery } from "@tanstack/react-query";
import { getInstallationStatusQueryOptions } from "@truckmoov/api/auth";
import { Navigate } from "react-router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import EnterpriseLogisticsDashboard from "@/features/dashboard/components/pages/EnterpriseLogisticsDashboard";
import {
  GET_STARTED_PATH, GET_STARTED_ROLES, isInstallationPending,
} from "@/features/get-started/utils/installationProgress";

/** `/` for customers still being onboarded is Get Started; once the fleet is live it is the Overview. */
export default function HomeGate() {
  const role = useAuthStore(s => s.user?.role);
  const onboardingRole = Boolean(role && GET_STARTED_ROLES.includes(role));
  const status = useQuery({
    ...getInstallationStatusQueryOptions(),
    enabled: onboardingRole,
  });

  if (onboardingRole && status.isLoading)
    return null;
  if (onboardingRole && isInstallationPending(status.data?.data)) {
    return (
      <Navigate
        to={GET_STARTED_PATH}
        replace
      />
    );
  }
  return <EnterpriseLogisticsDashboard />;
}
