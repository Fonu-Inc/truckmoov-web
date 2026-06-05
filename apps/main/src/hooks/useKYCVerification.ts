import { useState, useEffect } from "react";
import { apiGet } from "@/lib/backendApi";
import { useAuthStore } from "@/stores/authStore";

export interface KYCVerificationStatus {
  isLoading: boolean;
  isVerified: boolean;
  status: 'pending' | 'under_review' | 'verified' | 'rejected' | null;
  tenantName?: string;
}

export function useKYCVerification(tenantId?: string) {
  const { user } = useAuthStore();
  const effectiveTenantId = tenantId || user?.tenantId || null;

  const [verificationStatus, setVerificationStatus] = useState<KYCVerificationStatus>({
    isLoading: true,
    isVerified: false,
    status: null,
    tenantName: undefined,
  });

  useEffect(() => {
    if (!effectiveTenantId) {
      setVerificationStatus({ isLoading: false, isVerified: false, status: null });
      return;
    }

    apiGet<{ verificationStatus: string; companyName?: string }>(
      `/tenants/${effectiveTenantId}/verification`
    )
      .then((data) => {
        const status = data?.verificationStatus as KYCVerificationStatus['status'] ?? null;
        setVerificationStatus({
          isLoading: false,
          isVerified: status === 'verified' || (status as string) === 'approved',
          status,
          tenantName: data?.companyName,
        });
      })
      .catch((err) => {
        console.error("Error checking verification:", err);
        setVerificationStatus({ isLoading: false, isVerified: false, status: null });
      });
  }, [effectiveTenantId]);

  return verificationStatus;
}

export function useTenantKYCStatus(tenantId: string) {
  const [status, setStatus] = useState<KYCVerificationStatus>({
    isLoading: true,
    isVerified: false,
    status: null,
  });

  useEffect(() => {
    if (!tenantId) {
      setStatus({ isLoading: false, isVerified: false, status: null });
      return;
    }

    apiGet<{ verificationStatus: string; companyName?: string }>(
      `/tenants/${tenantId}/verification`
    )
      .then((data) => {
        const verificationStatus = data?.verificationStatus as KYCVerificationStatus['status'] ?? null;
        setStatus({
          isLoading: false,
          isVerified: verificationStatus === 'verified' || (verificationStatus as string) === 'approved',
          status: verificationStatus,
          tenantName: data?.companyName,
        });
      })
      .catch((err) => {
        console.error("Error fetching tenant KYC status:", err);
        setStatus({ isLoading: false, isVerified: false, status: null });
      });
  }, [tenantId]);

  return status;
}
