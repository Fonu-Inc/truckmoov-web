import type { MessagingConversationStatus } from "@truckmoov/api/notification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { STATUS_LABEL } from "../messagingLogic";

type Props = {
  value: MessagingConversationStatus;
  disabled: boolean;
  onChange: (status: MessagingConversationStatus) => void;
};

export function StatusSelect({ value, disabled, onChange }: Props) {
  return (
    <Select value={value} disabled={disabled} onValueChange={next => onChange(next as MessagingConversationStatus)}>
      <SelectTrigger className="h-8 w-[7.5rem] text-xs" aria-label="Conversation status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(STATUS_LABEL) as MessagingConversationStatus[]).map(status => (
          <SelectItem key={status} value={status}>{STATUS_LABEL[status]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
