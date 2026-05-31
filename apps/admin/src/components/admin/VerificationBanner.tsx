import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";

interface VerificationStatus {
  isLoading: boolean;
  isVerified: boolean;
  status: string | null;
  hasDocuments: boolean;
}

export function VerificationBanner() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    isLoading: true,
    isVerified: false,
    status: null,
    hasDocuments: false,
  });
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user?.tenantId) {
        setVerificationStatus({ isLoading: false, isVerified: false, status: null, hasDocuments: false });
        return;
      }

      try {
        // Fetch business info and KYC documents in parallel
        const [businessInfoResult, documentsResult] = await Promise.all([
          supabase
            .from("tenant_business_info")
            .select("verification_status")
            .eq("tenant_id", user.tenantId)
            .maybeSingle(),
          supabase
            .from("tenant_kyc_documents")
            .select("id")
            .eq("tenant_id", user.tenantId)
            .limit(1)
        ]);

        if (businessInfoResult.error) {
          console.error("Error fetching verification status:", businessInfoResult.error);
          setVerificationStatus({ isLoading: false, isVerified: false, status: null, hasDocuments: false });
          return;
        }

        const status = businessInfoResult.data?.verification_status || null;
        const isVerified = status === "verified";
        const hasDocuments = (documentsResult.data?.length ?? 0) > 0;
        
        setVerificationStatus({
          isLoading: false,
          isVerified,
          status,
          hasDocuments,
        });
      } catch (err) {
        console.error("Error checking verification:", err);
        setVerificationStatus({ isLoading: false, isVerified: false, status: null, hasDocuments: false });
      }
    };

    checkVerificationStatus();
  }, [user?.tenantId]);

  // Don't show banner if loading, verified, or dismissed
  if (verificationStatus.isLoading || verificationStatus.isVerified || isDismissed) {
    return null;
  }

  // Don't show if status is "pending" AND they have uploaded documents (actually submitted, waiting for review)
  // Also show "in progress" for "under_review" status
  if ((verificationStatus.status === "pending" && verificationStatus.hasDocuments) || 
      verificationStatus.status === "under_review") {
    return (
      <Alert variant="mtn" className="relative border-warning/30 bg-warning/5">
        <ShieldCheck className="h-5 w-5 text-warning" />
        <AlertTitle className="text-warning font-semibold">Verification In Progress</AlertTitle>
        <AlertDescription className="text-warning/90">
          Your business verification is being reviewed. You'll be notified once it's complete.
        </AlertDescription>
      </Alert>
    );
  }

  // Show "Complete Your Verification" for:
  // - status = "pending" with NO documents uploaded (not started)
  // - status = null (no business info record)

  return (
    <Alert variant="mtn" className="relative">
      <ShieldCheck className="h-5 w-5" />
      <AlertTitle className="font-semibold">Complete Your Verification</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Your account is pending until KYC verification is complete. Submit your business documents to activate your account and unlock all platform features.
        </span>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => navigate("/admin/settings")}
            className="whitespace-nowrap"
          >
            Start Verification
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}



