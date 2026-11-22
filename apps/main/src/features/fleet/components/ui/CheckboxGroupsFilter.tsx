import type { CheckboxFilterValue } from "@/features/fleet/utils/checkboxFilter";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";

import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";

/** Filter popover of checkbox groups; an empty group matches everything. */
export function CheckboxGroupsFilter({
  groups, value, onChange,
}: {
  groups: {
    title: string; options: string[];
  }[];
  value: CheckboxFilterValue;
  onChange: (value: CheckboxFilterValue) => void;
}) {
  const active = Object.values(value).reduce(
    (n, picked) => n + picked.length,
    0,
  );
  const toggle = (title: string, option: string, on: boolean) => {
    const picked = value[title] ?? [];
    onChange({
      ...value, [title]: on ? [
        ...picked,
        option,
      ] : picked.filter(o => o !== option),
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {active > 0 && (
            <Badge
              variant="secondary"
              className="ml-1"
            >
              {active}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 max-h-80 overflow-y-auto"
      >
        <div className="space-y-4">
          {groups.map(group => (
            <div
              key={group.title}
              className="space-y-2"
            >
              <p className="text-xs font-medium">{group.title}</p>
              {group.options.length === 0 && <p className="text-xs text-muted-foreground">None</p>}
              {group.options.map(option => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <Checkbox
                    checked={(value[group.title] ?? []).includes(option)}
                    onCheckedChange={checked => toggle(
                      group.title,
                      option,
                      checked === true,
                    )}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs capitalize">{option}</span>
                </label>
              ))}
            </div>
          ))}
          {active > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onChange({})}
            >
              Clear filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
