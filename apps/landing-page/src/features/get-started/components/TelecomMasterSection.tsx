"use client";

import type { UseFormReturn } from "react-hook-form";
import type { BusinessDetailsValues } from "@/features/get-started/schemas/applySchemas";
import {
  CheckCircle, Clock, Info,
} from "@phosphor-icons/react/dist/ssr";
import { useVerifyOnboardingTelecomMasterNumber } from "@truckmoov/api/auth";
import { useWatch } from "react-hook-form";
import { SectionHeading } from "@/features/get-started/components/StepParts";
import { toMtnMsisdn } from "@/features/get-started/schemas/applySchemas";
import {
  FIELD_CLASS,
  LABEL_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";
import { cn } from "@/shared/utils";

const OPTIONS = [
  {
    value: "existing", label: "Yes, I have an existing MTN number",
  },
  {
    value: "new", label: "No, I need a new Telecom Master number",
  },
] as const;

/** Enterprise only, as in Settings → Telecom Master (main app: TelecomMasterSection). */
export function TelecomMasterSection({ form }: { form: UseFormReturn<BusinessDetailsValues> }) {
  const verify = useVerifyOnboardingTelecomMasterNumber();
  const [
    numberType,
    typedMsisdn,
    verifiedMsisdn,
  ] = useWatch({
    control: form.control,
    name: [
      "telecomMasterNumberType",
      "telecomMasterMsisdn",
      "telecomMasterVerifiedMsisdn",
    ],
  });
  const msisdn = toMtnMsisdn(typedMsisdn);
  const verified = Boolean(msisdn) && verifiedMsisdn === msisdn;

  function handleVerify() {
    if (!msisdn) {
      form.setError(
        "telecomMasterMsisdn",
        { message: "Enter a valid MTN mobile number." },
      );
      return;
    }
    verify.mutate(
      msisdn,
      {
        onSuccess: (res) => {
          form.setValue(
            "telecomMasterVerifiedMsisdn",
            res.data.msisdn,
          );
          form.clearErrors("telecomMasterMsisdn");
        },
        onError: error => form.setError(
          "telecomMasterMsisdn",
          { message: (error as { message?: string }).message || "This number couldn't be verified." },
        ),
      },
    );
  }

  return (
    <section>
      <SectionHeading
        title="Telecom Master Information"
        description="Choose whether you want to use an existing MTN number or request a new Telecom Master number for your fleet management service."
        leading={(
          // A CSS tooltip: the landing page has no tooltip primitive, and hover or focus is enough here.
          <span className="group relative inline-flex">
            <button
              type="button"
              aria-label="What is a telematics number?"
              aria-describedby="telecom-master-tip"
              className="inline-flex size-5 cursor-help items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand-deep/50 hover:text-brand-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
            >
              <Info className="size-3.5" />
            </button>
            <span
              id="telecom-master-tip"
              role="tooltip"
              className="pointer-events-none invisible absolute bottom-full left-0 z-20 mb-2 w-64 rounded-[10px] border border-border bg-background px-3 py-1.5 text-xs font-medium leading-[17px] text-heading opacity-0 shadow-sm transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
            >
              Telecom Master number serves as the central number used to link and manage all your device numbers on
              the platform.
            </span>
          </span>
        )}
      />

      <FormField
        control={form.control}
        name="telecomMasterNumberType"
        render={({ field }) => (
          <FormItem className="gap-1.5">
            <FormLabel
              className={LABEL_CLASS}
              required
            >
              Do you have an existing MTN number you would like to use as your telematics number?
            </FormLabel>
            <div
              role="radiogroup"
              aria-label="Telecom Master number"
              className="grid gap-[9px] sm:grid-cols-2"
            >
              {OPTIONS.map((option) => {
                const selected = field.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => field.onChange(option.value)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-[15px] bg-background p-4 text-left text-sm font-medium text-heading transition-colors",
                      selected
                        ? "border-2 border-brand-bright"
                        : "border-[0.5px] border-border hover:border-border-deep",
                    )}
                  >
                    <span className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border",
                      selected ? "border-brand-deep" : "border-border-field",
                    )}
                    >
                      {selected && <span className="size-2 rounded-full bg-brand-deep" />}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {numberType === "existing" && (
        <FormField
          control={form.control}
          name="telecomMasterMsisdn"
          render={({ field }) => (
            <FormItem className="mt-[19px] gap-1.5">
              <FormLabel
                className={LABEL_CLASS}
                required
              >
                MTN Phone Number
              </FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Enter your existing MTN number."
                    className={FIELD_CLASS}
                    {...field}
                  />
                </FormControl>
                <button
                  type="button"
                  className={cn(
                    SECONDARY_BUTTON_CLASS,
                    "h-12 shrink-0",
                  )}
                  disabled={verified || verify.isPending}
                  onClick={handleVerify}
                >
                  {verify.isPending ? "Verifying…" : "Verify Number"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the MTN number you want to associate with your Telecom service.
              </p>
              {verified && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-success">
                  <CheckCircle className="size-4" />
                  Number verified.
                </p>
              )}
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      )}

      {numberType === "new" && (
        <div className="mt-[19px] space-y-3">
          <p className="flex items-start gap-2 rounded-[15px] bg-warning-soft p-3 text-xs leading-[17px] text-warning">
            <Info className="mt-px size-4 shrink-0" />
            A new MTN SIM will be requested for your Telecom Master service. The applicable SIM charge will be
            included in your quotation.
          </p>
          <p className="flex items-start gap-2 text-xs leading-[17px] text-muted-foreground">
            <Clock className="mt-px size-4 shrink-0" />
            New Telecom Master SIM requested, Allocation Pending. Your number will appear in your
            account once MTN allocates it.
          </p>
        </div>
      )}
    </section>
  );
}
