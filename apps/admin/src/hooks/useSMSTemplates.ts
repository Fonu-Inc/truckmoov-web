import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export interface SMSTemplate {
  id: string;
  tenant_id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useSMSTemplates() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!tenantId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as SMSTemplate[]);
    } catch (err) {
      console.error('Error fetching SMS templates:', err);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (
    name: string,
    category: string,
    content: string
  ) => {
    if (!tenantId) return false;

    setIsSaving(true);
    try {
      // Extract variables from content
      const variableMatches = content.match(/\{\{(\w+)\}\}/g) || [];
      const variables = variableMatches.map(v => v.replace(/\{\{|\}\}/g, ''));

      const { error } = await supabase
        .from('sms_templates')
        .insert({
          tenant_id: tenantId,
          name,
          category,
          content,
          variables,
          is_active: true,
        });

      if (error) throw error;
      
      toast.success('Template created successfully');
      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('Error creating template:', err);
      toast.error('Failed to create template');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateTemplate = async (
    id: string,
    name: string,
    category: string,
    content: string
  ) => {
    if (!tenantId) return false;

    setIsSaving(true);
    try {
      const variableMatches = content.match(/\{\{(\w+)\}\}/g) || [];
      const variables = variableMatches.map(v => v.replace(/\{\{|\}\}/g, ''));

      const { error } = await supabase
        .from('sms_templates')
        .update({
          name,
          category,
          content,
          variables,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      toast.success('Template updated successfully');
      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('Error updating template:', err);
      toast.error('Failed to update template');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!tenantId) return;

    try {
      // Soft delete - just mark as inactive
      const { error } = await supabase
        .from('sms_templates')
        .update({ is_active: false })
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      toast.success('Template deleted');
      await fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error('Failed to delete template');
    }
  };

  const duplicateTemplate = async (template: SMSTemplate) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('sms_templates')
        .insert({
          tenant_id: tenantId,
          name: `${template.name} (Copy)`,
          category: template.category,
          content: template.content,
          variables: template.variables,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Template duplicated');
      await fetchTemplates();
    } catch (err) {
      console.error('Error duplicating template:', err);
      toast.error('Failed to duplicate template');
    }
  };

  return {
    templates,
    isLoading,
    isSaving,
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
}



