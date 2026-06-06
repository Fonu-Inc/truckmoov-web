import { useAuthStore } from '@/stores/authStore';

export interface TenantBranding {
  id?: string;
  tenant_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  destructive_color: string;
  sidebar_bg_color: string;
  sidebar_text_color: string;
  sidebar_accent_color: string;
}

const DEFAULT_BRANDING: Omit<TenantBranding, 'tenant_id'> = {
  logo_url: null,
  primary_color: '#E6A817',
  secondary_color: '#1a1f2e',
  accent_color: '#cc9515',
  success_color: '#22956a',
  warning_color: '#d48a06',
  destructive_color: '#ef4444',
  sidebar_bg_color: '#141821',
  sidebar_text_color: '#e5e5e5',
  sidebar_accent_color: '#1f2937',
};

export function useTenantBranding() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || 'f7f5af88-fd76-4439-aae3-0461be52f63f';

  return {
    branding: null as TenantBranding | null,
    isLoading: false,
    isSaving: false,
    saveBranding: async (_updates: Partial<TenantBranding>) => {},
    uploadLogo: async (_file: File): Promise<string | null> => null,
    resetToDefaults: async () => {},
    DEFAULT_BRANDING,
  };
}
