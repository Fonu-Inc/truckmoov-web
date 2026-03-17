import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrganizationsSettingsQueryOptions } from '@/features/auth/api';
import { Branding } from '@/features/auth/api/types';
import { useBrandingStore } from '../store';
import { applyBrandingToDOM } from '../composables/applyBrandingToDOM';
import { useAuthStore } from '@/stores/authStore';

interface BrandingContextValue {
  applyBrandingColors: (branding: Branding) => void;
}

const BrandingContext = createContext<BrandingContextValue>({ applyBrandingColors: () => {} });

export const useBrandingContext = () => useContext(BrandingContext);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { branding, setBranding } = useBrandingStore();
  const isAuthenticated = !!useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (branding) applyBrandingToDOM(branding);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data } = useQuery({ ...getOrganizationsSettingsQueryOptions(), enabled: isAuthenticated });
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
