import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useKYCVerification } from "@/hooks/useKYCVerification";

import { SIMRequestSubmitData } from "@/components/sims/SIMRequestFormDialog";

export function useSIMRequestSubmit() {
  const { user } = useAuthStore();
  const kycStatus = useKYCVerification();
  const [isSubmitting] = useState(false);

  const submitRequest = async (_data: SIMRequestSubmitData): Promise<boolean> => {
    return false;
  };

  return { submitRequest, isSubmitting, canRequestSIM: kycStatus.isVerified, kycStatus };
}
