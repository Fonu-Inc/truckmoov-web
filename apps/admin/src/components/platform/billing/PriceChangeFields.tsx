import type {
  PriceChangeErrors,
  PriceChangeValues,
} from "./priceChange";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import { todayInLagos } from "./billingFormat";

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export function PriceChangeFields({
  values,
  errors,
  onChange,
}: {
  values: PriceChangeValues;
  errors: PriceChangeErrors;
  onChange: (next: PriceChangeValues) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label
          htmlFor="price-reason"
          required
        >
          Reason for price change
        </Label>
        <Textarea
          id="price-reason"
          value={values.reason}
          onChange={e => onChange({
            ...values, reason: e.target.value,
          })}
          placeholder="e.g. Annual pricing review"
          maxLength={500}
          className="rounded-xl"
        />
        <FieldError message={errors.reason} />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="price-effective"
          required
        >
          Effective date
        </Label>
        <Input
          id="price-effective"
          type="date"
          max={todayInLagos()}
          value={values.effectiveDate}
          onChange={e => onChange({
            ...values, effectiveDate: e.target.value,
          })}
          className="rounded-xl"
        />
        <FieldError message={errors.effectiveDate} />
      </div>
    </div>
  );
}
