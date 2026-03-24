import { useEffect, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrganizationsSettingsQueryOptions } from '@/features/auth/api';
import { Branding } from '@/features/auth/api/types';
import { useBrandingStore } from '../store';
import { applyBrandingToDOM } from '../composables/applyBrandingToDOM';
import { useAuthStore, DEMO_ACCESS_TOKEN } from '@/stores/authStore';
import { BrandingContext } from "../contexts/branding";

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { branding, setBranding } = useBrandingStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = !!accessToken;
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  useEffect(() => {
    if (branding) applyBrandingToDOM(branding);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data } = useQuery({ ...getOrganizationsSettingsQueryOptions(), enabled: isAuthenticated && !isDemo });

  useEffect(() => {
    const b = data?.data?.branding;
    if (!b) return;
    applyBrandingToDOM(b);
    setBranding(b);
  }, [data, setBranding]);

  const applyBrandingColors = useCallback((b: Branding) => {
    applyBrandingToDOM(b);
    setBranding(b);
  }, [setBranding]);

  return (
    <BrandingContext.Provider value={{ applyBrandingColors }}>
      {children}
    </BrandingContext.Provider>
  );
}
