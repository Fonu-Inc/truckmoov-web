import type { ReactNode } from "react";
import { useContext } from "react";
import { createPortal } from "react-dom";
import {
  PageActionsContext,
  PageTitleContext,
} from "@/shared/components/layout/pageTitleContext";

/** Move page-level controls into the heading's action slot without changing their handlers. */
export function PageActions({
  children,
  className = "flex flex-wrap items-center justify-end gap-2",
}: {
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(PageActionsContext);
  const actions = <div className={className}>{children}</div>;
  return context?.target ? createPortal(
    actions,
    context.target,
  ) : actions;
}

type PageTitleProps = {
  title?: string;
  description?: string;
  primaryActions?: ReactNode;
};

/** Prominent page heading at the top-left of the content area. */
export function PageTitle({
  title,
  description,
  primaryActions,
}: PageTitleProps) {
  const ctx = useContext(PageTitleContext);
  const actions = useContext(PageActionsContext);
  const t = title ?? ctx.title;
  const d = description ?? (title ? undefined : ctx.description);
  return (
    <div
      className={`mb-6 flex min-w-0 flex-col gap-4 text-left lg:flex-row lg:justify-between ${primaryActions ? "lg:items-start" : "lg:items-center"}`}
      data-page-header
    >
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t}</h1>
        {d && <p className="mt-1.5 text-sm sm:text-base text-muted-foreground">{d}</p>}
      </div>
      {(actions || primaryActions) && (
        <div
          ref={actions?.setTarget}
          className="min-w-0 shrink-0 empty:hidden lg:max-w-[50%]"
          data-page-actions
        >
          {primaryActions}
        </div>
      )}
    </div>
  );
}
