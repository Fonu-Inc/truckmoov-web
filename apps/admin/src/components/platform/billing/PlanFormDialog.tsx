import type {
  CreatePlanBody, PlanView, UpdatePlanBody,
} from "@truckmoov/api/billing";
import type { PriceChangeErrors } from "@/components/platform/billing/priceChange";
import {
  useCreateBillingPlan, useUpdateBillingPlan,
} from "@truckmoov/api/billing";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  formatNgn,
  todayInLagos,
} from "@/components/platform/billing/billingFormat";
import { validatePriceChange } from "@/components/platform/billing/priceChange";
import {
  FieldError,
  PriceChangeFields,
} from "@/components/platform/billing/PriceChangeFields";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import { Textarea } from "@/components/shadcn/textarea";

type FormState = {
  code: string;
  name: string;
  description: string;
  year1: string;
  renewal: string;
  validity: string;
  components: string[];
  isActive: boolean;
  reason: string;
  effectiveDate: string;
};

type FormErrors = PriceChangeErrors & Partial<Record<"code" | "name" | "year1" | "renewal" | "validity", string>>;

const DEFAULT_VALIDITY_DAYS = 365;
const MAX_COMPONENTS = 20;
const MAX_COMPONENT_LENGTH = 120;

function initialState(plan?: PlanView | null): FormState {
  return {
    code: plan?.code ?? "",
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    year1: plan ? String(plan.perDeviceYear1Ngn) : "",
    renewal: plan ? String(plan.perDeviceRenewalNgn) : "",
    validity: String(plan?.validityDays ?? DEFAULT_VALIDITY_DAYS),
    components: plan?.components ?? [],
    isActive: plan?.isActive ?? true,
    reason: "",
    effectiveDate: todayInLagos(),
  };
}

function isPositiveInt(value: string) {
  const n = Number(value);
  return value.trim() !== "" && Number.isInteger(n) && n >= 1;
}

function priceChanged(form: FormState, plan?: PlanView | null) {
  if (!plan)
    return false;
  return Number(form.year1) !== plan.perDeviceYear1Ngn || Number(form.renewal) !== plan.perDeviceRenewalNgn;
}

const CODE_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;
const CODE_HINT = "Use 2-64 characters: lowercase letters, digits and underscores, starting with a letter.";

function validateBasics(form: FormState, isEdit: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!isEdit) {
    if (!form.code.trim())
      errors.code = "Product ID is required.";
    else if (!CODE_PATTERN.test(form.code.trim()))
      errors.code = CODE_HINT;
  }
  if (!form.name.trim())
    errors.name = "Name is required.";
  if (!isPositiveInt(form.year1))
    errors.year1 = "Enter a whole number greater than zero.";
  if (!isPositiveInt(form.renewal))
    errors.renewal = "Enter a whole number greater than zero.";
  if (!isPositiveInt(form.validity))
    errors.validity = "Enter a whole number of days, at least 1.";
  return errors;
}

function validateForm(form: FormState, plan?: PlanView | null): FormErrors {
  const errors = validateBasics(
    form,
    !!plan,
  );
  return priceChanged(
    form,
    plan,
  ) ? {
        ...errors, ...validatePriceChange(form),
      } : errors;
}

function toCreateBody(form: FormState): CreatePlanBody {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    perDeviceYear1Ngn: Number(form.year1),
    perDeviceRenewalNgn: Number(form.renewal),
    validityDays: Number(form.validity),
    components: form.components,
    isActive: form.isActive,
  };
}

function toUpdateBody(form: FormState, plan: PlanView): UpdatePlanBody {
  const body: UpdatePlanBody = {
    name: form.name.trim(),
    description: form.description.trim(),
    validityDays: Number(form.validity),
    components: form.components,
  };
  if (!priceChanged(
    form,
    plan,
  )) {
    return body;
  }
  return {
    ...body,
    perDeviceYear1Ngn: Number(form.year1),
    perDeviceRenewalNgn: Number(form.renewal),
    reason: form.reason.trim(),
    effectiveDate: form.effectiveDate,
  };
}

function ComponentChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [
    draft,
    setDraft,
  ] = useState("");

  const full = value.length >= MAX_COMPONENTS;

  const add = () => {
    const label = draft.trim();
    if (full)
      return;
    if (label && !value.some(c => c.toLowerCase() === label.toLowerCase())) {
      onChange([
        ...value,
        label,
      ]);
    }
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="plan-component">Included components</Label>
      <div className="flex gap-2">
        <Input
          id="plan-component"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter")
              return;
            e.preventDefault();
            add();
          }}
          placeholder="e.g. Tracking device"
          maxLength={MAX_COMPONENT_LENGTH}
          disabled={full}
          className="rounded-xl"
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={add}
          disabled={full}
        >
          Add
        </Button>
      </div>
      <FieldError message={full ? `You can add up to ${MAX_COMPONENTS} components.` : undefined} />
      <div className="flex flex-wrap gap-2">
        {value.map(label => (
          <Badge
            key={label}
            variant="secondary"
            className="gap-1 rounded-full"
          >
            {label}
            <button
              type="button"
              aria-label={`Remove ${label}`}
              onClick={() => onChange(value.filter(c => c !== label))}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  error,
  required,
  ...props
}: React.ComponentProps<typeof Input> & {
  id: string; label: string; error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        required={required}
      >
        {label}
      </Label>
      <Input
        id={id}
        className="rounded-xl"
        {...props}
      />
      <FieldError message={error} />
    </div>
  );
}

function PlanFormBody({
  plan,
  onClose,
}: {
  plan?: PlanView | null;
  onClose: () => void;
}) {
  const isEdit = !!plan;
  const create = useCreateBillingPlan();
  const update = useUpdateBillingPlan();
  const [
    form,
    setForm,
  ] = useState<FormState>(() => initialState(plan));
  const [
    errors,
    setErrors,
  ] = useState<FormErrors>({});
  const pending = create.isPending || update.isPending;
  const showReason = priceChanged(
    form,
    plan,
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({
      ...prev, [key]: value,
    }));

  const onDone = (message: string) => {
    toast.success(message);
    onClose();
  };

  const onError = (error: {
    message: string; statusCode?: number;
  }) => {
    if ((error.statusCode === 409 || error.statusCode === 400) && !isEdit) {
      setErrors({ code: error.message || (error.statusCode === 409 ? "A plan with this Product ID already exists." : CODE_HINT) });
      return;
    }
    toast.error(error.message);
  };

  const submit = () => {
    const found = validateForm(
      form,
      plan,
    );
    setErrors(found);
    if (Object.keys(found).length > 0)
      return;
    if (plan) {
      update.mutate(
        {
          code: plan.code, data: toUpdateBody(
            form,
            plan,
          ),
        },
        {
          onSuccess: () => onDone(`${form.name.trim()} updated`), onError,
        },
      );
      return;
    }
    create.mutate(
      { data: toCreateBody(form) },
      {
        onSuccess: () => onDone(`${form.name.trim()} added to the license plans`), onError,
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit M2M License Plan" : "Add M2M License Plan"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the plan customers are billed for. Price changes are recorded in the price history."
            : "Create a new M2M license plan. Prices are per device and bundle the device, data plan and platform license."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="plan-code"
            label="Product ID"
            required={!isEdit}
            value={form.code}
            disabled={isEdit}
            onChange={e => set(
              "code",
              e.target.value,
            )}
            placeholder="e.g. m2m_standard"
            error={errors.code}
          />
          <TextField
            id="plan-name"
            label="Plan name"
            required
            value={form.name}
            maxLength={120}
            onChange={e => set(
              "name",
              e.target.value,
            )}
            placeholder="e.g. M2M Standard License"
            error={errors.name}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan-description">Description</Label>
          <Textarea
            id="plan-description"
            value={form.description}
            maxLength={255}
            onChange={e => set(
              "description",
              e.target.value,
            )}
            className="rounded-xl"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            id="plan-year1"
            label="Year-1 price (NGN)"
            required
            type="number"
            min={1}
            step={1}
            value={form.year1}
            onChange={e => set(
              "year1",
              e.target.value,
            )}
            error={errors.year1}
          />
          <TextField
            id="plan-renewal"
            label="Renewal price (NGN)"
            required
            type="number"
            min={1}
            step={1}
            value={form.renewal}
            onChange={e => set(
              "renewal",
              e.target.value,
            )}
            error={errors.renewal}
          />
          <TextField
            id="plan-validity"
            label="Validity (days)"
            required
            type="number"
            min={1}
            step={1}
            value={form.validity}
            onChange={e => set(
              "validity",
              e.target.value,
            )}
            error={errors.validity}
          />
        </div>

        <ComponentChips
          value={form.components}
          onChange={next => set(
            "components",
            next,
          )}
        />

        {!isEdit && (
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
            <div>
              <Label htmlFor="plan-active">Active</Label>
              <p className="text-xs text-muted-foreground">Inactive plans cannot be selected by customers.</p>
            </div>
            <Switch
              id="plan-active"
              checked={form.isActive}
              onCheckedChange={v => set(
                "isActive",
                v,
              )}
            />
          </div>
        )}

        {showReason && plan && (
          <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm">
              Price change: Year-1
              {" "}
              {formatNgn(plan.perDeviceYear1Ngn)}
              {" "}
              to
              {" "}
              {formatNgn(Number(form.year1) || 0)}
              ,
              renewal
              {" "}
              {formatNgn(plan.perDeviceRenewalNgn)}
              {" "}
              to
              {" "}
              {formatNgn(Number(form.renewal) || 0)}
              .
            </p>
            <PriceChangeFields
              values={form}
              errors={errors}
              onChange={next => setForm(prev => ({
                ...prev, ...next,
              }))}
            />
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          variant="ghost"
          className="rounded-xl"
          onClick={onClose}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          className="rounded-xl"
          onClick={submit}
          disabled={pending}
        >
          {isEdit ? "Save changes" : "Add plan"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: PlanView | null;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-2xl">
        <PlanFormBody
          plan={plan}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
