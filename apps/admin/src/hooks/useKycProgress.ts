import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { useKYCVerification } from "./useKYCVerification";

const REQUIRED_DOCUMENT_TYPES = [
  "certificate_of_incorporation",
  "memorandum_of_association",
  "tax_clearance",
  "business_license",
  "proof_of_address",
  "director_id",
];

const REQUIRED_FIELDS = [
  "company_name",
  "registration_number",
  "tax_id",
  "business_type",
  "address_line1",
  "city",
  "state",
  "phone",
  "email",
] as const;

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
 * Mirrors the same computation the OnboardingKYCStep displays so the
 * banner percentage stays in sync with the verification page.
 */
export function useKycProgress(): KycProgress {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId ?? null;
  const { isVerified, status, isLoading: kycLoading } = useKYCVerification();
  const [progress, setProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!tenantId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const [biRes, docsRes] = await Promise.all([
          supabase
            .from("tenant_business_info")
            .select("*")
            .eq("tenant_id", tenantId)
            .maybeSingle(),
          supabase
            .from("tenant_kyc_documents")
            .select("document_type")
            .eq("tenant_id", tenantId),
        ]);

        if (cancelled) return;

        const bi = (biRes.data ?? {}) as Record<string, unknown>;
        const docs = (docsRes.data ?? []) as Array<{ document_type: string }>;
        const businessStatus =
          typeof bi.verification_status === "string" ? bi.verification_status : null;

        const filledFields = REQUIRED_FIELDS.filter((k) => Boolean(bi[k])).length;
        const fieldPct = (filledFields / REQUIRED_FIELDS.length) * 50;

        const uploadedRequired = REQUIRED_DOCUMENT_TYPES.filter((t) =>
          docs.some((d) => d.document_type === t),
        ).length;
        const docPct = (uploadedRequired / REQUIRED_DOCUMENT_TYPES.length) * 50;

        setProgress(Math.round(fieldPct + docPct));
        setIsSubmitted(docs.length > 0);
        setLocalStatus(businessStatus);
      } catch (err) {
        console.error("Failed to load KYC progress", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const effectiveStatus = status ?? localStatus;
  const effectiveVerified =
    isVerified || effectiveStatus === "verified" || effectiveStatus === "approved";

  return {
    progress: effectiveVerified ? 100 : progress,
    isSubmitted,
    status: effectiveStatus,
    isVerified: effectiveVerified,
    isLoading: loading || kycLoading,
  };
}



