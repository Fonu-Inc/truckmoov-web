import { Truck } from "lucide-react";
import { NO_ENDPOINT } from "@/components/platform/billing/billingFormat";
import { PriceCardFrame } from "@/components/platform/billing/billingUi";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";

// No delivery-price endpoint yet: the card mirrors the design app with every
// value shown as "-" and saving disabled until the API lands.
const FIELDS = [
  {
    id: "delivery-enterprise", label: "Enterprise Customer Price (NGN)",
  },
  {
    id: "delivery-oo", label: "Owner-Operator Price (NGN)",
  },
];

export function DeliveryPriceCard() {
  return (
    <PriceCardFrame
      icon={Truck}
      title="Delivery Price"
      subtitle="Transport jobs, their assigned resources, and delivery progress."
      description={`The delivery fee added to a quotation when a tenant chooses device delivery instead of pickup. Current price: ${NO_ENDPOINT} per delivery.`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(field => (
          <div
            key={field.id}
            className="space-y-2"
          >
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
              id={field.id}
              value={NO_ENDPOINT}
              readOnly
              className="rounded-xl"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {`Last updated ${NO_ENDPOINT}`}
        </span>
        <Button
          className="rounded-xl"
          disabled
        >
          Save delivery price
        </Button>
      </div>
    </PriceCardFrame>
  );
}
