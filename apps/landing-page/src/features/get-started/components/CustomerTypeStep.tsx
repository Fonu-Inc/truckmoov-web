"use client";

import type { ApplicantCustomerType } from "@truckmoov/app-core/apply/applyTypes";
import { Check } from "lucide-react";
import { useState } from "react";
import { ApplicantTypeCard } from "@/features/get-started/components/ApplicantTypeCard";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import {
  StepHeading,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import { CUSTOMER_TYPES } from "@/features/get-started/utils/getStartedContent";

// First screen (main app: CustomerTypeStep). The type decides the fields and documents asked for.
export function CustomerTypeStep({
  value,
  onChange,
  onBack,
}: {
  value: ApplicantCustomerType | null;
  onChange: (value: ApplicantCustomerType) => void;
  onBack: () => void;
}) {
  const [
    selection,
    setSelection,
  ] = useState<ApplicantCustomerType | null>(value);
  const selected = CUSTOMER_TYPES.find(type => type.id === selection);

  return (
    <StepLayout
      footer={(
        <DialogFooter
          onBack={onBack}
          backMuted
          continueLabel="Continue"
          continueDisabled={!selection}
          onContinue={() => selection && onChange(selection)}
        />
      )}
    >
      <StepHeading
        title="What type of customer are you?"
        description="Select the option that matches how you operate. Owner Operator / Individual accounts are limited to 10 vehicles — choose Enterprise Customer if you run more than 10."
      />
      <div className="mt-[30px] grid gap-[9px] sm:grid-cols-2">
        {CUSTOMER_TYPES.map(type => (
          <ApplicantTypeCard
            key={type.id}
            title={type.title}
            description={type.description}
            illustration={type.illustration}
            illustrationWidth={type.illustrationWidth}
            illustrationHeight={type.illustrationHeight}
            illustrationClassName={type.illustrationClassName}
            selected={selection === type.id}
            onSelect={() => setSelection(type.id)}
          />
        ))}
      </div>
      {selected && (
        <ul className="mt-6 space-y-2.5 rounded-[20px] bg-surface px-5 py-4">
          {selected.points.map(point => (
            <li
              key={point}
              className="flex items-start gap-2.5 text-xs leading-[17px] text-heading"
            >
              <Check
                className="mt-px size-3.5 shrink-0 text-brand-deep"
                strokeWidth={3}
              />
              {point}
            </li>
          ))}
        </ul>
      )}
    </StepLayout>
  );
}
