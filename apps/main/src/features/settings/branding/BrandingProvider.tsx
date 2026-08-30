import { useQuery } from "@tanstack/react-query";
import { getOrganizationSettingsQueryOptions } from "@truckmoov/api/auth";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { applyBrandingToDocument, clearBrandingFromDocument } from "./tokens";

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    ...getOrganizationSettingsQueryOptions(),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // ponytail: sidebar branding is a dark-mode-only surface — the light
    // sidebar has its own design tokens and inline `--sidebar-*` overrides
    // beat both `:root` and `.dark`, so in light mode we skip them.
    applyBrandingToDocument(data?.data?.branding, { includeSidebar: resolvedTheme === "dark" });
    return () => clearBrandingFromDocument();
  }, [data?.data?.branding, resolvedTheme]);

  return <>{children}</>;
}
