import {
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { cn } from "@/lib/utils";

type MultiSelectProps = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options",
  className,
}: MultiSelectProps) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [
      ...value,
      opt,
    ]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between rounded-xl font-normal",
            className,
          )}
        >
          <span className="flex flex-wrap items-center gap-1 overflow-hidden text-left">
            {value.length === 0
              ? <span className="text-muted-foreground">{placeholder}</span>
              : value.slice(
                  0,
                  3,
                ).map(v => (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="rounded-full"
                  >
                    {v}
                  </Badge>
                ))}
            {value.length > 3 && (
              <Badge
                variant="secondary"
                className="rounded-full"
              >
                +
                {value.length - 3}
              </Badge>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-2"
        align="start"
      >
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {options.map(opt => (
            <div
              key={opt}
              role="checkbox"
              aria-checked={value.includes(opt)}
              tabIndex={0}
              onClick={() => toggle(opt)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(opt);
                }
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
            >
              <Checkbox
                checked={value.includes(opt)}
                className="pointer-events-none"
              />
              <span className="flex-1">{opt}</span>
              {value.includes(opt) && <Check className="h-4 w-4 text-primary" />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
