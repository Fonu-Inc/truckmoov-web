import type { SystemSimBulkStatusResult } from "@truckmoov/api/auth";
import {
  useBulkSystemSimStatus,
  useSuspendSystemSim,
} from "@truckmoov/api/auth";
import { toast } from "sonner";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";
import type { SimRow } from "./simInventoryShared";

type BulkAction = "activate" | "suspend" | "reinstate";

const ACTION_VERBS: Record<BulkAction, string> = {
  activate: "activated",
  suspend: "suspended",
  reinstate: "reinstated",
};

const NETWORK_NOTE = "Marked in our system only; the mobile network has not been told.";

function reportBulkResult(result: SystemSimBulkStatusResult) {
  const problems = result.results.filter(item => item.outcome !== "changed");
  if (result.changed > 0)
    toast.success(`${result.changed} SIM(s) ${ACTION_VERBS[result.action]}`, { description: NETWORK_NOTE });
  if (problems.length > 0) {
    toast.warning(`${problems.length} SIM(s) not changed`, {
      description: [...new Set(problems.map(item => item.reason).filter(Boolean))].join("; "),
    });
  }
}

export function useSimSuspension(onBulkDone?: () => void) {
  const suspendMutation = useSuspendSystemSim();
  const bulkMutation = useBulkSystemSimStatus();
  const {
    confirm, confirmDialog,
  } = useConfirmAction();

  const applyOne = async (sim: SimRow, suspend: boolean) => {
    try {
      await suspendMutation.mutateAsync({
        id: sim.id,
        data: { suspend },
      });
      toast.success(suspend ? "SIM suspended" : "SIM reinstated", { description: NETWORK_NOTE });
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    }
  };

  const applyMany = async (sims: SimRow[], action: BulkAction) => {
    try {
      const response = await bulkMutation.mutateAsync({
        ids: sims.map(sim => sim.id),
        action,
      });
      reportBulkResult(response.data);
      onBulkDone?.();
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    }
  };

  const suspendOne = (sim: SimRow) => confirm({
    title: "Suspend SIM?",
    description: `SIM ${sim.iccid} will be marked suspended in our system. The mobile network will not be told.`,
    confirmLabel: "Suspend",
    onConfirm: () => applyOne(sim, true),
  });

  const reinstateOne = (sim: SimRow) => applyOne(sim, false);

  const suspendMany = (sims: SimRow[]) => confirm({
    title: `Suspend ${sims.length} SIM(s)?`,
    description: "These SIMs will be marked suspended in our system. The mobile network will not be told.",
    confirmLabel: "Suspend",
    onConfirm: () => applyMany(sims, "suspend"),
  });

  const reinstateMany = (sims: SimRow[]) => confirm({
    title: `Reinstate ${sims.length} SIM(s)?`,
    confirmLabel: "Reinstate",
    destructive: false,
    onConfirm: () => applyMany(sims, "reinstate"),
  });

  const activateMany = (sims: SimRow[]) => applyMany(sims, "activate");

  return {
    suspendOne,
    reinstateOne,
    suspendMany,
    reinstateMany,
    activateMany,
    confirmDialog,
    isPending: suspendMutation.isPending || bulkMutation.isPending,
  };
}
