import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuthStore } from "@/stores/authStore";

type TenantBranding = any;

type TenantBrandingContextValue = {
  branding: TenantBranding | null;
  logoUrl: string | null;
  isCustomBranded: boolean;
};

const TenantBrandingContext = createContext<TenantBrandingContextValue>({
  branding: null,
  logoUrl: null,
  isCustomBranded: false,
});

export const useTenantBrandingContext = () => useContext(TenantBrandingContext);

function clearBrandingFromDOM() {
  const root = document.documentElement;
  const vars = [
    "--primary",
    "--accent",
    "--success",
    "--warning",
    "--destructive",
    "--sidebar-background",
    "--sidebar-foreground",
    "--sidebar-accent",
    "--ring",
    "--sidebar-ring",
    "--sidebar-primary",
  ];
  vars.forEach(v => root.style.removeProperty(v));
}

export function TenantBrandingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [
    branding,
    setBranding,
  ] = useState<TenantBranding | null>(null);

  const isPlatformAdmin = user?.role === "platform_admin";
  const tenantId = user?.tenantId || (!isPlatformAdmin ? "f7f5af88-fd76-4439-aae3-0461be52f63f" : null);

  const fetchBranding = useCallback(
    async () => {
      clearBrandingFromDOM();
      setBranding(null);
    },
    [
      tenantId,
      isPlatformAdmin,
    ],
  );

  useEffect(
    () => {
      fetchBranding();
      return () => clearBrandingFromDOM();
    },
    [fetchBranding],
  );

  return (
    <TenantBrandingContext.Provider
      value={{
        branding,
        logoUrl: branding?.logo_url || null,
        isCustomBranded: !!branding,
      }}
    >
      {children}
    </TenantBrandingContext.Provider>
  );
}
