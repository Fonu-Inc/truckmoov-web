import type { UseFormReturn } from "react-hook-form";
import type { BusinessDetailsValues } from "@/features/apply/utils/applySchemas";
import type { ApplicantCustomerType } from "@/features/apply/utils/applyTypes";

import { useQuery } from "@tanstack/react-query";
import { getOnboardingM2mPlansQueryOptions } from "@truckmoov/api/auth";
import {
  ArrowRight,
  Check,
  ExternalLink,
  FileSignature,
  FileText,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { IndemnityDialog } from "@/features/apply/components/ui/IndemnityDialog";
import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";
import {
  IDENTIFICATION_TYPES,
  NIGERIAN_STATES,
} from "@/features/apply/utils/applySchemas";
import { useEmailAvailability } from "@/features/apply/utils/useEmailAvailability";
import { cn } from "@/lib/utils";

export const BUSINESS_DETAILS_FORM_ID = "apply-business-details-form";

type BusinessDetailsStepProps = {
  form: UseFormReturn<BusinessDetailsValues>;
  customerType: ApplicantCustomerType;
  submitting: boolean;
  /** Signed on the server already (the generated form is in the documents). */
  indemnitySigned: boolean;
  /** Set when the agreement changed under the applicant and they must sign again. */
  indemnityNotice?: string | null;
  /** Error from the last save that belongs to no single field. */
  saveError?: string | null;
  nextLabel?: string;
  /** Lets the email check ignore the application being edited. */
  applicationId?: string | null;
  onSubmit: (values: BusinessDetailsValues) => void;
};

export function BusinessDetailsStep({
  form,
  customerType,
  submitting,
  indemnitySigned: signedOnServer,
  indemnityNotice,
  saveError,
  nextLabel,
  applicationId,
  onSubmit,
}: BusinessDetailsStepProps) {
  useEmailAvailability(form, applicationId);
  const isEnterprise = customerType === "enterprise";
  const licence = useApplyDraftStore(state => state.licence);
  const setLicence = useApplyDraftStore(state => state.setLicence);
  const pendingSignature = useApplyDraftStore(state => state.pendingSignature);
  const setPendingSignature = useApplyDraftStore(state => state.setPendingSignature);
  const plansQuery = useQuery(getOnboardingM2mPlansQueryOptions());
  const plans = plansQuery.data?.data.plans ?? [];
  // A signature drawn before the application exists is uploaded right after it is saved.
  const indemnitySigned = signedOnServer || Boolean(pendingSignature);
  const [
    indemnityOpen,
    setIndemnityOpen,
  ] = useState(false);
  const [
    sectionError,
    setSectionError,
  ] = useState<string | null>(null);

  function handleValid(values: BusinessDetailsValues) {
    // ponytail: the licence and indemnity live outside the zod schema because the
    // server has no field for them yet — validate them here until it does.
    if (!licence.licensePlan) {
      setSectionError("Select a license plan to continue.");
      return;
    }
    if (!indemnitySigned) {
      setSectionError("Review and electronically sign the indemnity form.");
      return;
    }
    if (!licence.indemnityAccepted) {
      setSectionError("Confirm that you have reviewed the indemnity form.");
      return;
    }
    setSectionError(null);
    onSubmit(values);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Customer Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your customer information, select a license plan, and review the indemnity form.
        </p>
      </div>

      <Form {...form}>
        <form
          id={BUSINESS_DETAILS_FORM_ID}
          className="space-y-8"
          onSubmit={form.handleSubmit(handleValid)}
        >
          {/* ─── Business Details ─────────────────────────────────────────── */}
          <section className="space-y-5 border-b border-border/60 pb-8">
            <div>
              <h3 className="text-base font-semibold text-foreground">Business Details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Provide the primary details for this application.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {!isEnterprise && (
                <>
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Adeyemi"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem className={isEnterprise ? undefined : "sm:col-span-2"}>
                    <FormLabel>{isEnterprise ? "Company Name" : "Organization Name"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Lagos Express Logistics Ltd"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={isEnterprise ? "operations@company.com" : "you@company.com"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+234 901 234 5678"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEnterprise && (
                <>
                  <FormField
                    control={form.control}
                    name="rcNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RC Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="RC1234567"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxIdentificationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Identification Number (TIN)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="12345678-0001"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {!isEnterprise && (
                <>
                  <FormField
                    control={form.control}
                    name="identificationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Type</FormLabel>
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an ID type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {IDENTIFICATION_TYPES.map(type => (
                              <SelectItem
                                key={type.value}
                                value={type.value}
                              >
                                {type.label}
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
                    name="identificationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {isEnterprise && (
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person's Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Adaeze Okonkwo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem className={isEnterprise ? "sm:col-span-2" : undefined}>
                    <FormLabel>{isEnterprise ? "Company Address" : "Business Address"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Apapa-Oshodi Expressway"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NIGERIAN_STATES.map(state => (
                          <SelectItem
                            key={state}
                            value={state}
                          >
                            {state}
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
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Lagos"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* ─── M2M License Plan ─────────────────────────────────────────── */}
          <section className="space-y-5 border-b border-border/60 pb-8">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Choose Your M2M License Plan
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your M2M license plan is charged per device and determines the bundled cost for
                each device.
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label="M2M Plan"
              className="grid gap-4 sm:grid-cols-2"
            >
              {plansQuery.isLoading && (
                <p className="text-sm text-muted-foreground">Loading plans…</p>
              )}
              {plansQuery.isError && (
                <p className="text-sm text-destructive">
                  Plans couldn't be loaded.
                  {" "}
                  <button
                    type="button"
                    className="font-medium underline"
                    onClick={() => plansQuery.refetch()}
                  >
                    Try again
                  </button>
                </p>
              )}
              {plans.map((plan) => {
                const selected = licence.licensePlan === plan.code;
                const title = plan.name;

                return (
                  <div
                    key={plan.code}
                    className={cn(
                      "relative flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-all",
                      selected && "border-primary bg-primary/5 ring-1 ring-primary/30",
                    )}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className="flex flex-col items-start gap-4 text-left"
                      onClick={() => {
                        setLicence({ licensePlan: plan.code });
                        setSectionError(null);
                      }}
                    >
                      <span className="flex w-full items-start justify-between gap-3">
                        <span className="flex flex-col gap-1">
                          <span className="text-base font-semibold text-foreground">{title}</span>
                          <span className="text-sm text-muted-foreground">{plan.description}</span>
                        </span>
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card",
                          )}
                        >
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </span>

                      <span className="flex w-full flex-col gap-1 rounded-xl border border-border/60 bg-muted/30 p-3">
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-foreground">
                            {`₦${plan.perDeviceYear1Ngn.toLocaleString()}`}
                          </span>
                          <span className="text-xs text-muted-foreground">per device — Year 1</span>
                        </span>
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-sm font-semibold text-foreground">
                            {`₦${plan.perDeviceRenewalNgn.toLocaleString()}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            per device — Renewal
                          </span>
                        </span>
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {selected ? "Selected" : `Select ${title}`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                i
              </span>
              Your M2M License plan is priced per device. Your final quotation will be calculated
              based on the number of devices requested.
            </p>
          </section>

          {/* ─── Indemnity Agreement ──────────────────────────────────────── */}
          <section className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Indemnity Agreement</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Please review the indemnity form before completing your application.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Fleet Pro Indemnity Form</p>
                  <p className="text-xs text-muted-foreground">
                    {signedOnServer
                      ? "Electronically signed"
                      : pendingSignature
                        ? "Signed — saved with your details when you continue"
                        : "Review and sign electronically"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant={indemnitySigned ? "outline" : "default"}
                onClick={() => setIndemnityOpen(true)}
              >
                {indemnitySigned
                  ? <FileSignature className="mr-2 h-4 w-4" />
                  : <ExternalLink className="mr-2 h-4 w-4" />}
                {indemnitySigned ? "Review & Re-sign" : "View & Sign Form"}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Review and electronically sign the form here. No separate upload is required.
            </p>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <Checkbox
                id="indemnity-confirmation"
                checked={licence.indemnityAccepted}
                disabled={!indemnitySigned}
                onCheckedChange={(checked) => {
                  setLicence({ indemnityAccepted: checked === true });
                  setSectionError(null);
                }}
              />
              <Label
                htmlFor="indemnity-confirmation"
                className="cursor-pointer text-sm font-normal leading-5 text-foreground"
              >
                {indemnitySigned
                  ? "I confirm that I have reviewed the indemnity form and agree to its terms."
                  : "Sign the indemnity form before confirming your agreement."}
              </Label>
            </div>
          </section>

          {indemnityNotice && !pendingSignature && (
            <p className="text-sm text-destructive">{indemnityNotice}</p>
          )}
          {(sectionError || saveError) && (
            <p className="text-sm text-destructive">{sectionError ?? saveError}</p>
          )}

          <div className="flex justify-end border-t border-border/60 pt-6">
            <Button
              type="submit"
              size="lg"
              className="min-w-40"
              loading={submitting}
            >
              {nextLabel ?? "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>

      <IndemnityDialog
        open={indemnityOpen}
        onOpenChange={setIndemnityOpen}
        initialName={licence.indemnitySignatureName}
        notice={indemnityNotice}
        onSigned={({
          method, name, image, version,
        }) => {
          setPendingSignature({
            method,
            name,
            image,
            version,
          });
          // Re-signing clears the confirmation, matching the design app.
          setLicence({
            indemnitySignatureName: name,
            indemnityAccepted: false,
          });
          setSectionError(null);
        }}
      />
    </div>
  );
}
