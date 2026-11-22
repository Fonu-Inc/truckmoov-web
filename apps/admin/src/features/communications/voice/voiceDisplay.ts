import type {
  IvrPromptCategory, VoiceCallStatus, VoiceLanguage,
} from "@truckmoov/api/notification";

export const LANGUAGES: {
  code: VoiceLanguage; name: string;
}[] = [
  {
    code: "en", name: "English",
  },
  {
    code: "ha", name: "Hausa",
  },
  {
    code: "yo", name: "Yoruba",
  },
  {
    code: "ig", name: "Igbo",
  },
  {
    code: "pcm", name: "Nigerian Pidgin",
  },
];

export const CATEGORY_LABEL: Record<IvrPromptCategory, string> = {
  greeting: "Greeting",
  menu: "Menu options",
  confirmation: "Confirmation",
  error: "Error messages",
  goodbye: "Goodbye",
};

export const STATUS_LABEL: Record<VoiceCallStatus, string> = {
  queued: "Queued",
  ringing: "Ringing",
  in_progress: "In progress",
  completed: "Completed",
  missed: "Missed",
  failed: "Failed",
};

export function languageName(code: string): string {
  return LANGUAGES.find(language => language.code === code)?.name ?? code;
}

/** 0 -> "0s", 75 -> "1m 15s", 3600 -> "1h 0m". */
export function formatDuration(seconds: number): string {
  if (seconds < 60)
    return `${seconds}s`;
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function statusTone(status: VoiceCallStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed": return "default";
    case "missed":
    case "failed": return "destructive";
    case "ringing":
    case "in_progress": return "secondary";
    default: return "outline";
  }
}

/** Bar height as a share of the busiest day, never zero for a day that has calls. */
export function barShare(value: number, max: number): number {
  if (max <= 0 || value <= 0)
    return 0;
  return Math.max(
    4,
    Math.round((value / max) * 100),
  );
}
