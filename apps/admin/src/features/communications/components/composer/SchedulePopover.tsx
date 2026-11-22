import { Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";

type Props = {
  disabled: boolean;
  busy: boolean;
  onSchedule: (sendAtIso: string) => void;
};

function toLocalInput(date: Date) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(
    0,
    16,
  );
}

export function SchedulePopover({
  disabled, busy, onSchedule,
}: Props) {
  const [
    open,
    setOpen,
  ] = useState(false);
  const [
    value,
    setValue,
  ] = useState(() => toLocalInput(new Date(Date.now() + 60 * 60_000)));
  const earliest = toLocalInput(new Date(Date.now() + 2 * 60_000));
  const valid = value >= earliest;

  const submit = () => {
    onSchedule(new Date(value).toISOString());
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Schedule message"
          disabled={disabled}
        >
          <Clock className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 space-y-3"
        align="end"
      >
        <p className="text-sm font-medium">Send later</p>
        <Input
          type="datetime-local"
          aria-label="Send at"
          min={earliest}
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          It is sent only if the 24-hour window is still open at that time.
        </p>
        <Button
          size="sm"
          className="w-full"
          disabled={!valid}
          loading={busy}
          onClick={submit}
        >
          Schedule
        </Button>
      </PopoverContent>
    </Popover>
  );
}
