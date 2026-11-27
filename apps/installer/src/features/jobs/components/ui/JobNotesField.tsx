import type { InstallerJobDetail } from "@truckmoov/api/auth";
import type { MutableRefObject } from "react";
import { useSaveInstallerJobNotes } from "@truckmoov/api/auth";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";

const NOTES_MAX = 2000;
const SAVE_DELAY_MS = 800;
const SAVED_VISIBLE_MS = 3000;

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * Saves on a typing pause and on blur. `flushRef` lets the page save a pending note
 * (and learn whether it worked) before it completes the job; leaving the page saves too.
 */
export function JobNotesField({
  job, flushRef,
}: {
  job: InstallerJobDetail;
  flushRef: MutableRefObject<(() => Promise<boolean>) | null>;
}) {
  const { mutateAsync } = useSaveInstallerJobNotes();
  const jobId = job.id;
  const [
    notes,
    setNotes,
  ] = useState(job.notes ?? "");
  const [
    state,
    setState,
  ] = useState<SaveState>("idle");
  const valueRef = useRef(notes);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const inflightRef = useRef<Promise<boolean> | null>(null);

  const save = useCallback(
    async (): Promise<boolean> => {
      clearTimeout(timerRef.current);
      if (inflightRef.current)
        await inflightRef.current;
      if (!dirtyRef.current)
        return true;
      const value = valueRef.current;
      dirtyRef.current = false;
      setState("saving");
      const run = mutateAsync({
        jobId,
        data: { notes: value.trim() ? value : null },
      }).then(
        () => {
          setState(dirtyRef.current ? "dirty" : "saved");
          return true;
        },
        () => {
          dirtyRef.current = true;
          setState("error");
          toast.error("Notes could not be saved. Try again.");
          return false;
        },
      );
      inflightRef.current = run;
      const ok = await run;
      inflightRef.current = null;
      return ok;
    },
    [
      jobId,
      mutateAsync,
    ],
  );

  useEffect(
    () => {
      const flushes = flushRef;
      flushes.current = save;
      return () => {
        flushes.current = null;
        void save();
      };
    },
    [
      save,
      flushRef,
    ],
  );

  useEffect(
    () => {
      if (state !== "saved")
        return;
      const t = setTimeout(
        setState,
        SAVED_VISIBLE_MS,
        "idle",
      );
      return () => clearTimeout(t);
    },
    [state],
  );

  return (
    <div className="space-y-1.5 pt-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="installer-notes">Installer notes</Label>
        <span
          role="status"
          aria-live="polite"
          className="text-xs text-muted-foreground"
        >
          {state === "saving" && "Saving…"}
          {state === "saved" && "Saved"}
          {state === "dirty" && "Unsaved changes"}
          {state === "error" && (
            <>
              <span className="text-destructive">Not saved.</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-1 py-0 text-xs"
                onClick={() => void save()}
              >
                Retry
              </Button>
            </>
          )}
        </span>
      </div>
      <Textarea
        id="installer-notes"
        value={notes}
        disabled={!job.actions.canEditNotes}
        maxLength={NOTES_MAX}
        onChange={(e) => {
          const { value } = e.target;
          setNotes(value);
          valueRef.current = value;
          dirtyRef.current = true;
          if (state !== "saving")
            setState("dirty");
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(
            () => void save(),
            SAVE_DELAY_MS,
          );
        }}
        onBlur={() => void save()}
        placeholder="Add notes about the installation"
        rows={3}
      />
      <p className="text-right text-xs text-muted-foreground">{`${notes.length}/${NOTES_MAX}`}</p>
    </div>
  );
}
