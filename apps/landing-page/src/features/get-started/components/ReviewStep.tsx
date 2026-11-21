"use client";

import type { OnboardingApplication } from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import type {
  ApplicantCustomerType,
  RequiredDocument,
} from "@/features/get-started/utils/applyTypes";
import { PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingM2mPlansQueryOptions } from "@truckmoov/api/auth";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import {
  InfoRow,
  Notice,
  PassedIcon,
  Pill,
  StepHeading,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import { applicationToDetails } from "@/features/get-started/schemas/applySchemas";
import { useApplyDraftStore } from "@/features/get-started/stores/applyDraftStore";
import { requestedDeviceTotal } from "@/features/get-started/utils/applyHelpers";
import { CARD_CLASS } from "@/features/get-started/utils/getStartedContent";

/** Everything saved on the application, read back from the server before submitting (main app: ReviewStep). */
export function ReviewStep({
  customerType,
  application,
  requiredDocuments,
  submitting,
  submitError,
  onBack,
  onEditDetails,
  onEditFleet,
  onEditDocuments,
  onSubmit,
}: {
  customerType: ApplicantCustomerType;
  application: OnboardingApplication;
  requiredDocuments: RequiredDocument[];
  submitting: boolean;
  /** From a refused submit: the message, shown above the button. */
  submitError?: string | null;
  onBack: () => void;
  onEditDetails: () => void;
  onEditFleet: () => void;
  onEditDocuments: () => void;
  onSubmit: () => void;
}) {
  const plansQuery = useQuery(getOnboardingM2mPlansQueryOptions());
  const plan = plansQuery.data?.data.plans.find(entry => entry.code === application.m2mPlanCode);
  const { organization } = application;
  const details = applicationToDetails(application);
  const fulfilment = useApplyDraftStore(state => state.fulfilment);
  const delivery = customerType === "enterprise" && fulfilment.method === "delivery";
  const isEnterprise = customerType === "enterprise";
  const deviceTotal = requestedDeviceTotal(application);
  const documentRows = requiredDocuments.map(document => ({
    key: document.type,
    label: document.label,
    fileName: application.documents.find(item => item.documentType === document.type)?.documentName,
  }));

  return (
    <StepLayout
      footer={(
        <DialogFooter
          onBack={onBack}
          continueLabel={submitting ? "Submitting…" : "Submit Application"}
          continueDisabled={submitting}
          onContinue={onSubmit}
        />
      )}
    >
      <StepHeading
        title="Review your application"
        description="Check Everything Below Carefully. You Can Go Back And Edit Any Section Before Submitting."
      />

      <div className="mt-[30px] space-y-4">
        <Section
          title="Customer & Service Details"
          onEdit={onEditDetails}
        >
          <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
            <Field
              label="Customer Type"
              value={isEnterprise ? "Enterprise Customer" : "Owner Operator"}
            />
            <Field
              label="Organization Name"
              value={organization.organizationName}
            />
            {!isEnterprise && (
              <>
                <Field
                  label="First Name"
                  value={details.firstName}
                />
                <Field
                  label="Last Name"
                  value={details.lastName}
                />
              </>
            )}
            <Field
              label="Business Email"
              value={organization.businessEmail}
            />
            <Field
              label="Phone Number"
              value={organization.organizationPhone}
            />
            {isEnterprise && (
              <>
                <Field
                  label="Contact Person"
                  value={application.contact.fullName}
                />
                <Field
                  label="Contact Person Phone"
                  value={organization.organizationPhone}
                />
              </>
            )}
            <Field
              label="License Plan"
              value={plan?.name ?? application.m2mPlanCode ?? ""}
            />
            <Field
              label="Street Address"
              value={organization.streetAddress}
            />
            <Field
              label="City"
              value={organization.city}
            />
            <Field
              label="State"
              value={organization.state}
            />
          </dl>
        </Section>

        <Section
          title="Fleet Requirements"
          onEdit={onEditFleet}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <CountRow
              label="Vehicles added"
              count={application.vehicles.length}
            />
            <CountRow
              label="Devices requested"
              count={deviceTotal}
            />
          </div>
          {application.deviceRequests.length > 0 && (
            <dl className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
              <Field
                label="Device fulfilment method"
                value={delivery ? "Delivery" : "Pickup"}
              />
              <Field
                label={delivery ? "Delivery address" : "Pickup location"}
                value={delivery
                  ? [
                      fulfilment.deliveryStreet,
                      fulfilment.deliveryCity,
                      fulfilment.deliveryState,
                    ].filter(part => part.trim()).join(", ")
                  : fulfilment.store
                    ? `${fulfilment.store}, ${fulfilment.area}, ${fulfilment.state}`
                    : ""}
              />
            </dl>
          )}
          {application.vehicles.length > 0 && (
            <ul className="mt-4 space-y-2">
              {application.vehicles.map(vehicle => (
                <li
                  key={vehicle.id}
                  className="flex items-center justify-between gap-3 rounded-[12px] border-[0.5px] border-border px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-heading">{vehicle.registrationNumber || "Unregistered"}</span>
                  <span className="min-w-0 truncate text-xs text-muted-foreground">
                    {[
                      vehicle.make,
                      vehicle.model,
                      vehicle.year,
                    ].filter(Boolean).join(" · ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {application.deviceRequests.length > 0 && (
            <ul className="mt-2 space-y-2">
              {application.deviceRequests.map(request => (
                <li
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-[12px] border-[0.5px] border-border px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-heading">{request.useCase || "Device request"}</span>
                  <Pill>{`${request.quantity} device${request.quantity === 1 ? "" : "s"}`}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Required Documents"
          onEdit={onEditDocuments}
        >
          <ul className="space-y-[17px]">
            {documentRows.map(document => (
              <li
                key={document.key}
                className="flex items-center justify-between gap-3"
              >
                <span className="min-w-0 truncate text-sm font-medium text-heading">{document.label}</span>
                {document.fileName
                  ? (
                      <span className="flex min-w-0 shrink-0 items-center gap-1.5">
                        <span className="max-w-[10rem] truncate text-xs text-muted-foreground">{document.fileName}</span>
                        <PassedIcon className="size-[18px]" />
                      </span>
                    )
                  : <Pill tone="warning">Not uploaded</Pill>}
              </li>
            ))}
          </ul>
        </Section>

        {submitError && <Notice>{submitError}</Notice>}

        <InfoRow className="text-xs text-muted-foreground">
          By submitting, you confirm the information above is accurate. Once submitted, your
          application will be reviewed by the Fleet Pro team.
        </InfoRow>
      </div>
    </StepLayout>
  );
}

function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className={CARD_CLASS}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base leading-5 font-semibold text-heading">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex cursor-pointer items-center gap-1.5 rounded-[10px] px-2 py-1 text-xs font-medium text-brand-deep hover:bg-surface"
        >
          <PencilSimple className="size-3.5" />
          Edit
        </button>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-heading">{value.trim() ? value : "—"}</dd>
    </div>
  );
}

function CountRow({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-[12px] bg-surface px-3 py-2">
      <span className="text-sm text-heading">{label}</span>
      <span className="text-sm font-semibold text-heading">{count}</span>
    </div>
  );
}
