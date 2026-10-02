import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateSystemSim } from "@truckmoov/api/auth";
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
import { Form } from "@/components/shadcn/form";
import { SIM_CARRIERS } from "../simInventoryShared";
import { SimIdentityFields } from "./SimIdentityFields";
import type { SimIdentityValues } from "./simIdentity";
import { buildIdentityShape } from "./simIdentity";

export const ADD_SIM_FORM_ID = "add-sim-form";

const addSimSchema = z.object(buildIdentityShape());

const EMPTY_VALUES: SimIdentityValues = {
  iccid: "",
  msisdn: "",
  imsi: "",
  carrier: "",
};

export type SimAddDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carrierOptions?: readonly string[];
};

function AddSimForm({
  carrierOptions,
  onDone,
}: {
  carrierOptions: readonly string[];
  onDone: () => void;
}) {
  const createMutation = useCreateSystemSim();
  const form = useForm<SimIdentityValues>({
    resolver: zodResolver(addSimSchema),
    defaultValues: EMPTY_VALUES,
  });

  const handleSubmit = (values: SimIdentityValues) => {
    createMutation.mutate(
      {
        iccid: values.iccid,
        msisdn: values.msisdn,
        imsi: values.imsi || undefined,
        carrier: values.carrier,
      },
      {
        onSuccess: () => {
          toast.success("SIM card added successfully");
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
          id={ADD_SIM_FORM_ID}
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <SimIdentityFields
            form={form}
            carrierOptions={carrierOptions}
          />
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
          form={ADD_SIM_FORM_ID}
          loading={createMutation.isPending}
        >
          Add SIM
        </Button>
      </DialogFooter>
    </>
  );
}

export function SimAddDialog({
  open,
  onOpenChange,
  carrierOptions = SIM_CARRIERS,
}: SimAddDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New SIM Card</DialogTitle>
          <DialogDescription>Add a new SIM card to the inventory</DialogDescription>
        </DialogHeader>
        <AddSimForm
          carrierOptions={carrierOptions}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
