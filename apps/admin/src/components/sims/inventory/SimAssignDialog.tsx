import type { SimRow } from "./simInventoryShared";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  keepPreviousData, useQuery,
} from "@tanstack/react-query";
import {
  getSystemDevicesQueryOptions, useReassignSystemSim,
} from "@truckmoov/api/auth";
import {
  ChevronLeft, ChevronRight, Search,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { useDebouncedValue } from "@/features/communications/useDebouncedValue";

export const ASSIGN_SIM_FORM_ID = "assign-sim-form";

const DEVICE_PAGE_SIZE = 50;

const assignSimSchema = z.object({
  tenantId: z.string().min(
    1,
    "Tenant is required.",
  ),
  deviceId: z.string().min(
    1,
    "Device is required.",
  ),
});

type AssignSimFormValues = Required<z.infer<typeof assignSimSchema>>;

export type SimAssignDialogProps = {
  sim: SimRow | null;
  tenants: {
    id: string;
    name: string;
    status?: string;
  }[];
  loadingOptions: boolean;
  onOpenChange: (open: boolean) => void;
};

function devicePlaceholder(tenantId: string, loading: boolean) {
  if (!tenantId)
    return "Select a tenant first";
  return loading ? "Loading devices..." : "Select a device";
}

export function SimAssignDialog({
  sim,
  tenants,
  loadingOptions,
  onOpenChange,
}: SimAssignDialogProps) {
  const reassignMutation = useReassignSystemSim();
  const form = useForm<AssignSimFormValues>({
    resolver: zodResolver(assignSimSchema),
    mode: "onChange",
    defaultValues: {
      tenantId: "",
      deviceId: "",
    },
  });
  const tenantId = form.watch("tenantId");
  const deviceId = form.watch("deviceId");
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    lastSimId,
    setLastSimId,
  ] = useState(sim?.id);
  if (sim?.id !== lastSimId) {
    setLastSimId(sim?.id);
    setSearch("");
    setPage(1);
  }
  const debouncedSearch = useDebouncedValue(
    search.trim(),
    300,
  );
  const devicesQuery = useQuery({
    ...getSystemDevicesQueryOptions({
      params: {
        tenantId,
        search: debouncedSearch || undefined,
        page,
        limit: DEVICE_PAGE_SIZE,
      },
    }),
    enabled: Boolean(sim && tenantId),
    placeholderData: keepPreviousData,
  });
  const pageDevices = devicesQuery.data?.data.items ?? [];
  const total = devicesQuery.data?.data.total ?? 0;
  const lastPage = Math.max(
    1,
    Math.ceil(total / DEVICE_PAGE_SIZE),
  );
  // The linked device may sit on another page or be filtered out, so always keep it selectable.
  const linkedMissing = Boolean(sim?.deviceId)
    && tenantId === sim?.tenantId
    && !pageDevices.some(device => device.id === sim?.deviceId);
  const tenantDevices = linkedMissing && sim?.deviceId
    ? [
        {
          id: sim.deviceId,
          imei: sim.deviceImei ?? sim.deviceId,
        },
        ...pageDevices,
      ]
    : pageDevices;
  const loadingDevices = loadingOptions || devicesQuery.isLoading;

  useEffect(
    () => {
      if (sim) {
        form.reset({
          tenantId: sim.tenantId ?? "",
          deviceId: sim.deviceId ?? "",
        });
      }
    },
    [
      sim,
      form,
    ],
  );

  const handleSubmit = (values: AssignSimFormValues) => {
    if (!sim)
      return;
    reassignMutation.mutate(
      {
        id: sim.id,
        data: values,
      },
      {
        onSuccess: () => {
          toast.success("SIM assigned");
          onOpenChange(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleReturnToPool = () => {
    if (!sim)
      return;
    reassignMutation.mutate(
      {
        id: sim.id,
        data: { tenantId: null },
      },
      {
        onSuccess: () => {
          toast.success("SIM returned to pool");
          onOpenChange(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog
      open={Boolean(sim)}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{sim?.tenantId ? "Reassign SIM Card" : "Assign SIM Card"}</DialogTitle>
          <DialogDescription>Assign this SIM to a tenant and device</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={ASSIGN_SIM_FORM_ID}
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Tenant</FormLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSearch("");
                      setPage(1);
                      form.setValue(
                        "deviceId",
                        "",
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      );
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingOptions ? "Loading tenants..." : "Select a tenant"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenants.map(tenant => (
                        <SelectItem
                          key={tenant.id}
                          value={tenant.id}
                        >
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Device</FormLabel>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search by IMEI, manufacturer or model"
                      className="pl-9"
                      disabled={!tenantId}
                    />
                  </div>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!tenantId || loadingOptions || (devicesQuery.isLoading && tenantDevices.length === 0)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={devicePlaceholder(
                          tenantId,
                          loadingDevices,
                        )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenantDevices.map(device => (
                        <SelectItem
                          key={device.id}
                          value={device.id}
                        >
                          {device.imei}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tenantId && !loadingDevices && tenantDevices.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {debouncedSearch ? "No devices match your search." : "No devices are available for the selected tenant."}
              </p>
            )}
            {tenantId && total > DEVICE_PAGE_SIZE && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{`Page ${page} of ${lastPage} · ${total} devices`}</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Next page"
                    disabled={page >= lastPage}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>

        <DialogFooter>
          {sim?.tenantId && (
            <Button
              variant="outline"
              className="sm:mr-auto"
              onClick={handleReturnToPool}
              disabled={reassignMutation.isPending}
            >
              Return to pool
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={ASSIGN_SIM_FORM_ID}
            loading={reassignMutation.isPending}
            disabled={!tenantId || !deviceId}
          >
            Assign SIM
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
