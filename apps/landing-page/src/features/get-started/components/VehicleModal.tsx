"use client";

import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { VehicleValues } from "@/features/get-started/schemas/applySchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CloudArrowUp,
  FileText,
} from "@phosphor-icons/react/dist/ssr";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useForm,
  useWatch,
} from "react-hook-form";
import { Notice } from "@/features/get-started/components/StepParts";
import { SubDialog } from "@/features/get-started/components/SubDialog";
import {
  checkFile,
  SERVER_VEHICLE_FIELD,
  vehicleSchema,
} from "@/features/get-started/schemas/applySchemas";
import {
  PURCHASE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@/features/get-started/utils/applyTypes";
import {
  FIELD_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";
import { cn } from "@/shared/utils";

const EMPTY_VEHICLE: VehicleValues = {
  registrationNumber: "",
  vehicleType: "",
  make: "",
  model: "",
  year: "",
  engineNumber: "",
  chassisNumber: "",
  color: "",
  engineCapacity: "",
  odometer: "",
  purchaseType: "",
  otherPurchaseType: "",
};

const FORM_ID = "apply-vehicle-form";
const LICENCE_REQUIRED = "Upload the vehicle licence to add this vehicle.";

type TextName = Exclude<keyof VehicleValues, "vehicleType" | "purchaseType">;
type SelectName = "vehicleType" | "purchaseType";

/** Add a vehicle, or edit one when `initial` is set (main app: VehicleModal). Server field errors land on their input. */
export function VehicleModal({
  open,
  initial,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  initial?: VehicleValues | null;
  onOpenChange: (open: boolean) => void;
  /** `licence` is required when adding and only present when replacing on edit. Rejects with the server error on failure. */
  onSubmit: (values: VehicleValues, licence: File | null) => Promise<unknown>;
}) {
  const form = useForm<VehicleValues>({
    resolver: zodResolver(vehicleSchema),
    mode: "onTouched",
    defaultValues: EMPTY_VEHICLE,
  });
  const [
    saving,
    setSaving,
  ] = useState(false);
  const [
    formError,
    setFormError,
  ] = useState<string | null>(null);
  const [
    licence,
    setLicence,
  ] = useState<File | null>(null);
  const [
    licenceError,
    setLicenceError,
  ] = useState<string | null>(null);
  const licenceInputRef = useRef<HTMLInputElement>(null);
  const purchaseType = useWatch({
    control: form.control,
    name: "purchaseType",
  });

  useEffect(
    () => {
      if (!open)
        return;
      form.reset(initial ?? EMPTY_VEHICLE);
      setFormError(null);
      setLicence(null);
      setLicenceError(null);
    },
    [
      open,
      initial,
      form,
    ],
  );

  function pickLicence(file: File | undefined) {
    if (!file)
      return;
    const problem = checkFile(file);
    setLicenceError(problem);
    setLicence(problem ? null : file);
  }

  async function handleSubmit(values: VehicleValues) {
    if (!initial && !licence)
      return;
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit(
        values,
        licence,
      );
      onOpenChange(false);
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      if (err.field === "vehicleLicense") {
        setLicenceError(err.message);
        return;
      }
      const field = err.field ? SERVER_VEHICLE_FIELD[err.field] : undefined;
      // A 409 "<registration> has already been added" belongs on the registration input.
      const target = field ?? (err.statusCode === 409 && /already been added/i.test(err.message) ? "registrationNumber" : undefined);
      if (target) {
        form.setError(
          target,
          { message: err.message },
        );
      }
      else {
        setFormError(err.message || "The vehicle couldn't be saved.");
      }
    }
    finally {
      setSaving(false);
    }
  }

  const textField = (name: TextName, label: string, placeholder?: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-1.5">
          <FormLabel className={LABEL_CLASS}>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              className={FIELD_CLASS}
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );

  const selectField = (name: SelectName, label: string, placeholder: string, options: Record<string, string>) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-1.5">
          <FormLabel className={LABEL_CLASS}>{label}</FormLabel>
          <FormControl>
            <select
              {...field}
              value={field.value ?? ""}
              className={cn(
                FIELD_CLASS,
                !field.value && "text-faint-foreground",
              )}
            >
              <option value="">{placeholder}</option>
              {Object.entries(options).map(([
                value,
                text,
              ]) => (
                <option
                  key={value}
                  value={value}
                  className="text-heading"
                >
                  {text}
                </option>
              ))}
            </select>
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );

  return (
    <SubDialog
      open={open}
      onOpenChange={next => !saving && onOpenChange(next)}
      title={initial ? "Edit Vehicle" : "Add Vehicle"}
      description={initial
        ? "Update the vehicle's details. Choose a file only to replace its licence."
        : "Registration number, vehicle type, make and model are required, along with the vehicle licence."}
      className="sm:max-w-[640px]"
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
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Vehicle"}
          </button>
        </>
      )}
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          className="grid gap-x-[15px] gap-y-[19px] sm:grid-cols-2"
          onSubmit={(event) => {
            if (!initial && !licence)
              setLicenceError(licenceError ?? LICENCE_REQUIRED);
            return form.handleSubmit(handleSubmit)(event);
          }}
        >
          {textField(
            "registrationNumber",
            "Registration Number",
            "LAG-123-XY",
          )}
          {selectField(
            "vehicleType",
            "Vehicle Type",
            "Select a type",
            VEHICLE_TYPE_LABELS,
          )}
          {textField(
            "make",
            "Vehicle Make",
            "Toyota",
          )}
          {textField(
            "model",
            "Vehicle Model",
            "Hilux",
          )}
          {textField(
            "year",
            "Vehicle Year",
            "2021",
          )}
          {textField(
            "engineNumber",
            "Engine Number",
          )}
          {textField(
            "chassisNumber",
            "Chassis Number",
          )}
          {textField(
            "color",
            "Vehicle Color",
          )}
          {textField(
            "engineCapacity",
            "Engine Capacity",
            "2.8L",
          )}
          {textField(
            "odometer",
            "Odometer Reading (km)",
            "84500",
          )}
          {selectField(
            "purchaseType",
            "Type of Purchase",
            "Select a purchase type",
            PURCHASE_TYPE_LABELS,
          )}
          {purchaseType === "other" && textField(
            "otherPurchaseType",
            "Specify Purchase Type",
          )}

          <div className="space-y-1.5 sm:col-span-2">
            <span className={cn(
              LABEL_CLASS,
              licenceError && "text-destructive",
            )}
            >
              Vehicle License Document
              {!initial && <span className="text-destructive"> *</span>}
            </span>
            <input
              ref={licenceInputRef}
              type="file"
              accept="application/pdf,.pdf,image/jpeg,image/png,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(event) => {
                pickLicence(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => licenceInputRef.current?.click()}
              onDragOver={event => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                pickLicence(event.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex w-full cursor-pointer flex-col items-center gap-1 rounded-[15px] border border-dashed border-border-field px-4 py-6 text-center transition-colors hover:border-border-deep hover:bg-surface",
                licenceError && "border-destructive",
              )}
            >
              {licence
                ? (
                    <>
                      <FileText className="size-6 text-brand-deep" />
                      <span className="max-w-full truncate text-sm font-medium text-heading">{licence.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {`${(licence.size / 1024 / 1024).toFixed(2)} MB · click to replace`}
                      </span>
                    </>
                  )
                : (
                    <>
                      <CloudArrowUp className="size-6 text-muted-foreground" />
                      <span className="text-sm font-medium text-heading">Upload vehicle license</span>
                      <span className="text-xs text-muted-foreground">
                        {initial ? "Leave empty to keep the licence already uploaded" : "PDF, JPG or PNG, max 10MB"}
                      </span>
                    </>
                  )}
            </button>
            {licenceError && <p className="text-xs text-destructive">{licenceError}</p>}
          </div>
        </form>
      </Form>
      {formError && <Notice className="mt-4">{formError}</Notice>}
    </SubDialog>
  );
}
