import {
  keepPreviousData, useQuery,
} from "@tanstack/react-query";
import {
  getSystemDevicesQueryOptions,
  getSystemTenantsQueryOptions,
  useAssignSystemDevices,
} from "@truckmoov/api/auth";
import {
  ChevronLeft, ChevronRight, Search,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
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
import { useDebouncedValue } from "@/features/communications/useDebouncedValue";

const PAGE_SIZE = 50;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Records that one or more stock devices now belong to a tenant. */
export function RecordDeviceAssignmentDialog({
  open,
  onOpenChange,
}: Props) {
  const tenantsQuery = useQuery({
    ...getSystemTenantsQueryOptions(),
    enabled: open,
  });
  const assignDevices = useAssignSystemDevices();
  const [
    page,
    setPage,
  ] = useState(1);
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

  const debouncedSearch = useDebouncedValue(
    search.trim(),
    300,
  );
  const [
    lastSearch,
    setLastSearch,
  ] = useState(debouncedSearch);
  let currentPage = page;
  if (debouncedSearch !== lastSearch) {
    setLastSearch(debouncedSearch);
    setPage(1);
    currentPage = 1;
  }
  const devicesQuery = useQuery({
    ...getSystemDevicesQueryOptions({
      params: {
        scope: "stock",
        hideFaulty: true,
        search: debouncedSearch || undefined,
        page: currentPage,
        limit: PAGE_SIZE,
      },
    }),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  const visible = devicesQuery.data?.data.items ?? [];
  const total = devicesQuery.data?.data.total ?? 0;
  const lastPage = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE),
  );
  // Stock shrank under the current page: step back to the last valid page.
  useEffect(
    () => {
      if (visible.length === 0 && total > 0 && currentPage > 1)
        setPage(lastPage);
    },
    [
      visible.length,
      total,
      currentPage,
      lastPage,
    ],
  );

  const reset = () => {
    setTenantId("");
    setSelected([]);
    setSearch("");
    setPage(1);
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
            <Label required>Tenant</Label>
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
              <Label required>Devices</Label>
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
                    </span>
                  </span>
                </label>
              ))}
              {visible.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {devicesQuery.isLoading ? "Loading devices..." : devicesQuery.isError ? "Unable to load devices." : "No devices match your search."}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {`Page ${Math.min(
                  currentPage,
                  lastPage,
                )} of ${lastPage} · ${total} in stock`}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Previous page"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Next page"
                  disabled={currentPage >= lastPage}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {visible.length > 0 && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => setSelected(current => [
                  ...new Set([
                    ...current,
                    ...visible.map(d => d.id),
                  ]),
                ])}
              >
                Select all on this page
              </Button>
            )}
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="device-assignment-confirm"
              checked={confirmed}
              onCheckedChange={checked => setConfirmed(checked === true)}
            />
            <Label
              htmlFor="device-assignment-confirm"
              required
              className="cursor-pointer font-normal leading-normal"
            >
              I confirm these devices have been configured and activated.
            </Label>
          </div>

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
