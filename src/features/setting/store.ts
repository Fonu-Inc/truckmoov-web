import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Branding } from '@/features/auth/api/types';

interface BrandingStore {
  branding: Branding | null;
  setBranding: (branding: Branding) => void;
  clearBranding: () => void;
}

export const useBrandingStore = create<BrandingStore>()(
  persist(
    (set) => ({
      branding: null,
      setBranding: (branding) => set({ branding }),
      clearBranding: () => set({ branding: null }),
    }),
    { name: 'truckmoov_branding' }
  )
);
