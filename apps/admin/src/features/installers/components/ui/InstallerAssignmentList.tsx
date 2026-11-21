import type { SystemInstaller } from "@truckmoov/api/auth";
import type { InstallationRecord } from "@/features/installers/utils/platformInstallations";
import {
  Check, Mail, MapPin, Phone, Search, User, Wrench,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  capabilityLabel, fromApiState, installerName,
} from "@/features/installers/installerOptions";
import {
  installerHasActiveAssignment, installerScheduleConflict, rankInstallationInstallers,
} from "@/features/installers/utils/platformInstallations";
import { cn } from "@/lib/utils";

/** Fleetflow's `InstallerAssignmentList`: the ranked installer picker inside "Installation Assignment". */
export function InstallerAssignmentList({
  record, installers, eligibleIds, records, selectedId, onSelect, disabled,
}: {
  record: InstallationRecord;
  installers: SystemInstaller[];
  records: InstallationRecord[];
  eligibleIds: string[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  const [
    query,
    setQuery,
  ] = useState("");
  const ranked = rankInstallationInstallers(
    record,
    installers,
  );
  const visible = ranked.filter(({ installer: i }) => [
    installerName(i),
    i.phoneNumber,
    i.email,
    i.city,
    fromApiState(i.state),
    ...i.capabilities.map(capabilityLabel),
  ].some(value => value.toLowerCase().includes(query.trim().toLowerCase())));
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search installers"
          placeholder="Search installers…"
          value={query}
          onChange={event => setQuery(event.target.value)}
          className="pl-9"
        />
      </div>
      <p className="text-xs text-muted-foreground">Same-city installers first, then same-state matches. Exact distances are unavailable.</p>
      <div
        className="max-h-[46vh] space-y-2 overflow-y-auto pr-1"
        role="group"
        aria-label="Available installers"
      >
        {visible.map(({
          installer, match,
        }) => {
          const selected = selectedId === installer.id;
          const eligible = eligibleIds.includes(installer.id);
          const assigned = installerHasActiveAssignment(
            installer.id,
            records,
          );
          return (
            <Button
              key={installer.id}
              variant="ghost"
              disabled={disabled || !eligible}
              aria-pressed={selected}
              aria-label={`Select installer ${installerName(installer)}`}
              onClick={() => onSelect(installer.id)}
              className={cn(
                "block h-auto w-full whitespace-normal rounded-xl border p-3 text-left disabled:opacity-100",
                selected ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-primary/50 hover:bg-accent/30",
              )}
            >
              <span className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10"><User className="h-4 w-4 text-primary" /></span>
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="break-words text-sm font-medium">{installerName(installer)}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                    >
                      {match}
                    </Badge>
                    {installer.id === record.installerId && (
                      <Badge
                        variant="secondary"
                        className="text-[10px]"
                      >
                        Currently assigned
                      </Badge>
                    )}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      assigned ? "border-warning/20 bg-warning/10 text-warning" : "border-success/20 bg-success/10 text-success",
                    )}
                  >
                    {assigned ? "Assigned to a job" : "Available"}
                  </Badge>
                  <span className="grid gap-1 text-xs font-normal text-muted-foreground sm:grid-cols-2">
                    <span className="flex items-start gap-1.5">
                      <Phone className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="break-all">{installer.phoneNumber || "Phone not recorded"}</span>
                    </span>
                    <span className="flex items-start gap-1.5">
                      <Mail className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="break-all">{installer.email || "Email not recorded"}</span>
                    </span>
                    <span className="flex items-start gap-1.5 sm:col-span-2">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="break-words">
                        {[
                          installer.city,
                          fromApiState(installer.state),
                        ].filter(Boolean).join(", ") || "Location not recorded"}
                      </span>
                    </span>
                    <span className="flex items-start gap-1.5 sm:col-span-2">
                      <Wrench className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="break-words">{installer.capabilities.map(capabilityLabel).join(" · ") || "Capabilities not recorded"}</span>
                    </span>
                  </span>
                  {!eligible && <span className="block text-xs font-normal text-muted-foreground">{installer.status !== "active" ? installer.status === "suspended" ? "Suspended" : "Pending activation" : "Outside service area or installation requirements"}</span>}
                  {installerScheduleConflict(
                    record,
                    installer.id,
                    records,
                  ) && <span className="block text-xs font-normal text-warning">Other installation work on this date</span>}
                </span>
                {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </span>
            </Button>
          );
        })}
        {!visible.length && <p className="py-8 text-center text-sm text-muted-foreground">{installers.length ? "No installers match your search." : "No active installers match this installation’s service area and device/vehicle requirements."}</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        {visible.length}
        {" installer"}
        {visible.length === 1 ? "" : "s"}
        {" · "}
        {visible.filter(({ installer }) => eligibleIds.includes(installer.id)).length}
        {" available for assignment"}
      </p>
    </div>
  );
}
