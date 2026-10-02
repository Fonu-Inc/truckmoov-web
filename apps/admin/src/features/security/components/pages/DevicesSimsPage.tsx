import { useStillReportingDevices, useUnrecognisedDevices } from "@truckmoov/api/auth";
import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { findSetupProblems, useDevicesSimsData } from "../devices-sims/devicesSimsData";
import { SetupProblemsSection } from "../devices-sims/SetupProblemsSection";
import { StillReportingSection } from "../devices-sims/StillReportingSection";
import { UnrecognisedDevicesSection } from "../devices-sims/UnrecognisedDevicesSection";
import { SimHistorySection } from "../devices-sims/SimHistorySection";
import {
  SuspendedDevicesSection,
  SuspendedSimsSection,
} from "../devices-sims/SuspendedSection";

const ACTING_ROLES = [
  "SUPER_ADMIN",
  "SYSTEM_ADMIN",
];

export default function DevicesSimsPage() {
  const role = useAuthStore(s => s.user?.role);
  const canAct = !!role && ACTING_ROLES.includes(role);
  const data = useDevicesSimsData();
  const stillReporting = useStillReportingDevices();
  const unrecognised = useUnrecognisedDevices();
  const {
    devicesQuery, simsQuery, historyQuery, names, devices, sims, history,
  } = data;

  const suspendedDevices = useMemo(
    () => devices.filter(d => d.lifecycleStatus === "suspended"),
    [devices],
  );
  const suspendedSims = useMemo(
    () => sims.filter(s => s.status === "suspended"),
    [sims],
  );
  const problems = useMemo(
    () => findSetupProblems(
      devices,
      sims,
      names,
    ),
    [
      devices,
      sims,
      names,
    ],
  );

  const refetchHistory = () => void historyQuery.refetch();
  const dataLoading = devicesQuery.isLoading || simsQuery.isLoading || data.tenantsQuery.isLoading;
  const dataError = devicesQuery.isError || simsQuery.isError;
  const retryData = () => {
    void devicesQuery.refetch();
    void simsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <SuspendedDevicesSection
        devices={suspendedDevices}
        names={names}
        history={history}
        isLoading={devicesQuery.isLoading}
        isError={devicesQuery.isError}
        onRetry={() => void devicesQuery.refetch()}
        canAct={canAct}
      />
      <StillReportingSection
        report={stillReporting.data?.data}
        isLoading={stillReporting.isLoading}
        isError={stillReporting.isError}
        onRetry={() => void stillReporting.refetch()}
      />
      <UnrecognisedDevicesSection
        report={unrecognised.data?.data}
        isLoading={unrecognised.isLoading}
        isError={unrecognised.isError}
        onRetry={() => void unrecognised.refetch()}
      />
      <SuspendedSimsSection
        sims={suspendedSims}
        names={names}
        history={history}
        isLoading={simsQuery.isLoading || data.tenantsQuery.isLoading}
        isError={simsQuery.isError}
        onRetry={() => void simsQuery.refetch()}
        canAct={canAct}
      />
      <SetupProblemsSection
        problems={problems}
        isLoading={dataLoading}
        isError={dataError}
        onRetry={retryData}
        installIssues={data.installProblems.issues}
        installOverdue={data.installProblems.overdue}
      />
      <SimHistorySection
        history={history}
        isLoading={historyQuery.isLoading}
        isError={historyQuery.isError}
        onRetry={refetchHistory}
      />
    </div>
  );
}
