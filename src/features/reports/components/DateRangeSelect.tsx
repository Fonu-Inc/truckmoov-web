import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DateRange = "7d" | "30d" | "90d";

const OPTIONS: { label: string; value: DateRange }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

interface DateRangeSelectProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export default function DateRangeSelect({ value, onChange }: DateRangeSelectProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(opt.value)}
          className={cn(
            "h-7 px-3 text-xs",
            value === opt.value && "bg-background shadow-sm text-foreground"
          )}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
