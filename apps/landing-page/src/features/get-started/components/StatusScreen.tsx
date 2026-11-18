import type { VerifyStatus } from "@/features/get-started/utils/getStartedContent";
import {
  Spinner,
  SuccessMark,
} from "@/features/get-started/components/StepParts";

// Centred "Verifying…" (spinner) / "Verified" (green check) screen shown on the
// verify steps once a code has been submitted.
export function StatusScreen({
  status,
  verifyingTitle,
  verifyingDescription,
  verifiedTitle,
  verifiedDescription,
}: {
  status: Exclude<VerifyStatus, "idle">;
  verifyingTitle: string;
  verifyingDescription: string;
  verifiedTitle: string;
  verifiedDescription: string;
}) {
  const verifying = status === "verifying";

  return (
    <div
      className="flex flex-col items-center text-center"
      role="status"
    >
      {verifying
        ? <Spinner className="mt-[114px] size-10 border-[3px]" />
        : <SuccessMark className="mt-[103px]" />}
      <h2 className="mt-[21px] text-[20px] leading-[25px] font-semibold text-heading">
        {verifying ? verifyingTitle : verifiedTitle}
      </h2>
      <p className="mt-[3px] text-sm leading-5 text-heading">
        {verifying ? verifyingDescription : verifiedDescription}
      </p>
    </div>
  );
}
