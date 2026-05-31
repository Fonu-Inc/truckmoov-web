import { ReactNode, useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterFieldType = "select" | "range" | "date";

export interface SelectFilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  /** For "select" fields */
  options?: SelectFilterOption[];
  /** For "range" fields, optional placeholders. Defaults: "From"/"To" */
  fromPlaceholder?: string;
  toPlaceholder?: string;
}

export type FilterDraft = Record<
  string,
  {
    enabled: boolean;
    value?: string; // select / single date
    from?: string; // range / date range
    to?: string;
  }
>;

interface PlatformFilterPopoverProps {
  entity: string; // e.g. "tenants", "devices", "SIMs"
  fields: FilterField[];
  value: FilterDraft;
  onApply: (next: FilterDraft) => void;
  onReset: () => void;
}

export function buildEmptyDraft(fields: FilterField[]): FilterDraft {
  const d: FilterDraft = {};
  for (const f of fields) {
    d[f.key] = { enabled: false, value: undefined, from: undefined, to: undefined };
  }
  return d;
}

export function countActiveFilters(value: FilterDraft): number {
  return Object.values(value).filter((v) => v?.enabled).length;
}

export function PlatformFilterPopover({
  entity,
  fields,
  value,
  onApply,
  onReset,
}: PlatformFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterDraft>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const activeCount = countActiveFilters(value);

  const updateField = (
    key: string,
    patch: Partial<FilterDraft[string]>,
  ) => {
    setDraft((d) => ({
      ...d,
      [key]: { ...(d[key] || { enabled: false }), ...patch },
    }));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[300px] p-3 rounded-xl max-h-[70vh] overflow-y-auto"
      >
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-foreground px-0.5">
            Only show {entity} by...
          </h4>

          {fields.map((field) => {
            const fd = draft[field.key] || { enabled: false };
            return (
              <div key={field.key} className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={fd.enabled}
                    onCheckedChange={(c) =>
                      updateField(field.key, { enabled: !!c })
                    }
                    className="h-3.5 w-3.5"
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      !fd.enabled && "text-muted-foreground",
                    )}
                  >
                    {field.label}
                  </span>
                </label>

                {field.type === "select" && (
                  <Select
                    disabled={!fd.enabled}
                    value={fd.value ?? ""}
                    onValueChange={(v) => updateField(field.key, { value: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === "range" && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder={field.fromPlaceholder ?? "From"}
                      disabled={!fd.enabled}
                      value={fd.from ?? ""}
                      onChange={(e) =>
                        updateField(field.key, { from: e.target.value })
                      }
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder={field.toPlaceholder ?? "To"}
                      disabled={!fd.enabled}
                      value={fd.to ?? ""}
                      onChange={(e) =>
                        updateField(field.key, { to: e.target.value })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                {field.type === "date" && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      type="date"
                      disabled={!fd.enabled}
                      value={fd.from ?? ""}
                      onChange={(e) =>
                        updateField(field.key, { from: e.target.value })
                      }
                      className="h-8 text-xs"
                    />
                    <Input
                      type="date"
                      disabled={!fd.enabled}
                      value={fd.to ?? ""}
                      onChange={(e) =>
                        updateField(field.key, { to: e.target.value })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              onClick={() => {
                onApply(draft);
                setOpen(false);
              }}
              className="flex-1"
              size="sm"
            >
              Apply
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const empty = buildEmptyDraft(fields);
                setDraft(empty);
                onReset();
                setOpen(false);
              }}
              className="flex-1"
              size="sm"
            >
              Show All
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
