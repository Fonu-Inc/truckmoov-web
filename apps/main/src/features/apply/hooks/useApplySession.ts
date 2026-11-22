import type { OnboardingApplication } from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";

import { useQuery } from "@tanstack/react-query";
import { getOnboardingApplicationQueryOptions } from "@truckmoov/api/auth";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  adoptResumeLink,
  clearApplyDraft,
  isDraftStale,
  readStoredApplicationId,
  writeDraft,
} from "@/features/apply/utils/applyDraftStorage";
import { documentsForApplicant } from "@/features/apply/utils/applyTypes";

/** First render: adopt a resume link, and forget a draft that has outlived the server's. */
function initialSession() {
  const resumed = adoptResumeLink();
  if (isDraftStale()) {
    clearApplyDraft();
    return {
      id: null,
      expired: true,
      resumed,
    };
  }
  return {
    id: readStoredApplicationId(),
    expired: false,
    resumed,
  };
}

export type ApplySession = ReturnType<typeof useApplySession>;

/** The applicant's draft: its id + token (localStorage), and the application itself. */
export function useApplySession() {
  const [initial] = useState(initialSession);
  const [
    applicationId,
    setApplicationId,
  ] = useState<string | null>(initial.id);
  const [
    expired,
    setExpired,
  ] = useState(initial.expired);
  const query = useQuery({
    ...getOnboardingApplicationQueryOptions(applicationId ?? ""),
    enabled: Boolean(applicationId),
  });
  const application = query.data?.data;

  const start = useCallback(
    (id: string) => {
      writeDraft(
        "applicationId",
        id,
      );
      setApplicationId(id);
      setExpired(false);
    },
    [],
  );

  const clear = useCallback(
    () => {
      setApplicationId(null);
      clearApplyDraft();
    },
    [],
  );

  // 404 = wrong/missing token or a draft that expired after 30 days idle. Start over.
  const notFound = (query.error as ServerErrorResponse | null)?.statusCode === 404;
  useEffect(
    () => {
      if (!notFound)
        return;
      setExpired(true);
      clear();
    },
    [
      notFound,
      clear,
    ],
  );

  return {
    applicationId,
    application,
    /** The page was opened from an emailed resume link. */
    resumed: initial.resumed,
    /** True only while the first fetch of a stored draft is in flight. */
    isRestoring: Boolean(applicationId) && query.isLoading,
    /** The stored draft was gone (expired or a stale token) and has been cleared. */
    expired,
    start,
    clear,
  };
}

export function requestedDeviceTotal(application?: OnboardingApplication) {
  return (application?.deviceRequests ?? []).reduce(
    (total, request) => total + request.quantity,
    0,
  );
}

export function isIndemnitySigned(application?: OnboardingApplication) {
  return Boolean(application?.documents.some(document => document.documentType === "signed_indemnity_form"));
}

/** Every document the applicant owes (`documentsForApplicant`) is on file. */
export function documentsComplete(application: OnboardingApplication | undefined, returning: boolean) {
  if (!application)
    return false;
  return documentsForApplicant(
    application.applicantType,
    returning,
  )
    .every(required => application.documents.some(document => document.documentType === required.type));
}
