import { TD_CLASS } from "@/features/fleet/components/ui/violations/violationsUi";

/** Loading / error / empty row for the Violations tables. Returns null when there are rows to show. */
export function ViolationsTableState({
  colSpan,
  isLoading,
  isError,
  onRetry,
  isEmpty,
  emptyText,
}: {
  colSpan: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isEmpty: boolean;
  emptyText: string;
}) {
  if (!isLoading && !isError && !isEmpty)
    return null;
  return (
    <tr className="border-b">
      <td
        colSpan={colSpan}
        className={`${TD_CLASS} h-24 text-center text-sm text-muted-foreground`}
      >
        {isLoading
          ? "Loading violations..."
          : isError
            ? (
                <span className="inline-flex items-center gap-2">
                  Unable to load violations.
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={onRetry}
                  >
                    Retry
                  </button>
                </span>
              )
            : emptyText}
      </td>
    </tr>
  );
}
