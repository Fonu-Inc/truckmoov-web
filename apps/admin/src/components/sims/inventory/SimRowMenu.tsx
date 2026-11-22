import type { SimRow } from "./simInventoryShared";
import {
  ArrowUpDown,
  CheckCircle,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  canDelete,
  canReinstate,
  canSuspend,
} from "./simInventoryShared";

export type SimRowActions = {
  suspensionPending: boolean;
  onView: (sim: SimRow) => void;
  onEdit: (sim: SimRow) => void;
  onAssign: (sim: SimRow) => void;
  onSuspend: (sim: SimRow) => void;
  onReinstate: (sim: SimRow) => void;
  onDelete: (sim: SimRow) => void;
};

export function SimRowMenu({
  sim,
  options,
}: {
  sim: SimRow;
  options: SimRowActions;
}) {
  const showSuspend = canSuspend(sim);
  const showReinstate = canReinstate(sim);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => options.onView(sim)}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => options.onEdit(sim)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => options.onAssign(sim)}>
          <ArrowUpDown className="h-4 w-4 mr-2" />
          {sim.tenantId ? "Reassign" : "Assign"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {showSuspend && (
          <DropdownMenuItem
            disabled={options.suspensionPending}
            onClick={() => options.onSuspend(sim)}
            className="text-warning"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Suspend SIM
          </DropdownMenuItem>
        )}
        {showReinstate && (
          <DropdownMenuItem
            disabled={options.suspensionPending}
            onClick={() => options.onReinstate(sim)}
            className="text-success"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Reinstate SIM
          </DropdownMenuItem>
        )}
        {canDelete(sim) && (
          <DropdownMenuItem
            disabled={options.suspensionPending}
            onClick={() => options.onDelete(sim)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
