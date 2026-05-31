import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

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
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const tenantId = user?.tenantId || 'f7f5af88-fd76-4439-aae3-0461be52f63f';

  const fetchBranding = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBranding(data as TenantBranding);
      } else {
        setBranding({ tenant_id: tenantId, ...DEFAULT_BRANDING });
      }
    } catch (error) {
      console.error('Error fetching tenant branding:', error);
      setBranding({ tenant_id: tenantId, ...DEFAULT_BRANDING });
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const saveBranding = async (updates: Partial<TenantBranding>) => {
    if (!branding) return;

    setIsSaving(true);
    const updatedBranding = { ...branding, ...updates };

    try {
      if (branding.id) {
        const { error } = await supabase
          .from('tenant_branding')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', branding.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('tenant_branding')
          .insert({
            tenant_id: tenantId,
            ...DEFAULT_BRANDING,
            ...updates,
          })
          .select()
          .single();
        if (error) throw error;
        if (data) updatedBranding.id = (data as any).id;
      }

      setBranding(updatedBranding);
      toast.success('Branding saved successfully');
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast.error('Failed to save branding', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${tenantId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo', { description: error.message });
      return null;
    }
  };

  const resetToDefaults = async () => {
    await saveBranding(DEFAULT_BRANDING);
  };

  return {
    branding,
    isLoading,
    isSaving,
    saveBranding,
    uploadLogo,
    resetToDefaults,
    DEFAULT_BRANDING,
  };
}



