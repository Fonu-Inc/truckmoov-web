import { useQuery } from "@tanstack/react-query";
import { getOrganizationSettingsQueryOptions } from "@truckmoov/api/auth";
import { useAuthStore } from "@truckmoov/api/lib/auth-store";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import {
  applyBrandingToDocument, clearBrandingFromDocument,
} from "./tokens";

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  // Branding is tenant data behind a bearer token. This provider sits above the
  // whole router, so on a public route (/auth, /apply) there is no session and
  // the request 401s — which the axios interceptor answers by hard-redirecting
  // to /auth, making those routes unreachable. Only ask once signed in.
  const accessToken = useAuthStore(state => state.accessToken);

  const { data } = useQuery({
    ...getOrganizationSettingsQueryOptions(),
    enabled: Boolean(accessToken),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const { resolvedTheme } = useTheme();

  useEffect(
    () => {
      const theme = resolvedTheme === "light" ? "light" : "dark";
      // ponytail: sidebar branding is a dark-mode-only surface — the light
      // sidebar has its own design tokens and inline `--sidebar-*` overrides
      // beat both `:root` and `.dark`, so in light mode we skip them.
      applyBrandingToDocument(
        data?.data?.branding,
        {
          theme,
          includeSidebar: theme === "dark",
        },
      );
      return () => clearBrandingFromDocument();
    },
    [
      data?.data?.branding,
      resolvedTheme,
    ],
  );

  return <>{children}</>;
}
