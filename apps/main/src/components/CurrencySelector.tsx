import { useCurrency } from "@/contexts/CurrencyContext";
import { Currency, CURRENCIES } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign } from "lucide-react";

interface CurrencySelectorProps {
  compact?: boolean;
}

export function CurrencySelector({ compact = false }: CurrencySelectorProps) {
  const { currency, setCurrency } = useCurrency();

  return (
    <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
      <SelectTrigger className={compact ? "w-[120px]" : "w-[160px]"}>
        <DollarSign className="h-4 w-4 mr-1" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(CURRENCIES).map(([code, details]) => (
          <SelectItem key={code} value={code}>
            {`${details.symbol} ${details.code}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
