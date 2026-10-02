import { zodResolver } from "@hookform/resolvers/zod";
import { useReassignSystemSim } from "@truckmoov/api/auth";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import type { SimRow } from "./simInventoryShared";

export const ASSIGN_SIM_FORM_ID = "assign-sim-form";

const assignSimSchema = z.object({
  tenantId: z.string().min(1, "Tenant is required."),
  deviceId: z.string().min(1, "Device is required."),
});

type AssignSimFormValues = Required<z.infer<typeof assignSimSchema>>;

export type SimAssignDialogProps = {
  sim: SimRow | null;
  tenants: {
    id: string;
    name: string;
    status?: string;
  }[];
  devices: {
    id: string;
    imei: string;
    tenantId: string;
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
  devices,
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
  const tenantDevices = devices.filter(device => device.tenantId === tenantId);

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
                  <FormLabel>Tenant</FormLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
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
                  <FormLabel>Device</FormLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!tenantId || loadingOptions}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={devicePlaceholder(tenantId, loadingOptions)} />
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

            {tenantId && !loadingOptions && tenantDevices.length === 0 && (
              <p className="text-sm text-muted-foreground">No devices are available for the selected tenant.</p>
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
