import type { PermissionKey } from "@/features/settings/utils/platformPermissions";
import {
  KeyRound, Pencil, Search, Users,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { usePlatformRolesStore } from "@/features/settings/stores/platformRolesStore";
import { PERMISSION_DOMAINS } from "@/features/settings/utils/platformPermissions";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  roleKey: string;
};

/**
 * Grant single capabilities to one person, on top of their role — fleetflow's
 * `UserPermissionsDialog`.
 * ponytail: grants persist to the local `usePlatformRolesStore`; nothing on the
 * API enforces them yet.
 */
export function UserPermissionsDialog({
  open, onOpenChange, userId, userName, roleKey,
}: Props) {
  const roles = usePlatformRolesStore(s => s.roles);
  const userGrants = usePlatformRolesStore(s => s.userGrants);
  const setUserGrants = usePlatformRolesStore(s => s.setUserGrants);
  const role = roles.find(r => r.key === roleKey);
  const rolePermissions = useMemo(
    () => new Set(role?.permissions ?? []),
    [role],
  );

  const [
    extra,
    setExtra,
  ] = useState<PermissionKey[]>([]);
  const [
    query,
    setQuery,
  ] = useState("");
  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  // Reset on open / user change — adjusted during render rather than in an effect.
  const resetKey = open ? userId : null;
  const [
    shownFor,
    setShownFor,
  ] = useState<string | null>(null);
  if (shownFor !== resetKey) {
    setShownFor(resetKey);
    if (open) {
      setExtra([
        ...new Set([
          ...(role?.permissions ?? []),
          ...(userGrants[userId] ?? []),
        ]),
      ]);
      setQuery("");
      setIsEditing(false);
    }
  }

  const domains = useMemo(
    () => {
      const q = query.trim().toLowerCase();
      if (!q)
        return PERMISSION_DOMAINS;
      return PERMISSION_DOMAINS.map(d => ({
        ...d,
        permissions: d.permissions.filter(
          p => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q),
        ),
      })).filter(d => d.permissions.length > 0);
    },
    [query],
  );

  const save = () => {
    setUserGrants(
      userId,
      extra,
    );
    toast.success(`Permissions updated for ${userName}`);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl w-[95vw] h-[88dvh] max-h-[760px] grid grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Permissions —
            {" "}
            {userName}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span>Role on this platform:</span>
            <Badge
              variant="secondary"
              className="font-medium"
            >
              {role?.label ?? "No role assigned"}
            </Badge>
            {role?.description && (
              <span className="text-xs text-muted-foreground">{role.description}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Assigned role</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className="text-sm font-semibold"
              >
                {role?.label ?? "No role assigned"}
              </Badge>
              {role?.key && (
                <span className="text-xs text-muted-foreground font-mono">{role.key}</span>
              )}
            </div>
            {role?.description
              ? (
                  <p className="text-sm text-muted-foreground mt-2">{role.description}</p>
                )
              : (
                  <p className="text-sm text-muted-foreground mt-2">
                    This admin has no platform role. Permissions can still be granted individually below.
                  </p>
                )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search permissions..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <Badge
            variant="secondary"
            className="whitespace-nowrap"
          >
            {extra.length}
            {" "}
            allowed
          </Badge>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {isEditing ? "Tick or untick any permission below, then save." : "Permission editing is currently locked."}
          </p>
          <Button
            size="sm"
            variant={isEditing ? "secondary" : "outline"}
            onClick={() => setIsEditing(value => !value)}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            {isEditing ? "Editing" : "Edit Permissions"}
          </Button>
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain rounded-xl border border-border/50 pr-1">
          <div className="divide-y divide-border/50">
            {domains.map(d => (
              <div
                key={d.id}
                className="p-4 space-y-2"
              >
                <p className="text-sm font-medium">{d.label}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {d.permissions.map((perm) => {
                    const fromRole = rolePermissions.has(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border border-border/50 p-3",
                          isEditing ? "cursor-pointer hover:bg-muted/40" : "opacity-70",
                        )}
                      >
                        <Checkbox
                          className="mt-0.5"
                          disabled={!isEditing}
                          checked={extra.includes(perm.key)}
                          onCheckedChange={v =>
                            setExtra(prev =>
                              v === true
                                ? [
                                    ...new Set([
                                      ...prev,
                                      perm.key,
                                    ]),
                                  ]
                                : prev.filter(k => k !== perm.key))}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{perm.label}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {fromRole ? `Included in ${role?.label ?? "role"}` : perm.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {isEditing ? "Cancel" : "Close"}
          </Button>
          {isEditing && (
            <Button
              variant="gradient"
              onClick={save}
            >
              Save Permissions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
