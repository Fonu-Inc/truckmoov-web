import type { ReactNode } from "react";
import { Button } from "@/components/shadcn/button";

type Props = {
  icon?: ReactNode;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function StateNotice({
  icon, title, body, actionLabel, onAction,
}: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      {icon}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted-foreground">{body}</p>}
      {actionLabel && onAction && (
        <Button
          size="sm"
          variant="outline"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
