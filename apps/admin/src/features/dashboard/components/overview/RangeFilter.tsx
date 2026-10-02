import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";

export type RangeOption = { value: number; label: string };

type RangeFilterProps = {
  value: number;
  options: RangeOption[];
  onValueChange: (value: number) => void;
};

export function RangeFilter({ value, options, onValueChange }: RangeFilterProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={next => onValueChange(Number(next))}
    >
      <SelectTrigger className="w-[150px] h-8">
        <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem
            key={option.value}
            value={String(option.value)}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
