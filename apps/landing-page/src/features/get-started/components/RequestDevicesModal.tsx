"use client";

import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { Resolver } from "react-hook-form";
import type { DeviceRequestValues } from "@/features/get-started/schemas/applySchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { deviceUseCaseOptions } from "@truckmoov/app-core/apply/applyTypes";
import {
  useEffect,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { DeviceStockModelSelects } from "@/features/get-started/components/DeviceStockModelSelects";
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
  deviceModelId: "",
  quantity: 1,
  useCase: "",
  notes: "",
};

const FORM_ID = "apply-request-devices-form";

/**
 * Devices are fitted one per vehicle, so a request can never take the total past the
 * vehicles added (main app: RequestDevicesModal). The server enforces it too. With
 * `initial` it edits an existing request ("Edit Device Request").
 */
export function RequestDevicesModal({
  open,
  initial,
  maxQuantity,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  /** Set to edit an existing request. */
  initial?: DeviceRequestValues | null;
  maxQuantity: number;
  onOpenChange: (open: boolean) => void;
  /** Returns false when the customer cancels the stock confirmation. */
  onSubmit: (values: DeviceRequestValues) => Promise<boolean>;
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
        form.reset(initial ?? EMPTY_DEVICE_REQUEST);
    },
    [
      open,
      initial,
      form,
    ],
  );

  async function handleSubmit(values: DeviceRequestValues) {
    setSaving(true);
    try {
      form.clearErrors();
      if (await onSubmit(values))
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
      title={initial ? "Edit Device Request" : "Request Devices"}
      description={initial
        ? "Update the details of this device request."
        : "Request tracking devices to be supplied by Fleet Pro."}
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
            {saving ? "Submitting…" : initial ? "Save Changes" : "Submit Device Request"}
          </button>
        </>
      )}
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          className="space-y-[19px]"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FormField
            control={form.control}
            name="deviceModelId"
            render={({ field }) => (
              <FormItem>
                <DeviceStockModelSelects
                  key={open ? "open" : "closed"}
                  value={field.value}
                  disabled={saving}
                  onChange={model => field.onChange(model?.id ?? "")}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel
                  className={LABEL_CLASS}
                  required
                >
                  Number of Devices
                </FormLabel>
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
                <FormLabel
                  className={LABEL_CLASS}
                  required
                >
                  Use Case
                </FormLabel>
                <FormControl>
                  <select
                    {...field}
                    value={field.value ?? ""}
                    className={cn(
                      FIELD_CLASS,
                      !field.value && "text-faint-foreground",
                    )}
                  >
                    <option value="">Select use case</option>
                    {deviceUseCaseOptions(initial?.useCase).map(option => (
                      <option
                        key={option}
                        value={option}
                        className="text-heading"
                      >
                        {option}
                      </option>
                    ))}
                  </select>
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
                <FormLabel className={LABEL_CLASS}>Notes (Optional)</FormLabel>
                <FormControl>
                  <textarea
                    rows={2}
                    placeholder="Optional"
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
