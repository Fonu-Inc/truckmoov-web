import type { UseFormReturn } from "react-hook-form";
import type { BusinessDetailsValues } from "@/features/apply/utils/applySchemas";
import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingM2mPlansQueryOptions, useVerifyOnboardingTelecomMasterNumber,
} from "@truckmoov/api/auth";
import {
  CheckCircle2, Clock, HelpCircle, Info,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { toMtnMsisdn } from "@/features/apply/utils/applySchemas";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    value: "existing", label: "Yes, I have an existing MTN number",
  },
  {
    value: "new", label: "No, I need a new Telecom Master number",
  },
] as const;

/** Enterprise only, as in Settings → Telecom Master (landing: TelecomMasterSection). */
export function TelecomMasterSection({ form }: { form: UseFormReturn<BusinessDetailsValues> }) {
  const verify = useVerifyOnboardingTelecomMasterNumber();
  const simNgn = useQuery(getOnboardingM2mPlansQueryOptions()).data?.data.telecomMasterSimNgn;
  const [
    explainerOpen,
    setExplainerOpen,
  ] = useState(false);
  const numberType = form.watch("telecomMasterNumberType");
  const msisdn = toMtnMsisdn(form.watch("telecomMasterMsisdn"));
  const verified = Boolean(msisdn) && form.watch("telecomMasterVerifiedMsisdn") === msisdn;

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
    <section className="space-y-5 border-b border-border/60 pb-8">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">Telecom Master Information</h3>
          <button
            type="button"
            aria-expanded={explainerOpen}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            onClick={() => setExplainerOpen(open => !open)}
          >
            <HelpCircle className="h-4 w-4" />
            What is a Telecom Master?
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose whether you want to use an existing MTN number or request a new Telecom Master number
          for your fleet management service.
        </p>
        {explainerOpen && (
          <p className="mt-3 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
            Your Telecom Master identifies your fleet’s tracking service and helps associate your devices and SIM
            cards with your account.
          </p>
        )}
      </div>

      <FormField
        control={form.control}
        name="telecomMasterNumberType"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-sm">
              Do you have an existing MTN number you would like to use as your Telecom Master number?
              <span className="ml-0.5 text-destructive">*</span>
            </FormLabel>
            <div
              role="radiogroup"
              aria-label="Telecom Master number"
              className="grid gap-4 sm:grid-cols-2"
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
                      "flex items-center gap-3 rounded-2xl border bg-card p-4 text-left text-sm font-medium text-foreground transition-all",
                      selected && "border-primary bg-primary/5 ring-1 ring-primary/30",
                    )}
                  >
                    <span className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      selected ? "border-primary" : "border-border",
                    )}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {numberType === "existing" && (
        <FormField
          control={form.control}
          name="telecomMasterMsisdn"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-sm">
                MTN Phone Number
                <span className="ml-0.5 text-destructive">*</span>
              </FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Enter your existing MTN number."
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={verified}
                  loading={verify.isPending}
                  onClick={handleVerify}
                >
                  Verify Number
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the MTN number you want to associate with your Telecom Master.
              </p>
              {verified && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Number verified.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {numberType === "new" && (
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/15 p-3 text-sm text-warning">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            {`A new MTN SIM will be requested for your Telecom Master.${simNgn ? ` The ${formatCurrency(simNgn)} SIM charge will be included in your quotation.` : ""}`}
          </p>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            New Telecom Master SIM requested: Allocation Pending. Your number will appear in your
            account once MTN allocates it.
          </p>
        </div>
      )}
    </section>
  );
}
