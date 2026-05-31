import type { DemoStakeholderType } from "@/stores/authStore";
import type { UserRole } from "@/types";

/**
 * Role-based onboarding questionnaire definitions.
 *
 * Each stakeholder gets a tailored 3-step set of questions. Answers are
 * stored locally in the onboarding store and used to personalize the
 * dashboard experience (recommendations, default filters, sample data).
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

/* ---------------- Per-stakeholder catalogues ---------------- */

const ENTERPRISE: RoleQuestionnaire = {
  audience: "Enterprise Admin",
  steps: [
    {
      id: "company",
      title: "Tell us about your company",
      subtitle: "We'll tailor the dashboard to your operation.",
      questions: [
        {
          id: "industry",
          type: "single",
          prompt: "Which industry best describes your business?",
          required: true,
          options: [
            { id: "fmcg", label: "FMCG / Retail Distribution" },
            { id: "manufacturing", label: "Manufacturing" },
            { id: "oil-gas", label: "Oil & Gas" },
            { id: "ecommerce", label: "E-commerce" },
            { id: "agriculture", label: "Agriculture" },
            { id: "other", label: "Other" },
          ],
        },
        REGION,
      ],
    },
    {
      id: "logistics",
      title: "How do you move cargo?",
      subtitle: "This helps us pre-configure dispatch defaults.",
      questions: [
        {
          id: "carrier_model",
          type: "single",
          prompt: "Do you own trucks or rely on carriers?",
          required: true,
          options: [
            { id: "owned", label: "We own and operate our own fleet" },
            { id: "carriers", label: "We work with third-party carriers" },
            { id: "hybrid", label: "Hybrid — both owned & carriers" },
          ],
        },
        {
          id: "monthly_loads",
          type: "single",
          prompt: "Roughly how many loads do you ship per month?",
          options: [
            { id: "<100", label: "Under 100" },
            { id: "100-500", label: "100 – 500" },
            { id: "500-2000", label: "500 – 2,000" },
            { id: "2000+", label: "2,000+" },
          ],
        },
      ],
    },
    {
      id: "priorities",
      title: "What matters most right now?",
      subtitle: "Pick everything you'd like to track from day one.",
      questions: [
        {
          id: "priorities",
          type: "multi",
          prompt: "Select your top priorities",
          options: [
            { id: "ontime", label: "On-time delivery" },
            { id: "cost", label: "Logistics cost reduction" },
            { id: "visibility", label: "Real-time shipment visibility" },
            { id: "compliance", label: "Compliance & audit trail" },
            { id: "sustainability", label: "Sustainability / CO₂ tracking" },
          ],
        },
      ],
    },
  ],
};

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

const AGGREGATOR: RoleQuestionnaire = {
  audience: "Aggregator",
  steps: [
    {
      id: "network",
      title: "Tell us about your network",
      subtitle: "We'll set up the right tools for managing partners.",
      questions: [
        {
          id: "partner_count",
          type: "single",
          prompt: "How many fleet partners are in your network?",
          required: true,
          options: [
            { id: "1-5", label: "1 – 5 partners" },
            { id: "6-20", label: "6 – 20 partners" },
            { id: "20+", label: "20+ partners" },
          ],
        },
        REGION,
      ],
    },
    {
      id: "operations",
      title: "How do you coordinate jobs?",
      subtitle: "We'll personalize your dispatch flow.",
      questions: [
        {
          id: "matching_style",
          type: "single",
          prompt: "How do you match loads to fleet partners today?",
          required: true,
          options: [
            { id: "manual", label: "Manually via phone / WhatsApp" },
            { id: "spreadsheet", label: "Spreadsheets & email" },
            { id: "software", label: "Existing TMS / software" },
          ],
        },
        {
          id: "settlement_cycle",
          type: "single",
          prompt: "How often do you settle payments to partners?",
          options: [
            { id: "weekly", label: "Weekly" },
            { id: "biweekly", label: "Bi-weekly" },
            { id: "monthly", label: "Monthly" },
            { id: "per-trip", label: "Per trip" },
          ],
        },
      ],
    },
    {
      id: "growth",
      title: "What would help you grow?",
      subtitle: "We'll prioritize these features for you.",
      questions: [
        {
          id: "growth_focus",
          type: "multi",
          prompt: "Pick your top focus areas",
          options: [
            { id: "more-partners", label: "Onboard more fleet partners" },
            { id: "ai-matching", label: "AI-powered load matching" },
            { id: "settlements", label: "Faster, automated settlements" },
            { id: "sla", label: "Track partner SLA & performance" },
          ],
        },
      ],
    },
  ],
};

const OWNER_OPERATOR: RoleQuestionnaire = {
  audience: "Owner-Operator",
  steps: [
    {
      id: "trucks",
      title: "Tell us about your trucks",
      subtitle: "We'll get them set up for tracking and jobs.",
      questions: [
        {
          id: "truck_count",
          type: "single",
          prompt: "How many trucks do you own?",
          required: true,
          options: [
            { id: "1", label: "1 truck" },
            { id: "2-3", label: "2 – 3 trucks" },
            { id: "4-7", label: "4 – 7 trucks" },
          ],
        },
        {
          id: "primary_truck_type",
          type: "single",
          prompt: "What's your primary truck type?",
          required: true,
          options: [
            { id: "flatbed", label: "Flatbed" },
            { id: "container", label: "Container Truck" },
            { id: "tanker", label: "Tanker" },
            { id: "tipper", label: "Tipper / Dump" },
            { id: "box", label: "Box / Cargo Van" },
          ],
        },
      ],
    },
    {
      id: "work",
      title: "What kind of work do you do?",
      subtitle: "We'll surface jobs that match.",
      questions: [
        REGION,
        {
          id: "preferred_routes",
          type: "multi",
          prompt: "Preferred route types",
          options: [
            { id: "intra-city", label: "Intra-city deliveries" },
            { id: "interstate", label: "Interstate hauls" },
            { id: "long-haul", label: "Long-haul (1,000+ km)" },
            { id: "cross-border", label: "Cross-border" },
          ],
        },
      ],
    },
    {
      id: "preferences",
      title: "How would you like to receive jobs?",
      subtitle: "We'll send offers the way you prefer.",
      questions: [
        {
          id: "comm_channel",
          type: "single",
          prompt: "Preferred way to receive job offers",
          required: true,
          options: [
            { id: "whatsapp", label: "WhatsApp" },
            { id: "sms", label: "SMS" },
            { id: "voice", label: "Voice call" },
            { id: "in-app", label: "In-app notification only" },
          ],
        },
      ],
    },
  ],
};

const DEFAULT: RoleQuestionnaire = FLEET_PROVIDER;

/**
 * Resolve the appropriate questionnaire for the user.
 * Falls back to Fleet Provider if no stakeholder is detected.
 */
export function getRoleQuestionnaire(
  role: UserRole | undefined,
  stakeholder: DemoStakeholderType,
): RoleQuestionnaire {
  if (stakeholder === "ENTERPRISE") return ENTERPRISE;
  if (stakeholder === "AGGREGATOR") return AGGREGATOR;
  if (stakeholder === "OWNER_OPERATOR") return OWNER_OPERATOR;
  // Default for FLEET_PROVIDER, tenant_admin, operations_manager, dispatcher, etc.
  return FLEET_PROVIDER;
}



