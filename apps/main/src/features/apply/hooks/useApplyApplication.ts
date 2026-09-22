/**
 * Owns the server side of the apply flow: creating the application, keeping it
 * updated, uploading documents, running the two verifications and submitting.
 *
 * The page component owns which step is on screen; this hook owns everything
 * that talks to `@truckmoov/api`.
 */

import type {
  OnboardingApplication,
  OnboardingApplicationDocumentType,
} from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { BusinessDetailsValues } from "@/features/apply/utils/applySchemas";
import type { ApplicantCustomerType } from "@/features/apply/utils/applyTypes";

import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingApplicationQueryOptions,
  getOnboardingApplicationStatusQueryOptions,
  getOnboardingToken,
  setOnboardingToken,
  useCreateOnboardingApplication,
  useDeleteOnboardingApplicationDocument,
  useSendOnboardingApplicationEmailVerification,
  useSendOnboardingApplicationPhoneVerification,
  useSubmitOnboardingApplication,
  useUpdateOnboardingApplication,
  useUploadOnboardingApplicationDocument,
  useVerifyOnboardingApplicationEmail,
  useVerifyOnboardingApplicationPhone,
} from "@truckmoov/api/auth";
import {
  useCallback, useState,
} from "react";

import {
  normalizePhone,
  toContactFullName,
} from "@/features/apply/utils/applySchemas";
import {
  CUSTOMER_TYPE_TO_APPLICANT_TYPE,
  CUSTOMER_TYPE_TO_ROLE,
  toServerDocumentType,
} from "@/features/apply/utils/applyTypes";

export const APPLICATION_ID_STORAGE_KEY = "truckmoov_apply_application_id";
export const CUSTOMER_TYPE_STORAGE_KEY = "truckmoov_apply_customer_type";

export function readStoredApplicationId(): string | null {
  if (typeof window === "undefined")
    return null;
  return window.sessionStorage.getItem(APPLICATION_ID_STORAGE_KEY);
}

function writeStoredApplicationId(id: string | null) {
  if (typeof window === "undefined")
    return;
  if (id) {
    window.sessionStorage.setItem(
      APPLICATION_ID_STORAGE_KEY,
      id,
    );
  }
  else {
    window.sessionStorage.removeItem(APPLICATION_ID_STORAGE_KEY);
  }
}

export function readStoredCustomerType(): ApplicantCustomerType | null {
  if (typeof window === "undefined")
    return null;
  const stored = window.sessionStorage.getItem(CUSTOMER_TYPE_STORAGE_KEY);
  return stored === "enterprise" || stored === "owner_operator" ? stored : null;
}

export function writeStoredCustomerType(type: ApplicantCustomerType | null) {
  if (typeof window === "undefined")
    return;
  if (type) {
    window.sessionStorage.setItem(
      CUSTOMER_TYPE_STORAGE_KEY,
      type,
    );
  }
  else {
    window.sessionStorage.removeItem(CUSTOMER_TYPE_STORAGE_KEY);
  }
}

/** The server takes one full name; the design app splits it for owner-operators. */
export function detailsToPayload(
  values: BusinessDetailsValues,
  customerType: ApplicantCustomerType,
) {
  return {
    applicantType: CUSTOMER_TYPE_TO_APPLICANT_TYPE[customerType],
    organizationName: values.organizationName,
    businessEmail: values.businessEmail,
    organizationPhone: normalizePhone(values.phoneNumber),
    contactFullName: toContactFullName(
      values,
      customerType,
    ),
    contactRole: CUSTOMER_TYPE_TO_ROLE[customerType],
    streetAddress: values.streetAddress,
    city: values.city,
    state: values.state as string,
  };
  // ponytail: licensePlan and the indemnity signature have no field on the
  // application payload yet — they are held in applyDraftStore. Add them here
  // once the server accepts them.
}

export function applicationToDetails(
  application: OnboardingApplication,
  customerType: ApplicantCustomerType,
): BusinessDetailsValues {
  const full = application.contactFullName ?? "";
  const [
    first = "",
    ...rest
  ] = full.split(/\s+/).filter(Boolean);

  return {
    organizationName: application.organizationName,
    businessEmail: application.businessEmail,
    phoneNumber: application.organizationPhone,
    contactName: customerType === "enterprise" ? full : "",
    firstName: customerType === "enterprise" ? "" : first,
    lastName: customerType === "enterprise" ? "" : rest.join(" "),
    streetAddress: application.streetAddress,
    city: application.city,
    state: application.state as BusinessDetailsValues["state"],
  };
}

/**
 * Server field name -> business-details form field, so a 400 lands on the input
 * that caused it rather than only in the banner.
 */
export const SERVER_FIELD_TO_FORM_FIELD: Record<string, keyof BusinessDetailsValues> = {
  organizationName: "organizationName",
  businessEmail: "businessEmail",
  organizationPhone: "phoneNumber",
  contactFullName: "contactName",
  streetAddress: "streetAddress",
  city: "city",
  state: "state",
};

export function useApplyApplication(submitted: boolean) {
  const [
    applicationId,
    setApplicationId,
  ] = useState<string | null>(() => {
    // Only trust a stored id when the matching token is still in sessionStorage;
    // without the token every later call 404s.
    const stored = readStoredApplicationId();
    return stored && getOnboardingToken() ? stored : null;
  });

  const createMutation = useCreateOnboardingApplication();
  const updateMutation = useUpdateOnboardingApplication();
  const uploadMutation = useUploadOnboardingApplicationDocument();
  const deleteMutation = useDeleteOnboardingApplicationDocument();
  const sendEmailMutation = useSendOnboardingApplicationEmailVerification();
  const verifyEmailMutation = useVerifyOnboardingApplicationEmail();
  const sendPhoneMutation = useSendOnboardingApplicationPhoneVerification();
  const verifyPhoneMutation = useVerifyOnboardingApplicationPhone();
  const submitMutation = useSubmitOnboardingApplication();

  const applicationQuery = useQuery({
    ...getOnboardingApplicationQueryOptions(applicationId ?? ""),
    enabled: Boolean(applicationId),
  });

  const statusQuery = useQuery({
    ...getOnboardingApplicationStatusQueryOptions(applicationId ?? ""),
    enabled: Boolean(applicationId) && submitted,
    refetchInterval: 5000,
  });

  const application = applicationQuery.data?.data;

  /** Creates on first call, patches afterwards. Returns the error for binding. */
  const saveDetails = useCallback(
    async (values: BusinessDetailsValues, customerType: ApplicantCustomerType) => {
      const data = detailsToPayload(
        values,
        customerType,
      );

      if (!applicationId) {
        const res = await createMutation.mutateAsync({ data });
        setApplicationId(res.data.applicationId);
        writeStoredApplicationId(res.data.applicationId);
        return res.data.applicationId;
      }

      await updateMutation.mutateAsync({
        id: applicationId, data,
      });
      return applicationId;
    },
    [
      applicationId,
      createMutation,
      updateMutation,
    ],
  );

  const uploadDocument = useCallback(
    async (localType: string, file: File) => {
      const documentType = toServerDocumentType(localType);
      if (!applicationId || !documentType)
        return;
      await uploadMutation.mutateAsync({
        id: applicationId, documentType, file,
      });
    },
    [
      applicationId,
      uploadMutation,
    ],
  );

  const removeDocument = useCallback(
    async (localType: string) => {
      const documentType = toServerDocumentType(localType);
      if (!applicationId || !documentType || !application)
        return;
      const serverDocument = application.documents.find(
        doc => doc.documentType === documentType,
      );
      if (!serverDocument)
        return;
      await deleteMutation.mutateAsync({
        id: applicationId, documentId: serverDocument.id,
      });
    },
    [
      applicationId,
      application,
      deleteMutation,
    ],
  );

  const sendCode = useCallback(
    async (channel: "email" | "phone") => {
      if (!applicationId)
        throw new Error("No application");
      const mutation = channel === "email" ? sendEmailMutation : sendPhoneMutation;
      const res = await mutation.mutateAsync({ id: applicationId });
      return res.data;
    },
    [
      applicationId,
      sendEmailMutation,
      sendPhoneMutation,
    ],
  );

  const verifyCode = useCallback(
    async (channel: "email" | "phone", code: string) => {
      if (!applicationId)
        throw new Error("No application");
      const mutation = channel === "email" ? verifyEmailMutation : verifyPhoneMutation;
      await mutation.mutateAsync({
        id: applicationId, data: { code },
      });
    },
    [
      applicationId,
      verifyEmailMutation,
      verifyPhoneMutation,
    ],
  );

  const submit = useCallback(
    async () => {
      if (!applicationId)
        throw new Error("No application");
      return submitMutation.mutateAsync({ id: applicationId });
    },
    [
      applicationId,
      submitMutation,
    ],
  );

  /** Clears the server handle so the next visit starts a fresh application. */
  const clear = useCallback(
    () => {
      setApplicationId(null);
      writeStoredApplicationId(null);
      writeStoredCustomerType(null);
      setOnboardingToken(null);
    },
    [],
  );

  return {
    applicationId,
    application,
    applicationQuery,
    status: statusQuery.data?.data,
    missingDocuments: (application?.missingDocuments ?? []) as OnboardingApplicationDocumentType[],
    saveDetails,
    uploadDocument,
    removeDocument,
    sendCode,
    verifyCode,
    submit,
    clear,
    isSavingDetails: createMutation.isPending || updateMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isSendingEmail: sendEmailMutation.isPending,
    isSendingPhone: sendPhoneMutation.isPending,
  };
}

export function asServerError(error: unknown): ServerErrorResponse {
  return error as ServerErrorResponse;
}
