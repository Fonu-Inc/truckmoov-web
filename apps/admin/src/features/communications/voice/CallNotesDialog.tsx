import type { VoiceCall } from "@truckmoov/api/notification";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Textarea } from "@/components/shadcn/textarea";
import { useVoiceActions } from "./useVoiceActions";

export function CallNotesDialog({
  call, onClose,
}: {
  call: VoiceCall; onClose: () => void;
}) {
  const [
    notes,
    setNotes,
  ] = useState(call.notes);
  const { saveNotes } = useVoiceActions(onClose);

  return (
    <Dialog
      open
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{`Notes for ${call.contact_name || call.to_number || call.from_number}`}</DialogTitle>
          <DialogDescription>What was said or decided on this call.</DialogDescription>
        </DialogHeader>
        <Textarea
          aria-label="Call notes"
          rows={6}
          maxLength={2000}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            loading={saveNotes.isPending}
            onClick={() => saveNotes.mutate({
              id: call.id, notes,
            })}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
