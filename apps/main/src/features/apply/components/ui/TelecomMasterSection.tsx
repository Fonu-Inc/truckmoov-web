import type { UseFormReturn } from "react-hook-form";
import type { BusinessDetailsValues } from "@/features/apply/utils/applySchemas";
import { useVerifyOnboardingTelecomMasterNumber } from "@truckmoov/api/auth";
import {
  CheckCircle2, Clock, Info,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { toMtnMsisdn } from "@/features/apply/utils/applySchemas";
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
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="What is a telematics number?"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Telecom Master number serves as the central number used to link and manage all your device numbers
                on the platform.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <h3 className="text-base font-semibold text-foreground">Telecom Master Information</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose whether you want to use an existing MTN number or request a new Telecom Master number
          for your fleet management service.
        </p>
      </div>

      <FormField
        control={form.control}
        name="telecomMasterNumberType"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel
              className="text-sm"
              required
            >
              Do you have an existing MTN number you would like to use as your telematics number?
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
              <FormLabel
                className="text-sm"
                required
              >
                MTN Phone Number
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
                Enter the MTN number you want to associate with your Telecom service.
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
            A new MTN SIM will be requested for your Telecom Master service. The applicable SIM charge will be
            included in your quotation.
          </p>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            New Telecom Master SIM requested, Allocation Pending. Your number will appear in your
            account once MTN allocates it.
          </p>
        </div>
      )}
    </section>
  );
}
