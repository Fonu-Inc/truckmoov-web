import type { OnboardingApplication } from "@truckmoov/api/auth";
import type { OrganizationFormValues } from "./get-started-data";
import {
  APPLICANT_TYPE_TO_ROLE,
  normalizePhone,
} from "./get-started-data";

const APPLICATION_ID_KEY = "truckmoov_onboarding_application_id";

export const EMPTY_ORG_VALUES: OrganizationFormValues = {
  applicantType: undefined as unknown as OrganizationFormValues["applicantType"],
  organizationName: "",
  businessEmail: "",
  phone: "",
  contactName: "",
  address: "",
  city: "",
  state: undefined as unknown as OrganizationFormValues["state"],
};

export function getStoredApplicationId(): string | null {
  if (typeof window === "undefined")
    return null;
  return window.sessionStorage.getItem(APPLICATION_ID_KEY);
}

export function setStoredApplicationId(id: string | null) {
  if (typeof window === "undefined")
    return;
  if (id) {
    window.sessionStorage.setItem(
      APPLICATION_ID_KEY,
      id,
    );
  }
  else {
    window.sessionStorage.removeItem(APPLICATION_ID_KEY);
  }
}

export function applicationToOrgValues(app: OnboardingApplication): OrganizationFormValues {
  return {
    applicantType: app.applicantType,
    organizationName: app.organization.organizationName,
    businessEmail: app.organization.businessEmail,
    phone: app.organization.organizationPhone,
    contactName: app.contact.fullName,
    address: app.organization.streetAddress,
    city: app.organization.city,
    state: app.organization.state as OrganizationFormValues["state"],
  };
}

export function orgValuesToPayload(values: OrganizationFormValues) {
  return {
    applicantType: values.applicantType,
    organizationName: values.organizationName,
    businessEmail: values.businessEmail,
    organizationPhone: normalizePhone(values.phone),
    contactFullName: values.contactName,
    contactRole: APPLICANT_TYPE_TO_ROLE[values.applicantType],
    streetAddress: values.address,
    city: values.city,
    state: values.state as string,
  };
}

// The organization form and the OnboardingApplication use different field names.
// Server 400 errors reference the *server* field name — this table maps them
// back to the RHF field so setError lands on the right input.
export const SERVER_FIELD_TO_FORM_FIELD: Record<string, keyof OrganizationFormValues> = {
  applicantType: "applicantType",
  organizationName: "organizationName",
  businessEmail: "businessEmail",
  organizationPhone: "phone",
  contactFullName: "contactName",
  contactRole: "applicantType",
  streetAddress: "address",
  city: "city",
  state: "state",
};
