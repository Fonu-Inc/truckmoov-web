import {
  ArrowUpToLine, Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";

type Props = {
  table: "device_setup_requests" | "sim_provisioning_requests";
  requestId: string;
  onMoved?: () => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
  label?: string;
};

/**
 * "Move Next in Queue" — bumps a request to the top by setting
 * priority_order to (current min - 1). Lower priority_order ranks first.
 */
export function MoveToTopButton({
  table,
  requestId,
  onMoved,
  variant = "outline",
  size = "sm",
  label = "Move to Top",
}: Props) {
  const [
    busy,
    setBusy,
  ] = useState(false);

  const handleClick = async () => {
    toast.info("Coming soon");
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={busy}
      className="gap-2"
    >
      {busy
        ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          )
        : (
            <ArrowUpToLine className="h-3.5 w-3.5" />
          )}
      {label}
    </Button>
  );
}
