import type { DriverBehaviorSeverity } from "@truckmoov/api/fleet";
import { SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { FILTER_BUTTON_CLASS } from "@/features/fleet/components/ui/violations/violationsUi";

export type SeverityFilter = DriverBehaviorSeverity | "all";

/** The design app's "Filter" button; filters the behaviour events by severity. */
export function ViolationsSeverityFilter({
  value,
  onChange,
}: {
  value: SeverityFilter;
  onChange: (v: SeverityFilter) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={FILTER_BUTTON_CLASS}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Severity</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={v => onChange(v as SeverityFilter)}
        >
          <DropdownMenuRadioItem value="all">All severities</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="critical">Critical</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
