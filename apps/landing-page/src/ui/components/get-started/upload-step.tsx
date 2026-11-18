import type { Uploads } from "./get-started-data";
import { DOCUMENTS } from "./get-started-data";
import {
  InfoRow,
  StepHeading,
} from "./step-parts";
import { UploadField } from "./upload-field";

export function UploadStep({
  uploads,
  busy,
  onSelect,
  onRemove,
}: {
  uploads: Uploads;
  busy: Partial<Record<string, boolean>>;
  onSelect: (id: string, file: File) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="pt-[38px]">
      <StepHeading
        title="Upload your supporting documents"
        description="Please Provide The Documents Required To Process Your Application."
      />
      <InfoRow
        className="mt-[30px] gap-[5px] text-xs"
        iconClassName="size-[18px]"
      >
        Accepted Formats: PDF, JPG, PNG (Max 10MB Each).
      </InfoRow>
      <div className="mt-5 space-y-5">
        {DOCUMENTS.map(document => (
          <UploadField
            key={document.id}
            title={document.title}
            description={document.description}
            upload={uploads[document.id]}
            isBusy={Boolean(busy[document.id])}
            onSelect={file => onSelect(
              document.id,
              file,
            )}
            onRemove={() => onRemove(document.id)}
          />
        ))}
      </div>
    </div>
  );
}
