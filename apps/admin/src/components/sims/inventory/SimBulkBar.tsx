import {
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Separator } from "@/components/shadcn/separator";

type SimBulkBarProps = {
  selectedCount: number;
  activatableCount: number;
  suspendableCount: number;
  reinstatableCount: number;
  busy: boolean;
  onActivate: () => void;
  onSuspend: () => void;
  onReinstate: () => void;
  onClear: () => void;
};

export function SimBulkBar({
  selectedCount,
  activatableCount,
  suspendableCount,
  reinstatableCount,
  busy,
  onActivate,
  onSuspend,
  onReinstate,
  onClear,
}: SimBulkBarProps) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border bg-primary/5 p-3">
      <div className="flex items-center gap-2">
        <Checkbox checked={true} />
        <span className="text-sm font-medium">
          {selectedCount}
          {" "}
          selected
        </span>
      </div>
      <Separator
        orientation="vertical"
        className="h-6"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={busy || activatableCount === 0}
          onClick={onActivate}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Activate
          {activatableCount > 0 && ` (${activatableCount})`}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || suspendableCount === 0}
          onClick={onSuspend}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Suspend
          {suspendableCount > 0 && ` (${suspendableCount})`}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || reinstatableCount === 0}
          onClick={onReinstate}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Reinstate
          {reinstatableCount > 0 && ` (${reinstatableCount})`}
        </Button>
      </div>
      <div className="ml-auto">
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
}
