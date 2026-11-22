/**
 * The applicant's saved progress in this browser (localStorage), so coming back to /apply in a
 * new tab or days later offers to resume it (port of the landing page's `applyDraftStorage`).
 *
 * The application itself lives on the server. These keys only remember which application it
 * is, the screen, and the step 1 fields typed before the application exists. The draft token
 * is kept by `@truckmoov/api` (switched to localStorage below).
 */

import type { ApplicantCustomerType } from "@/features/apply/utils/applyTypes";

import {
  getOnboardingToken,
  setOnboardingToken,
  setOnboardingTokenStorage,
} from "@truckmoov/api/auth";

import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";

// The draft must outlive the tab; set before the first onboarding request.
setOnboardingTokenStorage("local");

const PREFIX = "truckmoov_apply_";

/** Bumped when the stored shape changes; an older draft is dropped rather than misread. */
const DRAFT_VERSION = "1";

const DRAFT_KEYS = {
  version: `${PREFIX}version`,
  applicationId: `${PREFIX}application_id`,
  customerType: `${PREFIX}customer_type`,
  step: `${PREFIX}step`,
  detailsDraft: `${PREFIX}details_draft`,
  savedAt: `${PREFIX}saved_at`,
} as const;

type DraftKey = keyof typeof DRAFT_KEYS;

/** The server drops a draft after 30 days without activity. */
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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
      DRAFT_KEYS.version,
      DRAFT_VERSION,
    );
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

/** Past the server's TTL, or written by an older version of this flow. */
export function isDraftStale() {
  const savedAt = Number(readDraft("savedAt"));
  if (!savedAt)
    return false;
  return readDraft("version") !== DRAFT_VERSION || Date.now() - savedAt > DRAFT_TTL_MS;
}

/** Anything worth resuming: a saved application, or a customer type / details typed before one. */
export function hasStoredDraft() {
  if (isDraftStale())
    return false;
  return Boolean(readStoredApplicationId() || readDraft("customerType") || readDraft("detailsDraft"));
}

/**
 * A resume link (request-changes or payment email) carries the draft token and application id:
 * `?token=<token>&applicationId=<id>`. Adopt them and take the token out of the address bar.
 */
export function adoptResumeLink() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const id = params.get("applicationId") ?? params.get("id");
  if (!token || !id)
    return false;
  setOnboardingToken(token);
  writeDraft(
    "applicationId",
    id,
  );
  for (const key of [
    "token",
    "applicationId",
    "id",
  ])
    params.delete(key);
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}`,
  );
  return true;
}

/** Everything is on the server once submitted: drop the step 1 draft and any unsent signature. */
export function clearSubmittedDraft() {
  writeDraft(
    "detailsDraft",
    null,
  );
  useApplyDraftStore.getState().setPendingSignature(null);
}

/** Forget the application in this browser: every `truckmoov_apply_*` key, the token and the draft store. */
export function clearApplyDraft() {
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
}
