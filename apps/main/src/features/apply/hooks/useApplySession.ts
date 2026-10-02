import type { OnboardingApplication } from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";

import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingApplicationQueryOptions,
  getOnboardingToken,
  setOnboardingToken,
} from "@truckmoov/api/auth";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";
import { writeStoredCustomerType } from "@/features/apply/utils/applyTypes";

const APPLICATION_ID_KEY = "truckmoov_apply_application_id";

function readStoredId() {
  if (typeof window === "undefined")
    return null;
  // A stored id is only useful with its token — without it every call answers 404.
  const id = window.sessionStorage.getItem(APPLICATION_ID_KEY);
  return id && getOnboardingToken() ? id : null;
}

/**
 * A resume link (from "Save & Continue Later" or a request-changes email) lands on
 * `/apply` carrying the draft token and application id.
 *
 * The emails link to `/apply?token=<token>&applicationId=<id>`. The stage then decides the screen,
 * so an approved application lands on payment or installation.
 */
function adoptResumeLink() {
  if (typeof window === "undefined")
    return;
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const id = params.get("applicationId") ?? params.get("id");
  if (!token || !id)
    return;
  setOnboardingToken(token);
  window.sessionStorage.setItem(
    APPLICATION_ID_KEY,
    id,
  );
  // Keep the bearer-like token out of the address bar and history.
  window.history.replaceState(
    null,
    "",
    window.location.pathname,
  );
}

export type ApplySession = ReturnType<typeof useApplySession>;

/** The applicant's draft: its id + token, and the application itself. */
export function useApplySession() {
  const [
    applicationId,
    setApplicationId,
  ] = useState<string | null>(() => {
    adoptResumeLink();
    return readStoredId();
  });
  const [
    expired,
    setExpired,
  ] = useState(false);
  const query = useQuery({
    ...getOnboardingApplicationQueryOptions(applicationId ?? ""),
    enabled: Boolean(applicationId),
  });
  const application = query.data?.data;
  const resetDraft = useApplyDraftStore(state => state.reset);

  const start = useCallback(
    (id: string) => {
      window.sessionStorage.setItem(
        APPLICATION_ID_KEY,
        id,
      );
      setApplicationId(id);
      setExpired(false);
    },
    [],
  );

  const clear = useCallback(
    () => {
      window.sessionStorage.removeItem(APPLICATION_ID_KEY);
      window.sessionStorage.removeItem("truckmoov_apply_step");
      window.sessionStorage.removeItem("truckmoov_apply_details_draft");
      setOnboardingToken(null);
      writeStoredCustomerType(null);
      resetDraft();
      // After reset: reset's set() re-writes the persisted key, this drops it from localStorage.
      useApplyDraftStore.persist.clearStorage();
      setApplicationId(null);
    },
    [resetDraft],
  );

  // 404 = wrong/missing token or a draft that expired after 30 days idle. Start over.
  useEffect(
    () => {
      if ((query.error as ServerErrorResponse | null)?.statusCode !== 404)
        return;
      setExpired(true);
      clear();
    },
    [
      query.error,
      clear,
    ],
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
    refetch: query.refetch,
  };
}

export function isIndemnitySigned(application?: OnboardingApplication) {
  return Boolean(application?.documents.some(document => document.documentType === "signed_indemnity_form"));
}

export function requestedDeviceTotal(application?: OnboardingApplication) {
  return (application?.deviceRequests ?? []).reduce(
    (total, request) => total + request.quantity,
    0,
  );
}

/** Every non-vehicle document still missing, plus one row per vehicle short of a licence. */
export function documentsComplete(application?: OnboardingApplication) {
  if (!application)
    return false;
  const missing = application.missingDocuments.filter(type => type !== "signed_indemnity_form" && type !== "vehicle_license");
  return missing.length === 0 && application.vehiclesMissingDocuments.length === 0;
}
