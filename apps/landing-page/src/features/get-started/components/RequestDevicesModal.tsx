"use client";

import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { Resolver } from "react-hook-form";
import type { DeviceRequestValues } from "@/features/get-started/schemas/applySchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useEffect,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { InfoRow } from "@/features/get-started/components/StepParts";
import { SubDialog } from "@/features/get-started/components/SubDialog";
import { deviceRequestSchema } from "@/features/get-started/schemas/applySchemas";
import {
  FIELD_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXTAREA_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { cn } from "@/shared/utils";

const EMPTY_DEVICE_REQUEST: DeviceRequestValues = {
  quantity: 1,
  useCase: "",
  notes: "",
};

const FORM_ID = "apply-request-devices-form";

/**
 * Devices are fitted one per vehicle, so a request can never take the total past the
 * vehicles added (main app: RequestDevicesModal). The server enforces it too.
 */
export function RequestDevicesModal({
  open,
  maxQuantity,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  maxQuantity: number;
  onOpenChange: (open: boolean) => void;
  /** Rejects with the server error on failure. */
  onSubmit: (values: DeviceRequestValues) => Promise<unknown>;
}) {
  const form = useForm<DeviceRequestValues>({
    // `quantity` is coerced, so the schema input is `unknown`; the form holds the parsed values.
    resolver: zodResolver(deviceRequestSchema.refine(
      values => values.quantity <= maxQuantity,
      {
        message: `You can request at most ${maxQuantity} more device${maxQuantity === 1 ? "" : "s"}, one per vehicle.`,
        path: ["quantity"],
      },
    )) as Resolver<DeviceRequestValues>,
    mode: "onTouched",
    defaultValues: EMPTY_DEVICE_REQUEST,
  });
  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(
    () => {
      if (open)
        form.reset(EMPTY_DEVICE_REQUEST);
    },
    [
      open,
      form,
    ],
  );

  async function handleSubmit(values: DeviceRequestValues) {
    setSaving(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      const field = err.field === "useCase" || err.field === "notes" ? err.field : "quantity";
      form.setError(
        field,
        { message: err.message || "The request couldn't be saved." },
      );
    }
    finally {
      setSaving(false);
    }
  }

  return (
    <SubDialog
      open={open}
      onOpenChange={next => !saving && onOpenChange(next)}
      title="Request Devices"
      description="Request tracking devices to be supplied by Fleet Pro."
      footer={(
        <>
          <button
            type="button"
            className={cn(
              SECONDARY_BUTTON_CLASS,
              "h-[45px] px-6 text-sm",
            )}
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={FORM_ID}
            className={PRIMARY_BUTTON_CLASS}
            disabled={saving}
          >
            {saving ? "Submitting…" : "Submit Device Request"}
          </button>
        </>
      )}
    >
      <InfoRow className="rounded-[15px] bg-surface p-3 text-xs">
        One device is fitted per vehicle, so you can request up to
        {" "}
        <span className="font-semibold">{maxQuantity}</span>
        {" "}
        more. Fleet Pro supplies the hardware.
      </InfoRow>
      <Form {...form}>
        <form
          id={FORM_ID}
          className="mt-5 space-y-[19px]"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel className={LABEL_CLASS}>Number of Devices</FormLabel>
                <FormControl>
                  <input
                    type="number"
                    min={1}
                    max={maxQuantity}
                    className={FIELD_CLASS}
                    {...field}
                    value={field.value as number | string}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="useCase"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel className={LABEL_CLASS}>Use Case</FormLabel>
                <FormControl>
                  <textarea
                    rows={3}
                    placeholder="What will these devices be used for?"
                    className={TEXTAREA_CLASS}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel className={LABEL_CLASS}>Notes (optional)</FormLabel>
                <FormControl>
                  <textarea
                    rows={2}
                    className={TEXTAREA_CLASS}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </SubDialog>
  );
}
