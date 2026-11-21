import type { PlatformDevice } from "./management/deviceStatus";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: PlatformDevice[];
  tenants: Array<{ id: string; name: string }>;
  /** Records the assignment in page state (no platform assign endpoint yet). */
  onAssigned: (deviceIds: string[], tenant: { id: string; name: string }) => void;
};

/** Platform Admin confirms that configured and activated devices have been assigned to a tenant. */
export function RecordDeviceAssignmentDialog({
  open,
  onOpenChange,
  devices,
  tenants,
  onAssigned,
}: Props) {
  const [tenantId, setTenantId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [configured, setConfigured] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return devices.filter(d => !d.tenantId).filter(d =>
      !q || [
        d.imei,
        d.manufacturer,
        d.model,
      ].some(v => String(v ?? "").toLowerCase().includes(q)));
  }, [devices, search]);

  const reset = () => {
    setTenantId("");
    setSelected([]);
    setSearch("");
    setConfigured(false);
    setNotes("");
  };
  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const tenant = tenants.find(t => t.id === tenantId);
  const tenantName = tenant?.name ?? "the tenant";

  const save = () => {
    if (!tenant)
      return;
    setSaving(true);
    // ponytail: mock data from fleetflow parity port — wire to packages/api
    // (no platform device-assignment endpoint; recorded in page state only).
    onAssigned(selected, tenant);
    toast.success(`${selected.length} device${selected.length === 1 ? "" : "s"} assigned to ${tenantName}`, {
      description: "Devices marked as configured, activated and assigned.",
    });
    reset();
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o)
          reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Device Assignment</DialogTitle>
          <DialogDescription>Confirm that one or more configured and activated devices have been assigned to a tenant.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tenant</Label>
            <Select
              value={tenantId}
              onValueChange={setTenantId}
            >
              <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
              <SelectContent>
                {tenants.map(t => (
                  <SelectItem
                    key={t.id}
                    value={t.id}
                  >
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Devices</Label>
              <span className="text-xs text-muted-foreground">{`${selected.length} selected`}</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by IMEI, manufacturer or model"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-2">
              {available.length === 0
                ? <p className="p-3 text-center text-sm text-muted-foreground">No unassigned devices available.</p>
                : available.map(d => (
                    <label
                      key={d.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selected.includes(d.id)}
                        onCheckedChange={() => toggle(d.id)}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{`${d.manufacturer} ${d.model ?? ""}`}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{d.imei}</p>
                      </div>
                    </label>
                  ))}
            </div>
            {available.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelected(selected.length === available.length ? [] : available.map(d => d.id))}
              >
                {selected.length === available.length ? "Clear selection" : "Select all"}
              </Button>
            )}
          </div>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={configured}
              onCheckedChange={v => setConfigured(!!v)}
              className="mt-0.5"
            />
            <span>I confirm these devices have been configured and activated.</span>
          </label>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={saving || !tenantId || !selected.length || !configured}
            onClick={save}
          >
            {saving ? "Saving…" : `Assign ${selected.length || ""} device${selected.length === 1 ? "" : "s"}`.replace("  ", " ")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
