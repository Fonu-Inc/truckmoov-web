/**
 * The applicant's saved progress in this browser (localStorage), so reopening the dialog
 * lands them back on the step they stopped at, in a new tab or days later.
 *
 * Saved progress itself lives on the server. These keys only remember which application
 * it is, the screen they were on, and the step 1 fields typed before the application
 * exists (there is nothing to save them to yet). The draft token is kept by
 * `@truckmoov/api` under `truckmoov_onboarding_token` (localStorage on the landing page,
 * see `setOnboardingTokenStorage` in GetStartedHost). Unsent files are in IndexedDB.
 */

import type { ApplicantCustomerType } from "@/features/get-started/utils/applyTypes";

import {
  getOnboardingToken,
  setOnboardingToken,
} from "@truckmoov/api/auth";

import { useApplyDraftStore } from "@/features/get-started/stores/applyDraftStore";
import { deleteDraftFiles } from "@/features/get-started/utils/draftFiles";

const PREFIX = "truckmoov_landing_apply_";

export const DRAFT_KEYS = {
  applicationId: `${PREFIX}application_id`,
  customerType: `${PREFIX}customer_type`,
  step: `${PREFIX}step`,
  detailsDraft: `${PREFIX}details_draft`,
  savedAt: `${PREFIX}saved_at`,
} as const;

type DraftKey = keyof typeof DRAFT_KEYS;

/** The server drops a draft after 30 days without activity; a local copy older than that is dead. */
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** localStorage throws when storage is blocked (private mode, disabled site data). */
function storage(): Storage | null {
  try {
    return window.localStorage;
  }
  catch {
    return null;
  }
}

export function readDraft(key: DraftKey) {
  try {
    return storage()?.getItem(DRAFT_KEYS[key]) ?? null;
  }
  catch {
    return null;
  }
}

/** Writes (or removes, for null) one key and marks the draft as touched now. */
export function writeDraft(key: DraftKey, value: string | null) {
  const store = storage();
  if (!store)
    return;
  try {
    if (value === null) {
      store.removeItem(DRAFT_KEYS[key]);
    }
    else {
      store.setItem(
        DRAFT_KEYS[key],
        value,
      );
    }
    store.setItem(
      DRAFT_KEYS.savedAt,
      String(Date.now()),
    );
  }
  catch {
    // Quota exceeded: progress still lives on the server; only the local hint is lost.
  }
}

export function readStoredCustomerType(): ApplicantCustomerType | null {
  const stored = readDraft("customerType");
  return stored === "enterprise" || stored === "owner_operator" ? stored : null;
}

/** A stored id is only useful with its token. Without it every call answers 404. */
export function readStoredApplicationId() {
  const id = readDraft("applicationId");
  return id && getOnboardingToken() ? id : null;
}

export function isDraftExpired() {
  const savedAt = Number(readDraft("savedAt"));
  return savedAt > 0 && Date.now() - savedAt > DRAFT_TTL_MS;
}

/** Anything worth resuming: a saved application, or a customer type / details typed before one. */
export function hasStoredDraft() {
  if (isDraftExpired())
    return false;
  return Boolean(readStoredApplicationId() || readDraft("customerType") || readDraft("detailsDraft"));
}

export function hasResumeParams() {
  const params = new URLSearchParams(window.location.search);
  return Boolean(params.get("token") && (params.get("applicationId") ?? params.get("id")));
}

/**
 * A resume link (from "Save & Continue Later" or a request-changes email) carries the draft
 * token and application id: `?token=<token>&applicationId=<id>`. Adopt them and take the
 * bearer-like token out of the address bar.
 */
export function adoptResumeLink() {
  if (!hasResumeParams())
    return false;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("applicationId") ?? params.get("id");
  // A link for another application must not inherit this one's signature, plan or devices.
  const storedId = readDraft("applicationId");
  if (storedId && storedId !== id)
    void clearApplyDraft();
  setOnboardingToken(params.get("token"));
  writeDraft(
    "applicationId",
    id,
  );
  for (const key of [
    "token",
    "applicationId",
    "id",
  ]) {
    params.delete(key);
  }
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}`,
  );
  return true;
}

/** Everything is on the server once submitted: drop the step 1 draft and any unsent files. */
export async function clearSubmittedDraft() {
  writeDraft(
    "detailsDraft",
    null,
  );
  useApplyDraftStore.getState().setPendingSignature(null);
  await deleteDraftFiles();
}

/**
 * Forget the application in this browser: every `truckmoov_landing_apply_*` key, the draft
 * token, the persisted draft store and the IndexedDB files. Used when the flow is finished
 * (installation booked, sign in), when the applicant starts over, and when the draft has
 * expired or its token stopped working.
 */
export async function clearApplyDraft() {
  const store = storage();
  if (store) {
    try {
      Object.keys(store)
        .filter(key => key.startsWith(PREFIX))
        .forEach(key => store.removeItem(key));
    }
    catch {
      // Blocked storage has nothing to clear.
    }
  }
  setOnboardingToken(null);
  useApplyDraftStore.getState().reset();
  // After reset: reset's set() re-writes the persisted key; this drops it.
  useApplyDraftStore.persist.clearStorage();
  await deleteDraftFiles();
}
