import type { InstallerDisplayPreferences } from "@truckmoov/api/auth";
import { useUpdateInstallerDisplayPreferences } from "@truckmoov/api/auth";
import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

/** Fleetflow's two zones; the server accepts any IANA name, so a stored other one is kept as an option. */
const TIMEZONES: Record<string, string> = {
  "Africa/Lagos": "West Africa Time (GMT+1)",
  "UTC": "Coordinated Universal Time (GMT+0)",
};

const LANGUAGES = [
  "English",
  "Hausa",
  "Yoruba",
  "Igbo",
  "Nigerian Pidgin",
];

/**
 * Default Timezone and Default Language, as in fleetflow: no Save button, a
 * change applies straight away.
 */
export function DisplayPreferencesForm({ preferences }: { preferences: InstallerDisplayPreferences }) {
  const update = useUpdateInstallerDisplayPreferences();
  const [
    timezone,
    setTimezone,
  ] = useState(preferences.timezone);
  // ponytail: no language field on the installer display-preferences API yet; held on screen only.
  const [
    language,
    setLanguage,
  ] = useState("English");
  const zones = timezone in TIMEZONES || !timezone
    ? TIMEZONES
    : {
        [timezone]: timezone.replace(
          "_",
          " ",
        ),
        ...TIMEZONES,
      };

  function changeTimezone(next: string) {
    const previous = timezone;
    setTimezone(next);
    update.mutate(
      { data: { timezone: next } },
      {
        onSuccess: () => toast.success("Display preferences saved."),
        onError: (error) => {
          setTimezone(previous);
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label
          htmlFor="installer-timezone"
          required
        >
          Default Timezone
        </Label>
        <Select
          value={timezone}
          onValueChange={changeTimezone}
          disabled={update.isPending}
        >
          <SelectTrigger id="installer-timezone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(zones).map(([
              value,
              label,
            ]) => (
              <SelectItem
                key={value}
                value={value}
              >
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="installer-language">Default Language</Label>
        <Select
          value={language}
          onValueChange={setLanguage}
        >
          <SelectTrigger id="installer-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(l => (
              <SelectItem
                key={l}
                value={l}
              >
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
