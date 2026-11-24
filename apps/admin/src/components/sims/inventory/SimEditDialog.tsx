import type { UpdateSystemSimPayload } from "@truckmoov/api/auth";
import type {
  Resolver,
  UseFormReturn,
} from "react-hook-form";
import type { SimIdentityValues } from "./dialogs/simIdentity";
import type { SimRow } from "./simInventoryShared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateSystemSim } from "@truckmoov/api/auth";
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
import {
  buildIdentityShape,
  mergeCarrierOptions,
} from "./dialogs/simIdentity";
import { SimIdentityFields } from "./dialogs/SimIdentityFields";
import { SimStatusBadge } from "./SimInventoryBadges";
import {
  PLAN_LABELS,
  SIM_CARRIERS,
  SIM_PLANS,
} from "./simInventoryShared";

export const EDIT_SIM_FORM_ID = "edit-sim-form";

function buildEditSchema(sim: SimRow) {
  return z.object({
    ...buildIdentityShape({
      iccid: sim.iccid,
      msisdn: sim.msisdn ?? "",
      imsi: sim.imsi ?? "",
    }),
    plan: z.enum(SIM_PLANS),
    dataLimitMb: z.coerce.number().int("Data limit must be a whole number.").min(
      0,
      "Data limit must be 0 or higher.",
    ),
    smsLimit: z.coerce.number().int("SMS limit must be a whole number.").min(
      0,
      "SMS limit must be 0 or higher.",
    ),
  });
}

type EditSimFormValues = SimIdentityValues & {
  plan: (typeof SIM_PLANS)[number];
  dataLimitMb: number;
  smsLimit: number;
};

function toFormValues(sim: SimRow) {
  return {
    iccid: sim.iccid,
    msisdn: sim.msisdn ?? "",
    imsi: sim.imsi ?? "",
    carrier: sim.carrier,
    plan: SIM_PLANS.find(p => p === sim.plan),
    dataLimitMb: sim.dataLimit,
    smsLimit: sim.smsLimit,
  } as EditSimFormValues;
}

function buildChanges(sim: SimRow, values: EditSimFormValues) {
  const changes: UpdateSystemSimPayload["data"] = {
    plan: values.plan,
    carrier: values.carrier,
    dataLimitMb: values.dataLimitMb,
    smsLimit: values.smsLimit,
  };
  if (values.iccid !== sim.iccid)
    changes.iccid = values.iccid;
  if (values.msisdn !== (sim.msisdn ?? ""))
    changes.msisdn = values.msisdn;
  if (values.imsi !== (sim.imsi ?? ""))
    changes.imsi = values.imsi;
  return changes;
}

export type SimEditDialogProps = {
  sim: SimRow | null;
  onOpenChange: (open: boolean) => void;
  carrierOptions?: readonly string[];
};

function EditSimForm({
  sim,
  carrierOptions,
  onDone,
}: {
  sim: SimRow;
  carrierOptions: readonly string[];
  onDone: () => void;
}) {
  const updateMutation = useUpdateSystemSim();
  const form = useForm<EditSimFormValues>({
    resolver: zodResolver(buildEditSchema(sim)) as Resolver<EditSimFormValues>,
    mode: "onChange",
    defaultValues: toFormValues(sim),
  });

  const handleSubmit = (values: EditSimFormValues) => {
    updateMutation.mutate(
      {
        id: sim.id,
        data: buildChanges(
          sim,
          values,
        ),
      },
      {
        onSuccess: () => {
          toast.success("SIM card updated successfully");
          onDone();
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <>
      <Form {...form}>
        <form
          id={EDIT_SIM_FORM_ID}
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          <SimIdentityFields
            form={form as unknown as UseFormReturn<SimIdentityValues>}
            carrierOptions={carrierOptions}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Plan</FormLabel>
                  <Select
                    name={field.name}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SIM_PLANS.map(plan => (
                        <SelectItem
                          key={plan}
                          value={plan}
                        >
                          {PLAN_LABELS[plan]}
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
              name="dataLimitMb"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Limit (MB)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value ?? ""}
                      onBlur={field.onBlur}
                      onChange={event => field.onChange(Number(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="smsLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SMS Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value ?? ""}
                      onBlur={field.onBlur}
                      onChange={event => field.onChange(Number(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onDone}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form={EDIT_SIM_FORM_ID}
          loading={updateMutation.isPending}
        >
          Save Changes
        </Button>
      </DialogFooter>
    </>
  );
}

export function SimEditDialog({
  sim,
  onOpenChange,
  carrierOptions = SIM_CARRIERS,
}: SimEditDialogProps) {
  const options = mergeCarrierOptions(
    carrierOptions,
    sim ? [sim.carrier] : [],
  );

  return (
    <Dialog
      open={Boolean(sim)}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit SIM Card</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Update SIM card information
            {sim && <SimStatusBadge status={sim.status} />}
          </DialogDescription>
        </DialogHeader>
        {sim && (
          <EditSimForm
            key={sim.id}
            sim={sim}
            carrierOptions={options}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
