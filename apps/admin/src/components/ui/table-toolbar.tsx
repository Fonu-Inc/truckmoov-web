import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReactNode, useEffect, useState } from "react";

interface StatusOption {
  value: string;
  label: string;
}

/**
 * Structured filter field for the standard popover.
 * - "range": two number inputs (From / To)
 * - "date":  single date input
 * - "select": dropdown of options
 */
export type FilterField =
  | {
      type: "range";
      key: string;
      label: string;
      placeholderFrom?: string;
      placeholderTo?: string;
    }
  | {
      type: "date";
      key: string;
      label: string;
    }
  | {
      type: "daterange";
      key: string;
      label: string;
      placeholderFrom?: string;
      placeholderTo?: string;
    }
  | {
      type: "select";
      key: string;
      label: string;
      options: { value: string; label: string }[];
    };

export interface FilterValue {
  enabled: boolean;
  from?: string;
  to?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  value?: string;
}

export type FilterValues = Record<string, FilterValue>;

interface TableToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  status?: string;
  onStatusChange?: (v: string) => void;
  statusOptions?: StatusOption[];
  /** Subject in "Only show {entity} by..." e.g. "logs", "events" */
  filterEntity?: string;
  filterFields?: FilterField[];
  filterValues?: FilterValues;
  onFiltersApply?: (values: FilterValues) => void;
  /** Legacy custom slot — only used if filterFields is not provided */
  filterContent?: ReactNode;
  rightSlot?: ReactNode;
}

const emptyValue: FilterValue = { enabled: false };

/**
 * Standard table toolbar: full-width Search | Status (optional) | Filter [rightSlot]
 */
export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  status,
  onStatusChange,
  statusOptions,
  filterEntity = "items",
  filterFields,
  filterValues,
  onFiltersApply,
  filterContent,
  rightSlot,
}: TableToolbarProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterValues>(filterValues ?? {});

  useEffect(() => {
    if (open) setDraft(filterValues ?? {});
  }, [open, filterValues]);

  const activeCount = Object.values(filterValues ?? {}).filter((v) => v?.enabled).length;

  const updateDraft = (key: string, patch: Partial<FilterValue>) => {
    setDraft((d) => ({ ...d, [key]: { ...emptyValue, ...d[key], ...patch } }));
  };

  const handleApply = () => {
    onFiltersApply?.(draft);
    setOpen(false);
  };
  const handleShowAll = () => {
    const cleared: FilterValues = {};
    (filterFields ?? []).forEach((f) => (cleared[f.key] = { enabled: false }));
    setDraft(cleared);
    onFiltersApply?.(cleared);
    setOpen(false);
  };

  const showStructured = !!filterFields && filterFields.length > 0;
  const showFilter = showStructured || !!filterContent;

  return (
    <div className="flex flex-wrap items-center gap-2 w-full px-1">
      {/* Full-width search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9 h-9 w-full border-border bg-transparent font-semibold placeholder:font-normal hover:bg-secondary"
        />
      </div>

      {statusOptions && onStatusChange && (
        <Select value={status ?? "all"} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 w-[150px] shrink-0 border-border bg-transparent font-semibold hover:bg-secondary">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showFilter && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 font-semibold shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {activeCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 space-y-4 max-h-[70vh] overflow-y-auto" align="end">
            {showStructured ? (
              <>
                <h4 className="text-xs font-medium text-foreground px-0.5">
                  Only show {filterEntity} by...
                </h4>
                <div className="space-y-4">
                  {filterFields!.map((field) => {
                    const v = draft[field.key] ?? emptyValue;
                    return (
                      <div key={field.key} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`flt-${field.key}`}
                            checked={v.enabled}
                            onCheckedChange={(c) =>
                              updateDraft(field.key, { enabled: c === true })
                            }
                          />
                          <Label
                            htmlFor={`flt-${field.key}`}
                            className="text-sm cursor-pointer"
                          >
                            {field.label}
                          </Label>
                        </div>
                        {field.type === "range" && (
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              placeholder={field.placeholderFrom ?? "From"}
                              disabled={!v.enabled}
                              value={v.from ?? ""}
                              onChange={(e) =>
                                updateDraft(field.key, { from: e.target.value })
                              }
                              className="h-9"
                            />
                            <Input
                              type="number"
                              placeholder={field.placeholderTo ?? "To"}
                              disabled={!v.enabled}
                              value={v.to ?? ""}
                              onChange={(e) =>
                                updateDraft(field.key, { to: e.target.value })
                              }
                              className="h-9"
                            />
                          </div>
                        )}
                        {field.type === "date" && (
                          <Input
                            type="date"
                            placeholder="DD/MM/YYYY"
                            disabled={!v.enabled}
                            value={v.date ?? ""}
                            onChange={(e) =>
                              updateDraft(field.key, { date: e.target.value })
                            }
                            className="h-9"
                          />
                        )}
                        {field.type === "daterange" && (
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="date"
                              placeholder={field.placeholderFrom ?? "From"}
                              disabled={!v.enabled}
                              value={v.dateFrom ?? ""}
                              onChange={(e) =>
                                updateDraft(field.key, { dateFrom: e.target.value })
                              }
                              className="h-9"
                            />
                            <Input
                              type="date"
                              placeholder={field.placeholderTo ?? "To"}
                              disabled={!v.enabled}
                              value={v.dateTo ?? ""}
                              onChange={(e) =>
                                updateDraft(field.key, { dateTo: e.target.value })
                              }
                              className="h-9"
                            />
                          </div>
                        )}
                        {field.type === "select" && (
                          <Select
                            disabled={!v.enabled}
                            value={v.value ?? ""}
                            onValueChange={(val) =>
                              updateDraft(field.key, { value: val })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button onClick={handleApply} className="flex-1">
                    Apply
                  </Button>
                  <Button variant="outline" onClick={handleShowAll} className="flex-1">
                    Show All
                  </Button>
                </div>
              </>
            ) : (
              filterContent
            )}
          </PopoverContent>
        </Popover>
      )}

      {rightSlot && <div className="ml-auto flex items-center gap-2">{rightSlot}</div>}
    </div>
  );
}



