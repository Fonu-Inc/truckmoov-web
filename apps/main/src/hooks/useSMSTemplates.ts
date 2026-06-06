import { useAuthStore } from '@/stores/authStore';

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

  return {
    templates: [] as SMSTemplate[],
    isLoading: false,
    isSaving: false,
    refetch: () => {},
    createTemplate: async (_name: string, _category: string, _content: string) => false,
    updateTemplate: async (_id: string, _name: string, _category: string, _content: string) => false,
    deleteTemplate: async (_id: string) => {},
    duplicateTemplate: async (_template: SMSTemplate) => {},
  };
}
