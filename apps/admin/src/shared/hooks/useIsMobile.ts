import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * `true` when the viewport is narrower than the Tailwind `md` breakpoint.
 *
 * Returns `false` on the first render (SSR-safe and matches the desktop-default
 * layout), then flips on mount. Consumers relying on it should be idempotent
 * across a first-paint layout swap — the DashboardLayout / Sidebar / Header do
 * exactly one branch off this and are fine.
 */
export function useIsMobile() {
  const [
    isMobile,
    setIsMobile,
  ] = React.useState(false);

  React.useEffect(
    () => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      const onChange = () => setIsMobile(mql.matches);
      setIsMobile(mql.matches);
      mql.addEventListener(
        "change",
        onChange,
      );
      return () => mql.removeEventListener(
        "change",
        onChange,
      );
    },
    [],
  );

  return isMobile;
}
