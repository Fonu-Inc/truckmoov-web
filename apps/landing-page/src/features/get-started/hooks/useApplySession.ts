"use client";

import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingApplicationQueryOptions } from "@truckmoov/api/auth";
import {
  useEffect,
  useState,
} from "react";
import { useApplyDraftStore } from "@/features/get-started/stores/applyDraftStore";
import {
  adoptResumeLink,
  clearApplyDraft,
  isDraftExpired,
  readStoredApplicationId,
  writeDraft,
} from "@/features/get-started/utils/applyDraftStorage";

/** First visit of this mount: adopt a resume link, and forget a draft that has outlived the server's. */
function initialSession() {
  adoptResumeLink();
  if (isDraftExpired()) {
    // The localStorage part of clearing runs synchronously, so nothing reads the stale draft.
    void clearApplyDraft();
    return {
      id: null,
      expired: true,
    };
  }
  return {
    id: readStoredApplicationId(),
    expired: false,
  };
}

export type ApplySession = ReturnType<typeof useApplySession>;

/**
 * The applicant's draft: its id + token, and the application itself (landing port of the
 * main app's `useApplySession`, backed by localStorage instead of sessionStorage).
 */
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

  // A signature drawn on an earlier visit, before the application existed.
  useEffect(
    () => {
      void useApplyDraftStore.getState().restorePendingSignature();
    },
    [],
  );

  function start(id: string) {
    writeDraft(
      "applicationId",
      id,
    );
    setApplicationId(id);
    setExpired(false);
  }

  async function clear() {
    setApplicationId(null);
    await clearApplyDraft();
  }

  // 404 = wrong/missing token or a draft that expired after 30 days idle. Start over.
  const notFound = (query.error as ServerErrorResponse | null)?.statusCode === 404;
  useEffect(
    () => {
      if (!notFound)
        return;
      setExpired(true);
      setApplicationId(null);
      void clearApplyDraft();
    },
    [notFound],
  );

  return {
    applicationId,
    application,
    /** True only while the first fetch of a stored draft is in flight. */
    isRestoring: Boolean(applicationId) && query.isLoading,
    /** The stored draft was gone (expired or a stale token) and has been cleared. */
    expired,
    start,
    clear,
  };
}
