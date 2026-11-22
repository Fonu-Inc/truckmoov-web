import type { InstallationPrice } from "@truckmoov/api/billing";
import type {
  PriceChangeErrors,
  PriceChangeValues,
} from "@/components/platform/billing/priceChange";
import {
  useInstallationPrice, useUpdateInstallationPrice,
} from "@truckmoov/api/billing";
import { Wrench } from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { toast } from "sonner";
import {
  formatIsoDate,
  formatNgn,
  todayInLagos,
} from "@/components/platform/billing/billingFormat";
import { PriceCardFrame } from "@/components/platform/billing/billingUi";
import { validatePriceChange } from "@/components/platform/billing/priceChange";
import {
  FieldError,
  PriceChangeFields,
} from "@/components/platform/billing/PriceChangeFields";
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
import { Skeleton } from "@/components/shadcn/skeleton";

function isPositiveInt(value: string) {
  const n = Number(value);
  return value.trim() !== "" && Number.isInteger(n) && n >= 1;
}

function priceSentence(price: InstallationPrice) {
  if (price.enterpriseNgn === price.ownerOperatorNgn) {
    return `Current price: ${formatNgn(price.enterpriseNgn)} per installation.`;
  }
  return `Current price: ${formatNgn(price.enterpriseNgn)} per installation for enterprise customers and ${formatNgn(price.ownerOperatorNgn)} for owner-operators.`;
}

function ReasonDialog({
  open,
  onOpenChange,
  saving,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onConfirm: (values: PriceChangeValues) => void;
}) {
  const [
    values,
    setValues,
  ] = useState<PriceChangeValues>({
    reason: "", effectiveDate: todayInLagos(),
  });
  const [
    errors,
    setErrors,
  ] = useState<PriceChangeErrors>({});

  useEffect(
    () => {
      if (!open)
        return;
      setValues({
        reason: "", effectiveDate: todayInLagos(),
      });
      setErrors({});
    },
    [open],
  );

  const confirm = () => {
    const found = validatePriceChange(values);
    setErrors(found);
    if (Object.keys(found).length === 0)
      onConfirm(values);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Confirm price change</DialogTitle>
          <DialogDescription>
            The change is recorded in the price history with your reason.
          </DialogDescription>
        </DialogHeader>
        <PriceChangeFields
          values={values}
          errors={errors}
          onChange={setValues}
        />
        <DialogFooter>
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl"
            onClick={confirm}
            disabled={saving}
          >
            Confirm and save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PriceInput({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-xl"
      />
      <FieldError message={error} />
    </div>
  );
}

function CardFrame({
  children, description,
}: {
  children: React.ReactNode; description?: string;
}) {
  return (
    <PriceCardFrame
      icon={Wrench}
      title="Installation Price"
      subtitle="Details and current information for installation price."
      description={`A one-off installation charge added to every quotation, invoice and payment alongside the selected M2M license plan.${description ? ` ${description}` : ""}`}
    >
      {children}
    </PriceCardFrame>
  );
}

function PriceEditor({ price }: { price: InstallationPrice }) {
  const update = useUpdateInstallationPrice();
  const [
    enterprise,
    setEnterprise,
  ] = useState(String(price.enterpriseNgn));
  const [
    ownerOperator,
    setOwnerOperator,
  ] = useState(String(price.ownerOperatorNgn));
  const [
    confirmOpen,
    setConfirmOpen,
  ] = useState(false);
  const [
    errors,
    setErrors,
  ] = useState<{
    enterprise?: string; ownerOperator?: string;
  }>({});

  useEffect(
    () => {
      setEnterprise(String(price.enterpriseNgn));
      setOwnerOperator(String(price.ownerOperatorNgn));
    },
    [
      price.enterpriseNgn,
      price.ownerOperatorNgn,
    ],
  );

  const dirty
    = Number(enterprise) !== price.enterpriseNgn || Number(ownerOperator) !== price.ownerOperatorNgn;

  const requestSave = () => {
    const found = {
      ...(isPositiveInt(enterprise) ? {} : { enterprise: "Enter a whole number greater than zero." }),
      ...(isPositiveInt(ownerOperator) ? {} : { ownerOperator: "Enter a whole number greater than zero." }),
    };
    setErrors(found);
    if (Object.keys(found).length === 0)
      setConfirmOpen(true);
  };

  const save = ({
    reason, effectiveDate,
  }: PriceChangeValues) =>
    update.mutate(
      {
        data: {
          enterpriseNgn: Number(enterprise),
          ownerOperatorNgn: Number(ownerOperator),
          reason: reason.trim(),
          effectiveDate,
        },
      },
      {
        onSuccess: () => {
          toast.success("Installation price updated");
          setConfirmOpen(false);
        },
        onError: error => toast.error(error.message),
      },
    );

  return (
    <CardFrame description={priceSentence(price)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <PriceInput
          id="install-enterprise"
          label="Enterprise Customer Price (NGN)"
          value={enterprise}
          error={errors.enterprise}
          onChange={setEnterprise}
        />
        <PriceInput
          id="install-oo"
          label="Owner-Operator Price (NGN)"
          value={ownerOperator}
          error={errors.ownerOperator}
          onChange={setOwnerOperator}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {`Last updated ${formatIsoDate(price.lastChangedAt)}`}
        </span>
        <Button
          className="rounded-xl"
          onClick={requestSave}
          disabled={!dirty}
        >
          Save installation price
        </Button>
      </div>
      <ReasonDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        saving={update.isPending}
        onConfirm={save}
      />
    </CardFrame>
  );
}

export function InstallationPriceCard() {
  const {
    data, isLoading, isError, error, refetch,
  } = useInstallationPrice();

  if (isLoading) {
    return (
      <CardFrame>
        <Skeleton className="h-20 w-full rounded-xl" />
      </CardFrame>
    );
  }

  if (isError || !data) {
    return (
      <CardFrame>
        <div className="py-4 text-center">
          <p className="text-sm font-medium">Couldn't load the installation price</p>
          <p className="text-xs text-muted-foreground">{error?.message}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </div>
      </CardFrame>
    );
  }

  return <PriceEditor price={data.data} />;
}
