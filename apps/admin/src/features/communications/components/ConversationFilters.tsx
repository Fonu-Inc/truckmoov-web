import type { MessagingConversationStatus } from "@truckmoov/api/notification";
import type { ConversationFilters as Filters } from "../messagingQueries";
import {
  SlidersHorizontal, X,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  activeFilterCount,
  STATUS_LABEL,
} from "../messagingLogic";
import { useStaffDirectory } from "../useStaffDirectory";

const ANY = "any";

type Props = {
  value: Filters;
  onChange: (next: Partial<Filters>) => void;
};

export function ConversationFilters({
  value, onChange,
}: Props) {
  const {
    staff, me,
  } = useStaffDirectory();
  const count = activeFilterCount(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant={count ? "default" : "outline"}
          aria-label="Filter conversations"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {count > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-4 px-1 text-[10px]"
            >
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 space-y-3"
      >
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Status</p>
          <Select
            value={value.status || ANY}
            onValueChange={status => onChange({ status: status === ANY ? "" : status as MessagingConversationStatus })}
          >
            <SelectTrigger aria-label="Status filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any status</SelectItem>
              {(Object.keys(STATUS_LABEL) as MessagingConversationStatus[]).map(status => (
                <SelectItem
                  key={status}
                  value={status}
                >
                  {STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Assigned to</p>
          <Select
            value={value.assignee || ANY}
            onValueChange={assignee => onChange({ assignee: assignee === ANY ? "" : assignee })}
          >
            <SelectTrigger aria-label="Assignee filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Anyone</SelectItem>
              <SelectItem value="me">Me</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {staff.filter(member => member.id !== me).map(member => (
                <SelectItem
                  key={member.id}
                  value={member.id}
                >
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Tag</p>
          <Input
            aria-label="Tag filter"
            placeholder="e.g. billing"
            maxLength={32}
            value={value.tag}
            onChange={e => onChange({ tag: e.target.value.trim().toLowerCase() })}
          />
        </div>
        {count > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => onChange({
              status: "", assignee: "", tag: "",
            })}
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
