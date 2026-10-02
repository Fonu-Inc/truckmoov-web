import type { MessagingConversation } from "@truckmoov/api/notification";
import { UserRound } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { useStaffDirectory } from "../useStaffDirectory";

type Props = {
  conversation: MessagingConversation;
  disabled: boolean;
  onAssign: (userId: string) => void;
};

export function AssigneeMenu({ conversation, disabled, onAssign }: Props) {
  const { staff, nameOf, me } = useStaffDirectory();
  const others = staff.filter(member => member.id !== me);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} aria-label="Assign conversation">
          <UserRound className="h-3.5 w-3.5" />
          {nameOf(conversation.assignee_user_id)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
        {me && <DropdownMenuItem onSelect={() => onAssign(me)}>Assign to me</DropdownMenuItem>}
        {conversation.assignee_user_id && <DropdownMenuItem onSelect={() => onAssign("")}>Unassign</DropdownMenuItem>}
        {others.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Teammates</DropdownMenuLabel>
            {others.map(member => (
              <DropdownMenuItem key={member.id} onSelect={() => onAssign(member.id)}>{member.name}</DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
