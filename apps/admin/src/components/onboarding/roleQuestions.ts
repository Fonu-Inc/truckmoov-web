import type { UserRole } from "@/types";

/**
 * Role-based onboarding questionnaire definitions.
 */

export type QuestionType = "single" | "multi" | "text" | "number";

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
}

export interface OnboardingQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  helper?: string;
  required?: boolean;
  options?: QuestionOption[];
  placeholder?: string;
}

export interface QuestionStep {
  id: string;
  title: string;
  subtitle: string;
  questions: OnboardingQuestion[];
}

export interface RoleQuestionnaire {
  /** Stakeholder/role headline shown in the modal header. */
  audience: string;
  steps: QuestionStep[];
}

/* ---------------- Reusable building blocks ---------------- */

const FLEET_SIZE: OnboardingQuestion = {
  id: "fleet_size",
  type: "single",
  prompt: "How large is your fleet today?",
  required: true,
  options: [
    { id: "1-10", label: "1 – 10 vehicles" },
    { id: "11-50", label: "11 – 50 vehicles" },
    { id: "51-200", label: "51 – 200 vehicles" },
    { id: "200+", label: "200+ vehicles" },
  ],
};

const REGION: OnboardingQuestion = {
  id: "region",
  type: "single",
  prompt: "Where do you primarily operate?",
  required: true,
  options: [
    { id: "lagos", label: "Lagos" },
    { id: "abuja", label: "Abuja / FCT" },
    { id: "port-harcourt", label: "Port Harcourt" },
    { id: "national", label: "Nationwide" },
    { id: "west-africa", label: "Cross-border (West Africa)" },
  ],
};

/* ---------------- Fleet Provider questionnaire ---------------- */

const FLEET_PROVIDER: RoleQuestionnaire = {
  audience: "Fleet Provider",
  steps: [
    {
      id: "fleet",
      title: "Set up your fleet profile",
      subtitle: "We'll match you to compatible cargo owners.",
      questions: [FLEET_SIZE, REGION],
    },
    {
      id: "vehicles",
      title: "What kind of trucks do you operate?",
      subtitle: "Pick all that apply — we'll surface jobs that fit.",
      questions: [
        {
          id: "vehicle_types",
          type: "multi",
          prompt: "Vehicle types in your fleet",
          required: true,
          options: [
            { id: "flatbed", label: "Flatbed" },
            { id: "container", label: "Container Truck" },
            { id: "tanker", label: "Fuel / Liquid Tanker" },
            { id: "refrigerated", label: "Refrigerated (Reefer)" },
            { id: "tipper", label: "Tipper / Dump" },
            { id: "box", label: "Box / Cargo Van" },
          ],
        },
        {
          id: "tracking_devices",
          type: "single",
          prompt: "Do your vehicles already have GPS trackers?",
          options: [
            { id: "all", label: "Yes — all vehicles" },
            { id: "some", label: "Some vehicles" },
            { id: "none", label: "No — we'll need devices" },
          ],
        },
      ],
    },
    {
      id: "goals",
      title: "What's your goal for the next 90 days?",
      subtitle: "We'll surface the right tools first.",
      questions: [
        {
          id: "goals",
          type: "multi",
          prompt: "Choose any that apply",
          options: [
            { id: "more-jobs", label: "Win more dispatch jobs" },
            { id: "cut-fuel", label: "Reduce fuel costs" },
            { id: "driver-safety", label: "Improve driver safety" },
            { id: "automation", label: "Automate manual paperwork" },
            { id: "scale", label: "Scale fleet size" },
          ],
        },
      ],
    },
  ],
};

/**
 * Resolve the appropriate questionnaire for the user.
 */
export function getRoleQuestionnaire(
  role: UserRole | undefined,
): RoleQuestionnaire {
  return FLEET_PROVIDER;
}
