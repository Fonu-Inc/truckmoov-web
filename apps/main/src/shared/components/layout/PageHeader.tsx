import type { ReactNode } from "react";

/**
 * The design app's in-page heading: title + description on the left, page
 * actions on the right. Pair it with `manualTitle: true` on the route's
 * sidebarNav entry so the top bar doesn't repeat the title.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className="mb-6 flex min-w-0 flex-col gap-4 text-left lg:flex-row lg:justify-between lg:items-center"
      data-page-header
    >
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
        {description && <p className="mt-1.5 text-sm sm:text-base text-muted-foreground">{description}</p>}
      </div>
      <div
        className="min-w-0 shrink-0 empty:hidden lg:max-w-[50%]"
        data-page-actions
      >
        {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}
