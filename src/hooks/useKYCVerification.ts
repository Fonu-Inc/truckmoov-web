import { useState, useEffect } from "react";
import { apiGet } from "@/lib/backendApi";
import { useAuthStore } from "@/stores/authStore";

export interface KYCVerificationStatus {
  isLoading: boolean;
  isVerified: boolean;
  status: 'pending' | 'under_review' | 'verified' | 'rejected' | null;
  tenantName?: string;
}

// Demo user IDs from authStore mockUsers
const DEMO_USER_IDS = ["pa1", "ta1", "om1", "s1", "dp1", "vf1", "d1"];

export function useKYCVerification(tenantId?: string) {
  const { user } = useAuthStore();
  const effectiveTenantId = tenantId || user?.tenantId || null;

  // Demo users are always considered KYC-verified
  const isDemoUser = user?.id ? DEMO_USER_IDS.includes(user.id) : false;

  const [verificationStatus, setVerificationStatus] = useState<KYCVerificationStatus>({
    isLoading: !isDemoUser,
    isVerified: isDemoUser,
    status: isDemoUser ? 'verified' : null,
    tenantName: isDemoUser ? 'Lagos Express Logistics' : undefined,
  });

  useEffect(() => {
    // Skip API call for demo users — they're always verified
    if (isDemoUser) {
      setVerificationStatus({
        isLoading: false,
        isVerified: true,
        status: 'verified',
        tenantName: 'Lagos Express Logistics',
      });
      return;
    }

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
  }, [effectiveTenantId, isDemoUser]);

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
