import type { PlatformDevice } from "./deviceStatus";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemTenantsQueryOptions,
  useAssignSystemDevices,
} from "@truckmoov/api/auth";
import { Search } from "lucide-react";
import {
  useMemo, useState,
} from "react";
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
  devices: PlatformDevice[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Records that one or more stock devices now belong to a tenant. */
export function RecordDeviceAssignmentDialog({
  devices,
  open,
  onOpenChange,
}: Props) {
  const tenantsQuery = useQuery({
    ...getSystemTenantsQueryOptions(),
    enabled: open,
  });
  const assignDevices = useAssignSystemDevices();
  const [
    tenantId,
    setTenantId,
  ] = useState("");
  const [
    selected,
    setSelected,
  ] = useState<string[]>([]);
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    confirmed,
    setConfirmed,
  ] = useState(false);
  const [
    notes,
    setNotes,
  ] = useState("");
  const [
    error,
    setError,
  ] = useState("");

  const tenants = useMemo(
    () => (tenantsQuery.data?.data.tenants ?? [])
      .filter(t => t.status !== "terminated")
      .sort((a, b) => a.name.localeCompare(b.name)),
    [tenantsQuery.data],
  );

  const visible = useMemo(
    () => {
      const query = search.trim().toLowerCase();
      return devices.filter(d =>
        !query
        || d.imei.toLowerCase().includes(query)
        || `${d.manufacturer} ${d.model}`.toLowerCase().includes(query)
        || (d.tenantName ?? "").toLowerCase().includes(query));
    },
    [
      devices,
      search,
    ],
  );

  const reset = () => {
    setTenantId("");
    setSelected([]);
    setSearch("");
    setConfirmed(false);
    setNotes("");
    setError("");
  };

  const toggle = (id: string, checked: boolean) => {
    setSelected(current => checked ? [
      ...new Set([
        ...current,
        id,
      ]),
    ] : current.filter(value => value !== id));
  };

  const submit = () => {
    if (!tenantId) {
      setError("Select the tenant receiving these devices.");
      return;
    }
    if (selected.length === 0) {
      setError("Select at least one device.");
      return;
    }
    if (!confirmed) {
      setError("Confirm that the devices have been configured and activated.");
      return;
    }
    setError("");
    assignDevices.mutate(
      {
        data: {
          tenantId,
          deviceIds: selected,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: (result) => {
          toast.success(`${result.data.updated} device${result.data.updated === 1 ? "" : "s"} assigned`);
          reset();
          onOpenChange(false);
        },
        onError: err => setError(err.message),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value)
          reset();
        onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Device Assignment</DialogTitle>
          <DialogDescription>
            Confirm that one or more configured and activated devices have been assigned to a tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tenant</Label>
            <Select
              value={tenantId}
              onValueChange={setTenantId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
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
              <span className="text-xs text-muted-foreground">
                {selected.length}
                {" selected"}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by IMEI, manufacturer or model"
                className="pl-9"
              />
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border p-2">
              {visible.map(device => (
                <label
                  key={device.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selected.includes(device.id)}
                    onCheckedChange={checked => toggle(
                      device.id,
                      checked === true,
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {device.manufacturer}
                      {" "}
                      {device.model}
                    </span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {device.imei}
                      {device.tenantName ? ` · ${device.tenantName}` : ""}
                    </span>
                  </span>
                </label>
              ))}
              {visible.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No devices match your search.</p>
              )}
            </div>
            {visible.length > 0 && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => setSelected(visible.map(d => d.id))}
              >
                Select all
              </Button>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <Checkbox
              checked={confirmed}
              onCheckedChange={checked => setConfirmed(checked === true)}
            />
            <span>I confirm these devices have been configured and activated.</span>
          </label>

          <div className="space-y-1.5">
            <Label htmlFor="device-assignment-notes">Notes (optional)</Label>
            <Textarea
              id="device-assignment-notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            loading={assignDevices.isPending}
          >
            Assign devices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
