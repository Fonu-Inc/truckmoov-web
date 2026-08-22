import { Truck } from "lucide-react";

interface MobileLogoProps {
  /** Eyebrow under the wordmark — "Enterprise Fleet" in the tenant app, "Platform Admin" in the admin app. */
  subtitle: string;
}

/**
 * The FleetPro lockup for narrow viewports. `lg:hidden` is the exact
 * complement of AuthBrandingPanel's `lg:flex` desktop column, so this shows
 * only when that column is hidden.
 *
 * `subtitle` is required rather than defaulted: a default would silently give
 * the tenant app's branding to any app that forgot to pass one.
 */
export function MobileLogo({ subtitle }: MobileLogoProps) {
  return (
    <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary shadow-mtn">
        <Truck className="h-6 w-6 text-primary-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-foreground">FleetPro</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-primary">{subtitle}</span>
      </div>
    </div>
  );
}
