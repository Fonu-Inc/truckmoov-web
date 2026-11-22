import { todayInLagos } from "./billingFormat";

export type PriceChangeValues = {
  reason: string; effectiveDate: string;
};

export type PriceChangeErrors = Partial<Record<keyof PriceChangeValues, string>>;

export function validatePriceChange(values: PriceChangeValues): PriceChangeErrors {
  const errors: PriceChangeErrors = {};
  if (!values.reason.trim())
    errors.reason = "A reason is required for a price change.";
  if (!values.effectiveDate) {
    errors.effectiveDate = "Pick an effective date.";
  }
  else if (values.effectiveDate > todayInLagos()) {
    errors.effectiveDate = "Effective date cannot be in the future.";
  }
  return errors;
}
