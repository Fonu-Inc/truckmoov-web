import type { FilterDraft } from "@/components/shadcn/platform-filter-popover";
import { Search } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { PlatformFilterPopover } from "@/components/shadcn/platform-filter-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  SIM_STATUSES,
  STATUS_LABELS,
} from "./simInventoryShared";

export const EMPTY_SIM_FILTERS: FilterDraft = {
  carrier: { enabled: false },
  tenant: { enabled: false },
};

type SimInventoryFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  filters: FilterDraft;
  onFiltersChange: (value: FilterDraft) => void;
  carriers: string[];
  tenants: {
    id: string;
    name: string;
  }[];
};

export function SimInventoryFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  filters,
  onFiltersChange,
  carriers,
  tenants,
}: SimInventoryFiltersProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by ICCID, phone number, or tenant..."
          className="pl-10"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <Select
        value={status}
        onValueChange={onStatusChange}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {SIM_STATUSES.map(s => (
            <SelectItem
              key={s}
              value={s}
            >
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <PlatformFilterPopover
        entity="SIMs"
        fields={[
          {
            key: "carrier",
            label: "Carrier",
            type: "select",
            options: carriers.map(c => ({
              value: c,
              label: c,
            })),
          },
          {
            key: "tenant",
            label: "Tenant",
            type: "select",
            options: tenants.map(t => ({
              value: t.id,
              label: t.name,
            })),
          },
        ]}
        value={filters}
        onApply={onFiltersChange}
        onReset={() => onFiltersChange(EMPTY_SIM_FILTERS)}
      />
    </div>
  );
}
