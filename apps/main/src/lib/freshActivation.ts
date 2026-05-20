/**
 * Fresh activation helper.
 *
 * When a user signs up via the "Activate" flow on /auth, we set a flag in
 * localStorage (`fleetpro_new_user`) via `useOnboardingStore.startActivation()`.
 * For UX simplicity that activation reuses the demo `ta1` account so the
 * frontend has data shapes to render — but a *fresh* user must NOT inherit
 * the demo bypasses (KYC verified, populated fleet data).
 *
 * `isFreshActivation()` returns true while the new-user flag is set. Completing
 * the guided onboarding screen must not restore demo bypasses or demo data;
 * the account stays fresh while KYC enforcement continues.
 * Hooks/components consult it
 * to:
 *   - skip the demo-user bypass on KYC verification
 *   - return empty datasets instead of seeded demo data
 *
 * The flag is cleared on logout/reset, not by clicking dashboard/quick access
 * navigation.
 */

const NEW_USER_KEY = "fleetpro_new_user";

export function isFreshActivation(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(NEW_USER_KEY) === "1";
  } catch {
    return false;
  }
}
