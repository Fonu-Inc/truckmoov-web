import type { OnboardingApplicationTimelineEntry } from "@truckmoov/api/auth";
import { Check } from "lucide-react";
import {
  InfoRow,
  Spinner,
  SuccessMark,
} from "@/features/get-started/components/StepParts";
import { FALLBACK_TIMELINE } from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

function TimelineMarker({ row }: { row: OnboardingApplicationTimelineEntry }) {
  if (row.complete) {
    return (
      <span className="relative flex size-[30px] shrink-0 items-center justify-center rounded-full bg-brand-deep/10">
        <span className="flex size-5 items-center justify-center rounded-full bg-brand-deep">
          <Check
            className="size-3 text-field-soft"
            strokeWidth={3}
          />
        </span>
      </span>
    );
  }
  if (row.inProgress) {
    return (
      <span className="relative flex size-[30px] shrink-0 items-center justify-center">
        <Spinner className="size-5 border-2" />
      </span>
    );
  }
  return (
    <span className="relative flex size-[30px] shrink-0 items-center justify-center">
      <span className="size-5 rounded-full bg-field" />
    </span>
  );
}

export function SubmittedStep({
  email,
  timeline,
}: {
  email: string;
  timeline?: OnboardingApplicationTimelineEntry[];
}) {
  const rows = timeline && timeline.length > 0 ? timeline : FALLBACK_TIMELINE;

  return (
    <div
      className="flex flex-col items-center pt-[70px] pb-2 text-center"
      role="status"
    >
      <SuccessMark />
      <h2 className="mt-[21px] max-w-[230px] text-[20px] leading-7 font-semibold text-heading">
        Application Submitted Successfully
      </h2>
      <p className="mt-1 max-w-[380px] text-sm leading-5 text-heading">
        Your Fleet Pro Application Has Been Received And Is Being Processed. When Your
        Application Is Approved A Setup Link Would Be Sent To
        {" "}
        <span className="font-bold">{email}</span>
        .
      </p>
      <ul className="mt-[22px] w-full max-w-[384.5px] rounded-[30px] border-[0.5px] border-border bg-surface px-[18px] py-[17px] text-left">
        {rows.map((row, index) => (
          <li
            key={row.key}
            className="flex gap-[4px]"
          >
            <div className="flex flex-col items-center">
              <TimelineMarker row={row} />
              {index < rows.length - 1 && (
                <span className={cn(
                  "-my-[5px] min-h-[20px] flex-1",
                  row.complete ? "w-0.5 bg-brand-deep" : "border-l border-dashed border-brand-deep",
                )}
                />
              )}
            </div>
            <span className="pt-[5px] pb-[10px] text-sm leading-5 font-medium text-heading">
              {row.label}
              {row.inProgress && (
                <span className="mt-0.5 block text-xs font-normal text-brand-deep">In-Progress</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <InfoRow
        className="mt-5 max-w-[310px] items-start gap-2 text-left text-[11px] leading-[15px] text-muted-foreground"
        iconClassName="size-4"
      >
        This Process May Take 30 Minutes To 1 Hour. Please Be Patient While We Complete Your
        Request.
      </InfoRow>
    </div>
  );
}
