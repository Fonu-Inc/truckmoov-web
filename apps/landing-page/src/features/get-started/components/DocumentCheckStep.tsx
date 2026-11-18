import type { Uploads } from "@/features/get-started/utils/getStartedContent";
import {
  Check,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import {
  PassedIcon,
  StepHeading,
} from "@/features/get-started/components/StepParts";
import { DOCUMENTS } from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

export function DocumentCheckStep({ uploads }: { uploads: Uploads }) {
  const allPassed = DOCUMENTS.every(document => uploads[document.id].file && !uploads[document.id].error);

  return (
    <div className="pt-[38px]">
      <StepHeading
        title="Check your documents"
        description="We've Done A Quick Format Check. Final Verification Happens During Application Review."
      />
      <p className={cn(
        "mt-6 flex min-h-[61px] items-center gap-[12px] rounded-[20px] px-[25px] py-3 text-sm font-medium",
        allPassed ? "bg-success-tint text-success-deep" : "bg-warning-soft text-warning",
      )}
      >
        {allPassed
          ? <Check className="size-4 shrink-0" />
          : <Warning className="size-4 shrink-0" />}
        {allPassed ? "All Documents Passed The Format Check." : "Some Documents Need Attention."}
      </p>
      <div className="mt-[15px] space-y-[15px]">
        {DOCUMENTS.map((document) => {
          const upload = uploads[document.id];
          const failed = !upload.file || upload.error;
          return (
            <article
              key={document.id}
              className="flex min-h-[117px] gap-[17px] rounded-[30px] border border-border-field bg-background py-[25px] pr-6 pl-[19px] shadow-[0_0_4px_rgb(0_0_0/0.25)]"
            >
              {failed
                ? <Warning className="size-[21px] shrink-0 text-warning" />
                : <PassedIcon />}
              <div className="min-w-0">
                <h3 className="text-sm leading-[18px] font-semibold text-heading">{document.title}</h3>
                <p className="mt-2 text-xs leading-5 font-medium break-words text-heading">
                  {upload.file
                    ? `Uploaded · ${upload.file.name}`
                    : "Missing"}
                  {upload.error && ` · ${upload.error}`}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
