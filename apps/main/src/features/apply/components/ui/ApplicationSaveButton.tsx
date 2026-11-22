import { Save } from "lucide-react";
import { useContext } from "react";

import { Button } from "@/components/shadcn/button";
import { ApplicationSaveContext } from "@/features/apply/components/providers/ApplicationSaveContext";

/** The design's "Save and continue later", in each form step's footer. */
export function ApplicationSaveButton() {
  const onSave = useContext(ApplicationSaveContext);
  if (!onSave)
    return null;
  return (
    <Button
      type="button"
      variant="outline"
      className="order-last w-full sm:order-none sm:w-auto"
      onClick={onSave}
    >
      <Save className="mr-2 h-4 w-4 shrink-0" />
      Save and continue later
    </Button>
  );
}
