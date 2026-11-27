import { Skeleton } from "@/components/shadcn/skeleton";

/** Shown while the first lazy route resolves; touches neither the auth store nor the router. */
export function RouteFallback() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto w-full max-w-5xl space-y-4 p-6"
    >
      <Skeleton className="h-9 w-48 rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
