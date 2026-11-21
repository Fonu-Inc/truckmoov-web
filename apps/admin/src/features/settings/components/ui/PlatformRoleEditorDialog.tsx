import type {
  PermissionKey, PlatformRole,
} from "@/features/settings/utils/platformPermissions";
import {
  Search, ShieldCheck,
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
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import { usePlatformRolesStore } from "@/features/settings/stores/platformRolesStore";
import {
  PERMISSION_DOMAINS,
  slugifyRoleKey,
} from "@/features/settings/utils/platformPermissions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Role being edited; omit to create a new one. */
  role?: PlatformRole | null;
  /** Read-only view of an existing role. */
  readOnly?: boolean;
};

/**
 * Create / edit / view a platform role — fleetflow's `PlatformRoleEditorDialog`.
 * ponytail: saves to the local `usePlatformRolesStore` only; no roles API yet.
 */
export function PlatformRoleEditorDialog({
  open, onOpenChange, role, readOnly = false,
}: Props) {
  const roles = usePlatformRolesStore(s => s.roles);
  const upsertRole = usePlatformRolesStore(s => s.upsertRole);
  const [
    name,
    setName,
  ] = useState("");
  const [
    description,
    setDescription,
  ] = useState("");
  const [
    selected,
    setSelected,
  ] = useState<PermissionKey[]>([]);
  const [
    query,
    setQuery,
  ] = useState("");

  // Reset the fields each time the dialog opens (or switches role) — adjusted
  // during render rather than in an effect, so there is no stale first paint.
  const [
    shownFor,
    setShownFor,
  ] = useState<{
    open: boolean; role?: PlatformRole | null;
  }>({ open: false });
  if (shownFor.open !== open || shownFor.role !== role) {
    setShownFor({
      open, role,
    });
    if (open) {
      setName(role?.label ?? "");
      setDescription(role?.description ?? "");
      setSelected(role?.permissions ?? []);
      setQuery("");
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
          p =>
            p.label.toLowerCase().includes(q)
            || p.key.toLowerCase().includes(q)
            || p.description.toLowerCase().includes(q),
        ),
      })).filter(d => d.permissions.length > 0);
    },
    [query],
  );

  const toggle = (key: PermissionKey, on: boolean) =>
    setSelected(prev => (on ? [
      ...new Set([
        ...prev,
        key,
      ]),
    ] : prev.filter(k => k !== key)));

  const toggleDomain = (keys: PermissionKey[], on: boolean) =>
    setSelected(prev =>
      on ? [
        ...new Set([
          ...prev,
          ...keys,
        ]),
      ] : prev.filter(k => !keys.includes(k)));

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Give the role a name");
      return;
    }
    if (selected.length === 0) {
      toast.error("Select at least one permission");
      return;
    }
    const key = role?.key ?? slugifyRoleKey(name);
    if (!role && roles.some(r => r.key === key)) {
      toast.error("A role with that name already exists");
      return;
    }
    upsertRole({
      key,
      label: name.trim(),
      description: description.trim() || "Custom platform role.",
      builtIn: role?.builtIn ?? false,
      permissions: selected,
    });
    toast.success(role ? `${name.trim()} updated` : `${name.trim()} created`);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-3xl w-[95vw] h-[88dvh] max-h-[820px] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {readOnly ? role?.label : role ? `Edit ${role.label}` : "Create Role"}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? "What this role grants across the platform."
              : "Name the role and choose exactly what it can do. Permissions are grouped by area."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="role-name">Role name</Label>
            <Input
              id="role-name"
              value={name}
              disabled={readOnly}
              placeholder="e.g. Regional Operations"
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-desc">Description</Label>
            <Textarea
              id="role-desc"
              rows={2}
              value={description}
              disabled={readOnly}
              placeholder="Short summary of what this role is for"
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
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
            {selected.length}
            {" "}
            selected
          </Badge>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain rounded-xl border border-border/50">
          <div className="divide-y divide-border/50">
            {domains.map((domain) => {
              const keys = domain.permissions.map(p => p.key);
              const all = keys.every(k => selected.includes(k));
              const some = !all && keys.some(k => selected.includes(k));
              return (
                <div
                  key={domain.id}
                  className="p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{domain.label}</p>
                      <p className="text-xs text-muted-foreground">{domain.description}</p>
                    </div>
                    {!readOnly && (
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <Checkbox
                          checked={all ? true : some ? "indeterminate" : false}
                          onCheckedChange={v => toggleDomain(
                            keys,
                            v === true,
                          )}
                        />
                        Select all
                      </label>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {domain.permissions.map(perm => (
                      <label
                        key={perm.key}
                        className="flex items-start gap-3 rounded-xl border border-border/50 p-3 cursor-pointer hover:bg-muted/40"
                      >
                        <Checkbox
                          className="mt-0.5"
                          disabled={readOnly}
                          checked={selected.includes(perm.key)}
                          onCheckedChange={v => toggle(
                            perm.key,
                            v === true,
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{perm.label}</span>
                          <span className="block text-xs text-muted-foreground">{perm.description}</span>
                          <code className="block mt-1 text-[10px] text-muted-foreground/70 truncate">
                            {perm.key}
                          </code>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            {domains.length === 0 && (
              <p className="p-6 text-sm text-center text-muted-foreground">No permissions match that search.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button
              variant="gradient"
              onClick={handleSave}
            >
              {role ? "Save Changes" : "Create Role"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
