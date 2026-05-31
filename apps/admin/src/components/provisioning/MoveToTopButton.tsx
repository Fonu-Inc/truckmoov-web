import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpToLine, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  table: "device_setup_requests" | "sim_provisioning_requests";
  requestId: string;
  onMoved?: () => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
  label?: string;
}

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
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      // Fetch current minimum priority_order for pending requests in this table
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            order: (c: string, opts: { ascending: boolean; nullsFirst?: boolean }) => {
              limit: (n: number) => {
                maybeSingle: () => Promise<{ data: { priority_order?: number | null } | null }>;
              };
            };
          };
          update: (v: Record<string, unknown>) => {
            eq: (c: string, v: string) => Promise<{ error: { message: string } | null }>;
          };
        };
      };
      const { data: minRow } = await client
        .from(table)
        .select("priority_order")
        .order("priority_order", { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      const currentMin = minRow?.priority_order ?? 0;
      const newPriority = (currentMin || 0) - 1;

      const { error } = await client
        .from(table)
        .update({ priority_order: newPriority })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Moved to top of queue", {
        description: "Request will be processed next.",
      });
      onMoved?.();
    } catch (err) {
      console.error("Move to top failed:", err);
      toast.error("Failed to reprioritise request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={busy}
      className="gap-2"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ArrowUpToLine className="h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  );
}



