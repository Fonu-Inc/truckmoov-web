import { useAuthStore } from '@/stores/authStore';
import { useKYCVerification } from './useKYCVerification';

export interface KycProgress {
  /** 0 - 100 completion of business info + required docs. */
  progress: number;
  /** Documents have been uploaded — i.e. KYC has been "submitted" for review. */
  isSubmitted: boolean;
  /** Backend status: pending / under_review / verified / rejected. */
  status: string | null;
  isVerified: boolean;
  isLoading: boolean;
}

/**
 * Aggregate KYC progress signal used by the persistent KycBanner.
 */
export function useKycProgress(): KycProgress {
  const { isVerified, status, isLoading: kycLoading } = useKYCVerification();

  return {
    progress: isVerified ? 100 : 0,
    isSubmitted: false,
    status: status ?? null,
    isVerified,
    isLoading: kycLoading,
  };
}
