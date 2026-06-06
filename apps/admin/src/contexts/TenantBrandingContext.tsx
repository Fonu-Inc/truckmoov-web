import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { TenantBranding } from '@/hooks/useTenantBranding';

interface TenantBrandingContextValue {
  branding: TenantBranding | null;
  logoUrl: string | null;
  isCustomBranded: boolean;
}

const TenantBrandingContext = createContext<TenantBrandingContextValue>({
  branding: null,
  logoUrl: null,
  isCustomBranded: false,
});

export const useTenantBrandingContext = () => useContext(TenantBrandingContext);

function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyBrandingToDOM(branding: TenantBranding) {
  const root = document.documentElement;

  const setVar = (name: string, hex: string) => {
    root.style.setProperty(name, hexToHSL(hex));
  };

  setVar('--primary', branding.primary_color);
  setVar('--accent', branding.accent_color);
  setVar('--success', branding.success_color);
  setVar('--warning', branding.warning_color);
  setVar('--destructive', branding.destructive_color);
  setVar('--sidebar-background', branding.sidebar_bg_color);
  setVar('--sidebar-foreground', branding.sidebar_text_color);
  setVar('--sidebar-accent', branding.sidebar_accent_color);

  // Update ring to match primary
  setVar('--ring', branding.primary_color);
  setVar('--sidebar-ring', branding.primary_color);
  setVar('--sidebar-primary', branding.primary_color);
}

function clearBrandingFromDOM() {
  const root = document.documentElement;
  const vars = [
    '--primary', '--accent', '--success', '--warning', '--destructive',
    '--sidebar-background', '--sidebar-foreground', '--sidebar-accent',
    '--ring', '--sidebar-ring', '--sidebar-primary',
  ];
  vars.forEach(v => root.style.removeProperty(v));
}

export function TenantBrandingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [branding, setBranding] = useState<TenantBranding | null>(null);

  const isPlatformAdmin = user?.role === 'platform_admin';
  const tenantId = user?.tenantId || (!isPlatformAdmin ? 'f7f5af88-fd76-4439-aae3-0461be52f63f' : null);

  const fetchBranding = useCallback(async () => {
    clearBrandingFromDOM();
    setBranding(null);
  }, [tenantId, isPlatformAdmin]);

  useEffect(() => {
    fetchBranding();
    return () => clearBrandingFromDOM();
  }, [fetchBranding]);

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



