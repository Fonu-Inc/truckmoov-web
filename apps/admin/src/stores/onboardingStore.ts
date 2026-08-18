import { create } from "zustand";

/**
 * Frontend-only onboarding state for the persistent guided action panel.
 *
 * The panel is a non-blocking overlay that lists suggested first actions.
 * - Visible to new users for ~3 days after activation
 * - If the user explicitly skips, it stays hidden for 24 hours then returns
 * - Clicking an action navigates the user but does NOT permanently dismiss
 *   the panel — it stays available so users always see "what's next"
 */

const NEW_USER_KEY = "fleetpro_new_user";
const ACTIVATED_AT_KEY = "fleetpro_activated_at";
const ONBOARDING_DONE_KEY = "fleetpro_onboarding_done";
const SKIPPED_UNTIL_KEY = "fleetpro_skipped_until";
const WELCOME_SEEN_KEY = "fleetpro_welcome_seen";
const PANEL_COLLAPSED_KEY = "fleetpro_panel_collapsed";
const COMPLETED_ACTIONS_KEY = "fleetpro_completed_actions";
const SUB_MODAL_OPEN_KEY = "fleetpro_sub_modal_open";
const PLAN_KEY = "fleetpro_selected_plan";
const QUESTIONNAIRE_DONE_KEY = "fleetpro_questionnaire_done";
const QUESTIONNAIRE_ANSWERS_KEY = "fleetpro_questionnaire_answers";
/** Mocked "registered emails that already have a password set". */
const KNOWN_EMAILS_KEY = "fleetpro_known_emails";

/** Persistent (localStorage) so the 3-day window survives reloads. */
const PERSISTENT_KEYS = new Set<string>([
  NEW_USER_KEY,
  ACTIVATED_AT_KEY,
  ONBOARDING_DONE_KEY,
  SKIPPED_UNTIL_KEY,
  // WELCOME_SEEN must be persistent: once dismissed it should never re-appear
  // for the same activation, even after navigation, reload, or new tab.
  WELCOME_SEEN_KEY,
  COMPLETED_ACTIONS_KEY,
  PLAN_KEY,
  KNOWN_EMAILS_KEY,
  QUESTIONNAIRE_DONE_KEY,
  QUESTIONNAIRE_ANSWERS_KEY,
]);

const ONBOARDING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const SKIP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function storage(key: string): Storage | null {
  try {
    if (typeof window === "undefined")
      return null;
    return PERSISTENT_KEYS.has(key) ? window.localStorage : window.sessionStorage;
  }
  catch {
    return null;
  }
}

function readBool(key: string): boolean {
  const s = storage(key);
  return s?.getItem(key) === "1";
}

function writeBool(key: string, value: boolean) {
  const s = storage(key);
  if (!s)
    return;
  if (value) {
    s.setItem(
      key,
      "1",
    );
  }
  else {
    s.removeItem(key);
  }
}

function readString(key: string): string | null {
  return storage(key)?.getItem(key) ?? null;
}

function writeString(key: string, value: string | null) {
  const s = storage(key);
  if (!s)
    return;
  if (value) {
    s.setItem(
      key,
      value,
    );
  }
  else {
    s.removeItem(key);
  }
}

function readNumber(key: string): number | null {
  const v = readString(key);
  if (!v)
    return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function readStringSet(key: string): string[] {
  try {
    const raw = readString(key);
    if (!raw)
      return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(v => typeof v === "string") : [];
  }
  catch {
    return [];
  }
}

function writeStringSet(key: string, value: string[]) {
  const s = storage(key);
  if (!s)
    return;
  s.setItem(
    key,
    JSON.stringify(value),
  );
}

/** Public helpers — exported so AuthPage can detect new vs existing user. */
export function isKnownEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized)
    return false;
  return readStringSet(KNOWN_EMAILS_KEY).includes(normalized);
}

export function registerKnownEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized)
    return;
  const current = readStringSet(KNOWN_EMAILS_KEY);
  if (!current.includes(normalized)) {
    current.push(normalized);
    writeStringSet(
      KNOWN_EMAILS_KEY,
      current,
    );
  }
}

/**
 * Heuristic stakeholder detection from email — for the demo flow.
 */
export type DetectedStakeholder
  = | {
    type: "ENTERPRISE";
    label: "Enterprise Admin";
  }
  | {
    type: "FLEET_PROVIDER";
    label: "Fleet Provider";
  }
  | {
    type: "AGGREGATOR";
    label: "Aggregator";
  }
  | {
    type: "OWNER_OPERATOR";
    label: "Owner Operator";
  }
  | {
    type: "PLATFORM_ADMIN";
    label: "Platform Admin";
  };

export function detectStakeholderFromEmail(email: string): DetectedStakeholder | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@"))
    return null;
  const [
    local,
    domain = "",
  ] = normalized.split("@");
  const haystack = `${local} ${domain}`;

  if (/(platform|admin@truckmoov|superadmin)/.test(haystack)) {
    return {
      type: "PLATFORM_ADMIN",
      label: "Platform Admin",
    };
  }
  if (/(aggregator|network|broker)/.test(haystack)) {
    return {
      type: "AGGREGATOR",
      label: "Aggregator",
    };
  }
  if (/(owner|operator|driver-owner|oo\b)/.test(haystack)) {
    return {
      type: "OWNER_OPERATOR",
      label: "Owner Operator",
    };
  }
  if (/(fleet|provider|carrier|logistics|transport)/.test(haystack)) {
    return {
      type: "FLEET_PROVIDER",
      label: "Fleet Provider",
    };
  }
  return {
    type: "ENTERPRISE",
    label: "Enterprise Admin",
  };
}

/** True when the panel should be visible right now based on time + skip rules. */
function computePanelVisible(): boolean {
  if (!readBool(NEW_USER_KEY))
    return false;
  if (readBool(ONBOARDING_DONE_KEY))
    return false;

  const activatedAt = readNumber(ACTIVATED_AT_KEY);
  if (activatedAt && Date.now() - activatedAt > ONBOARDING_WINDOW_MS) {
    return false; // 3-day window expired
  }

  const skippedUntil = readNumber(SKIPPED_UNTIL_KEY);
  if (skippedUntil && Date.now() < skippedUntil) {
    return false; // still in skip cool-down
  }

  return true;
}

type OnboardingState = {
  isNewUser: boolean;
  onboardingDone: boolean;
  /** Welcome modal visible right now. */
  showWelcome: boolean;
  /** Role-based questionnaire modal visible right now. */
  showQuestionnaire: boolean;
  /** Questionnaire has been completed (or explicitly skipped via Finish). */
  questionnaireDone: boolean;
  /** Persistent action panel visible right now. */
  showPanel: boolean;
  /** User collapsed the panel to a small floating launcher. */
  panelCollapsed: boolean;
  /** Subscription modal open. */
  showSubscriptionModal: boolean;
  /** IDs of action groups the user has completed. */
  completedSteps: string[];
  /** IDs of individual actions the user has clicked at least once. */
  clickedActions: string[];
  selectedPlan: string | null;
  /** Saved answers from the role-based questionnaire. */
  questionnaireAnswers: Record<string, string | string[]>;

  /** Called after first-time password creation. Queues Welcome modal. */
  startActivation: () => void;
  /** Welcome → Get Started: opens the role questionnaire (or panel if already done). */
  openChecklist: () => void;
  /** Close welcome without opening the panel. */
  dismissWelcome: () => void;
  /** Hide panel for 24h. */
  skipOnboarding: () => void;
  /** Reopen / expand the panel. */
  resumeOnboarding: () => void;
  /** Collapse to floating launcher (panel still available). */
  collapsePanel: () => void;
  /** Expand from collapsed launcher. */
  expandPanel: () => void;
  /** Mark an action group complete (e.g. all required actions inside finished). */
  completeStep: (groupId: string) => void;
  /** Record that the user clicked a specific action button. */
  markActionClicked: (actionId: string) => void;
  /** Mark all done. */
  completeOnboarding: () => void;
  setShowSubscriptionModal: (open: boolean) => void;
  setSelectedPlan: (planId: string | null) => void;
  /** Save partial / final answers from the questionnaire. */
  setQuestionnaireAnswers: (answers: Record<string, string | string[]>) => void;
  /** Mark questionnaire complete and advance to the action panel. */
  completeQuestionnaire: () => void;
  /** Re-evaluate visibility (e.g. after time passes / on focus). */
  refreshVisibility: () => void;
  /** Wipe everything — call on logout. */
  reset: () => void;
};

function readJsonObject(key: string): Record<string, string | string[]> {
  try {
    const raw = readString(key);
    if (!raw)
      return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  }
  catch {
    return {};
  }
}

function writeJsonObject(key: string, value: Record<string, string | string[]>) {
  const s = storage(key);
  if (!s)
    return;
  s.setItem(
    key,
    JSON.stringify(value),
  );
}

export const useOnboardingStore = create<OnboardingState>(set => ({
  isNewUser: readBool(NEW_USER_KEY),
  onboardingDone: readBool(ONBOARDING_DONE_KEY),
  showWelcome:
    readBool(NEW_USER_KEY)
    && !readBool(WELCOME_SEEN_KEY)
    && !readBool(ONBOARDING_DONE_KEY),
  showQuestionnaire: false,
  questionnaireDone: readBool(QUESTIONNAIRE_DONE_KEY),
  showPanel:
    computePanelVisible()
    && readBool(WELCOME_SEEN_KEY)
    && readBool(QUESTIONNAIRE_DONE_KEY),
  panelCollapsed: readBool(PANEL_COLLAPSED_KEY),
  showSubscriptionModal: readBool(SUB_MODAL_OPEN_KEY),
  completedSteps: readStringSet(COMPLETED_ACTIONS_KEY),
  clickedActions: [],
  selectedPlan: readString(PLAN_KEY),
  questionnaireAnswers: readJsonObject(QUESTIONNAIRE_ANSWERS_KEY),

  startActivation: () => {
    const now = Date.now();
    writeBool(
      NEW_USER_KEY,
      true,
    );
    writeString(
      ACTIVATED_AT_KEY,
      String(now),
    );
    writeBool(
      ONBOARDING_DONE_KEY,
      false,
    );
    writeString(
      SKIPPED_UNTIL_KEY,
      null,
    );
    writeBool(
      WELCOME_SEEN_KEY,
      false,
    );
    writeBool(
      PANEL_COLLAPSED_KEY,
      false,
    );
    writeBool(
      QUESTIONNAIRE_DONE_KEY,
      false,
    );
    writeJsonObject(
      QUESTIONNAIRE_ANSWERS_KEY,
      {},
    );
    writeStringSet(
      COMPLETED_ACTIONS_KEY,
      [],
    );
    // Clear any leftover plan selection from a previous demo session.
    writeString(
      PLAN_KEY,
      null,
    );
    set({
      isNewUser: true,
      onboardingDone: false,
      showWelcome: true,
      showQuestionnaire: false,
      questionnaireDone: false,
      questionnaireAnswers: {},
      showPanel: false,
      panelCollapsed: false,
      completedSteps: [],
      clickedActions: [],
      selectedPlan: null,
    });
  },
  openChecklist: () => {
    writeBool(
      WELCOME_SEEN_KEY,
      true,
    );
    writeString(
      SKIPPED_UNTIL_KEY,
      null,
    );
    writeBool(
      PANEL_COLLAPSED_KEY,
      false,
    );
    const qDone = readBool(QUESTIONNAIRE_DONE_KEY);
    set({
      showWelcome: false,
      // Show questionnaire first if not yet done; otherwise jump to action panel.
      showQuestionnaire: !qDone,
      showPanel: qDone ? computePanelVisible() : false,
      panelCollapsed: false,
    });
  },
  dismissWelcome: () => {
    writeBool(
      WELCOME_SEEN_KEY,
      true,
    );
    set({
      showWelcome: false,
      showPanel: computePanelVisible() && readBool(QUESTIONNAIRE_DONE_KEY),
    });
  },
  skipOnboarding: () => {
    const until = Date.now() + SKIP_WINDOW_MS;
    writeBool(
      WELCOME_SEEN_KEY,
      true,
    );
    writeString(
      SKIPPED_UNTIL_KEY,
      String(until),
    );
    writeBool(
      PANEL_COLLAPSED_KEY,
      false,
    );
    set({
      showWelcome: false,
      showQuestionnaire: false,
      showPanel: false,
      panelCollapsed: false,
    });
  },
  resumeOnboarding: () => {
    writeBool(
      WELCOME_SEEN_KEY,
      true,
    );
    writeString(
      SKIPPED_UNTIL_KEY,
      null,
    );
    writeBool(
      PANEL_COLLAPSED_KEY,
      false,
    );
    const qDone = readBool(QUESTIONNAIRE_DONE_KEY);
    set({
      showWelcome: false,
      showQuestionnaire: !qDone,
      showPanel: qDone ? computePanelVisible() : false,
      panelCollapsed: false,
    });
  },
  collapsePanel: () => {
    writeBool(
      PANEL_COLLAPSED_KEY,
      true,
    );
    set({ panelCollapsed: true });
  },
  expandPanel: () => {
    writeBool(
      PANEL_COLLAPSED_KEY,
      false,
    );
    set({ panelCollapsed: false });
  },
  completeStep: groupId =>
    set((state) => {
      if (state.completedSteps.includes(groupId))
        return state;
      const next = [
        ...state.completedSteps,
        groupId,
      ];
      writeStringSet(
        COMPLETED_ACTIONS_KEY,
        next,
      );
      return { completedSteps: next };
    }),
  markActionClicked: actionId =>
    set((state) => {
      if (state.clickedActions.includes(actionId))
        return state;
      return {
        clickedActions: [
          ...state.clickedActions,
          actionId,
        ],
      };
    }),
  completeOnboarding: () => {
    writeBool(
      ONBOARDING_DONE_KEY,
      true,
    );
    writeString(
      SKIPPED_UNTIL_KEY,
      null,
    );
    writeBool(
      PANEL_COLLAPSED_KEY,
      false,
    );
    set({
      onboardingDone: true,
      showPanel: false,
      showWelcome: false,
      showQuestionnaire: false,
      panelCollapsed: false,
    });
  },
  setShowSubscriptionModal: (open) => {
    writeBool(
      SUB_MODAL_OPEN_KEY,
      open,
    );
    set({ showSubscriptionModal: open });
  },
  setSelectedPlan: (planId) => {
    writeString(
      PLAN_KEY,
      planId,
    );
    set({ selectedPlan: planId });
  },
  setQuestionnaireAnswers: (answers) => {
    writeJsonObject(
      QUESTIONNAIRE_ANSWERS_KEY,
      answers,
    );
    set({ questionnaireAnswers: answers });
  },
  completeQuestionnaire: () => {
    writeBool(
      QUESTIONNAIRE_DONE_KEY,
      true,
    );
    set({
      questionnaireDone: true,
      showQuestionnaire: false,
      showPanel: computePanelVisible(),
    });
  },
  refreshVisibility: () => {
    set({
      showPanel:
        computePanelVisible()
        && readBool(WELCOME_SEEN_KEY)
        && readBool(QUESTIONNAIRE_DONE_KEY),
    });
  },
  reset: () => {
    writeBool(
      NEW_USER_KEY,
      false,
    );
    writeString(
      ACTIVATED_AT_KEY,
      null,
    );
    writeBool(
      ONBOARDING_DONE_KEY,
      false,
    );
    writeString(
      SKIPPED_UNTIL_KEY,
      null,
    );
    writeBool(
      WELCOME_SEEN_KEY,
      false,
    );
    writeBool(
      PANEL_COLLAPSED_KEY,
      false,
    );
    writeBool(
      SUB_MODAL_OPEN_KEY,
      false,
    );
    writeBool(
      QUESTIONNAIRE_DONE_KEY,
      false,
    );
    writeJsonObject(
      QUESTIONNAIRE_ANSWERS_KEY,
      {},
    );
    writeStringSet(
      COMPLETED_ACTIONS_KEY,
      [],
    );
    writeString(
      PLAN_KEY,
      null,
    );
    set({
      isNewUser: false,
      onboardingDone: false,
      showWelcome: false,
      showQuestionnaire: false,
      questionnaireDone: false,
      questionnaireAnswers: {},
      showPanel: false,
      panelCollapsed: false,
      showSubscriptionModal: false,
      completedSteps: [],
      clickedActions: [],
      selectedPlan: null,
    });
  },
}));
