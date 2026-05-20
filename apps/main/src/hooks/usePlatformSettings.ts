import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FX_KEY = 'fx_usd_ngn';

export function useFxRate() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['platform-settings', FX_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value, updated_at')
        .eq('key', FX_KEY)
        .maybeSingle();
      if (error) throw error;
      const rate = Number((data?.value as any)?.rate ?? 1600);
      return { rate, updatedAt: data?.updated_at as string | undefined };
    },
    staleTime: 60_000,
  });

  const update = useMutation({
    mutationFn: async (rate: number) => {
      if (!Number.isFinite(rate) || rate <= 0) throw new Error('Rate must be a positive number');
      const { error } = await supabase
        .from('platform_settings')
        .upsert({ key: FX_KEY, value: { rate }, description: 'Exchange rate: 1 USD = X NGN. Used for plan pricing display.' }, { onConflict: 'key' });
      if (error) throw error;
      return rate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-settings', FX_KEY] });
      toast.success('Exchange rate updated');
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to update rate'),
  });

  return { rate: data?.rate ?? 1600, updatedAt: data?.updatedAt, isLoading, update };
}
