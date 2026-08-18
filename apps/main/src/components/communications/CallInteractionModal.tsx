import { formatClockDuration } from "@truckmoov/app-core/utils/time-utils";
import {
  Circle, Mic, MicOff, Phone, PhoneCall, PhoneOff, Square, StickyNote,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";

export type CallStatus = "idle" | "connecting" | "ringing" | "connected" | "ended" | "failed";

type CallInteractionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName?: string;
  contactPhone?: string;
  status: CallStatus;
  durationSeconds: number;
  onEndCall: () => void;
  /** Optional: persist note to backend. Returns true on success. */
  onSaveNote?: (note: string) => Promise<boolean> | boolean;
  /** Optional: enable record button. If omitted, button is hidden. */
  onToggleRecord?: (recording: boolean) => Promise<void> | void;
  recordingEnabled?: boolean;
};

export function CallInteractionModal({
  open,
  onOpenChange,
  contactName,
  contactPhone,
  status,
  durationSeconds,
  onEndCall,
  onSaveNote,
  onToggleRecord,
  recordingEnabled = false,
}: CallInteractionModalProps) {
  const [
    showNotes,
    setShowNotes,
  ] = useState(false);
  const [
    note,
    setNote,
  ] = useState("");
  const [
    isRecording,
    setIsRecording,
  ] = useState(false);
  const [
    savingNote,
    setSavingNote,
  ] = useState(false);

  useEffect(
    () => {
      if (!open) {
        setShowNotes(false);
        setNote("");
        setIsRecording(false);
      }
    },
    [open],
  );

  const initials = (contactName || "?")
    .split(" ")
    .map(n => n[0])
    .filter(Boolean)
    .slice(
      0,
      2,
    )
    .join("")
    .toUpperCase();

  const statusLabel
    = status === "connecting"
      ? "Calling..."
      : status === "ringing"
        ? "Ringing..."
        : status === "connected"
          ? "On Call"
          : status === "ended"
            ? "Call Ended"
            : status === "failed"
              ? "Call Failed"
              : "";

  const handleSaveNote = async () => {
    if (!note.trim()) {
      toast.error("Please enter a note");
      return;
    }
    if (!onSaveNote) {
      toast.success("Note saved");
      setNote("");
      setShowNotes(false);
      return;
    }
    setSavingNote(true);
    try {
      const ok = await onSaveNote(note.trim());
      if (ok !== false) {
        toast.success("Note saved");
        setNote("");
        setShowNotes(false);
      }
    }
    finally {
      setSavingNote(false);
    }
  };

  const handleToggleRecord = async () => {
    const next = !isRecording;
    setIsRecording(next);
    try {
      await onToggleRecord?.(next);
      toast.success(next ? "Recording started" : "Recording stopped");
    }
    catch {
      setIsRecording(!next);
      toast.error("Failed to toggle recording");
    }
  };

  const liveCall = status === "connecting" || status === "ringing" || status === "connected";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-center">{statusLabel}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          <div className="relative mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-2xl font-bold text-primary-foreground">
              {initials}
            </div>
            {isRecording && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive">
                <Circle className="h-2.5 w-2.5 fill-current text-destructive-foreground animate-pulse" />
              </span>
            )}
          </div>

          <p className="text-lg font-medium">{contactName || "Unknown"}</p>
          {contactPhone && <p className="text-sm text-muted-foreground">{contactPhone}</p>}

          <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
            {(status === "connecting" || status === "ringing") && (
              <Badge
                variant="secondary"
                className="animate-pulse"
              >
                <PhoneCall className="h-3 w-3 mr-1" />
                {status === "ringing" ? "Ringing" : "Connecting"}
              </Badge>
            )}
            {status === "connected" && (
              <>
                <Badge className="bg-success text-success-foreground">
                  <Phone className="h-3 w-3 mr-1" />
                  On Call
                </Badge>
                <Badge
                  variant="outline"
                  className="font-mono"
                >
                  {formatClockDuration(durationSeconds)}
                </Badge>
              </>
            )}
            {isRecording && (
              <Badge
                variant="destructive"
                className="gap-1"
              >
                <Circle className="h-2 w-2 fill-current animate-pulse" />
                REC
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-8">
            {onToggleRecord && recordingEnabled && liveCall && (
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={handleToggleRecord}
                title={isRecording ? "Stop recording" : "Record call"}
              >
                {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}

            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-14 w-14"
              onClick={onEndCall}
              disabled={!liveCall}
              title="End call"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="rounded-full h-12 w-12"
              onClick={() => setShowNotes(s => !s)}
              title="Add notes"
            >
              <StickyNote className="h-5 w-5" />
            </Button>
          </div>

          {/* Notes section */}
          {showNotes && (
            <div className="w-full mt-6 space-y-2">
              <Label htmlFor="call-note">Call Notes</Label>
              <Textarea
                id="call-note"
                placeholder="Log call details, outcomes, follow-ups..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotes(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={savingNote || !note.trim()}
                >
                  {savingNote ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
