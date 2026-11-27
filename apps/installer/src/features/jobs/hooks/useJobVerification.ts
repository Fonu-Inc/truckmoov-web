import type { InstallerJobDetail } from "@truckmoov/api/auth";
import type { InstallerDeviceVerificationItem } from "@truckmoov/api/fleet";
import {
  AUTH_QUERY_KEY,
  useStartInstallerDeviceVerification,
} from "@truckmoov/api/auth";
import {
  FLEET_QUERY_KEY,
  useInstallerDeviceVerification,
} from "@truckmoov/api/fleet";
import { queryClient } from "@truckmoov/api/lib/query-client";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

export type VerificationStatus = InstallerDeviceVerificationItem["status"];

type Unit = InstallerJobDetail["units"][number];

const POLL_MS = 5000;
const FALLBACK_REASON = "No signal arrived in time. Check power, SIM and settings, then verify again.";

/**
 * Verification state for every device on the job. While one is waiting and the job is in
 * progress the monitor is polled; the job is re-read once when the monitor and the job disagree
 * (typically waiting -> verified), because the checklist gate reads the job.
 */
export function useJobVerification(job: InstallerJobDetail) {
  const jobId = job.id;
  const active = job.status === "in_progress";
  const hasDevice = job.units.some(u => u.device);
  const waiting = job.units.some(u => u.device?.verificationStatus === "waiting");
  const monitor = useInstallerDeviceVerification({
    enabled: active && hasDevice,
    refetchInterval: active && waiting ? POLL_MS : false,
  });
  const start = useStartInstallerDeviceVerification();
  const [
    error,
    setError,
  ] = useState<string | null>(null);
  const [
    checking,
    setChecking,
  ] = useState(false);

  const monitorItems = monitor.data?.data.items;
  const item = (unit: Unit) => monitorItems?.find(i => i.deviceId === unit.device?.id);
  const jobStatus = (unit: Unit): VerificationStatus => unit.device?.verificationStatus ?? "not_started";
  const statusOf = (unit: Unit): VerificationStatus => item(unit)?.status ?? jobStatus(unit);

  const mismatch = job.units
    .filter(u => item(u) && item(u)!.status !== jobStatus(u))
    .map(u => `${u.device?.id}:${item(u)!.status}`)
    .join(",");
  const seenMismatchRef = useRef("");
  useEffect(
    () => {
      if (mismatch && mismatch !== seenMismatchRef.current)
        void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.installerJob(jobId) });
      seenMismatchRef.current = mismatch;
    },
    [
      mismatch,
      jobId,
    ],
  );

  const reasonOf = (unit: Unit) => (statusOf(unit) === "failed" ? (item(unit)?.errors[0]?.message ?? FALLBACK_REASON) : null);

  function verify() {
    setError(null);
    start.mutate(
      { jobId },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.installerDeviceVerification });
          toast.success("Verification started. The device must now report in.");
        },
        onError: (e) => {
          const message = e.message || "Verification could not be started. Try again.";
          setError(message);
          toast.error(message);
        },
      },
    );
  }

  async function checkStatus() {
    setError(null);
    setChecking(true);
    await Promise.allSettled([
      monitor.refetch(),
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.installerJob(jobId) }),
    ]);
    setChecking(false);
  }

  return {
    active,
    beforeStart: [
      "assigned",
      "scheduled",
      "overdue",
    ].includes(job.status),
    statusOf,
    reasonOf,
    verify,
    checkStatus,
    verifying: start.isPending,
    checking,
    error,
  };
}

export type JobVerification = ReturnType<typeof useJobVerification>;
