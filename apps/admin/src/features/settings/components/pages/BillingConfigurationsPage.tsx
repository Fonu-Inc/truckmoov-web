import type { Currency } from "@/lib/currency";
import { CreditCard } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { FxRateCard } from "@/features/settings/components/ui/PlanPricingManager";
import { CURRENCIES } from "@/lib/currency";

export default function BillingConfigurationsPage() {
  const {
    currency,
    setCurrency,
  } = useCurrency();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Billing Configuration
          </CardTitle>
          <CardDescription>
            Set the global default currency. All financial data across the platform — charts,
            tables, invoices, and analytics — will reflect this selection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Platform Currency</Label>
              <Select
                value={currency}
                onValueChange={v => setCurrency(v as Currency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCIES).map(([
                    code,
                    c,
                  ]) => (
                    <SelectItem
                      key={code}
                      value={code}
                    >
                      {c.symbol}
                      {" "}
                      {c.code}
                      {" "}
                      —
                      {" "}
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Currently active:
                {" "}
                <span className="font-medium">{CURRENCIES[currency].name}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <FxRateCard />
    </div>
  );
}
