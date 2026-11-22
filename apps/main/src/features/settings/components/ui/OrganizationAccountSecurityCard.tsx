import type { TwoFactorDialogMode } from "@/features/settings/components/ui/TwoFactorDialog";
import { useTwoFactor } from "@truckmoov/api/auth";
import { Shield } from "lucide-react";
import {
  useCallback, useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";
import { TwoFactorDialog } from "@/features/settings/components/ui/TwoFactorDialog";

/**
 * The Organization tab's "Account & Security" card. Two-factor reads the real
 * enrolment state. Flipping the switch opens `TwoFactorDialog` in place: while
 * the enable dialog is open the switch reads on; if setup isn't confirmed it
 * falls back to off (and cancelling a disable leaves it on).
 */
export function OrganizationAccountSecurityCard() {
  const twoFactorQuery = useTwoFactor();
  const enrolled = twoFactorQuery.data?.data.enrolled ?? false;
  const lockedOn = enrolled && (twoFactorQuery.data?.data.requiredByPlatform ?? false);
  const [
    dialogMode,
    setDialogMode,
  ] = useState<TwoFactorDialogMode | null>(null);
  const closeDialog = useCallback(
    () => setDialogMode(null),
    [],
  );

  return (
    <div className="rounded-2xl surface-sleek text-card-foreground bg-card/50 border-border/50">
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Account & Security
        </h3>
        <p className="text-sm text-muted-foreground">Manage sign-in protection and account access.</p>
      </div>
      <div className="p-6 pt-0 space-y-4">
        <div className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium">Two-Factor Authentication</p>
            <p className="text-xs text-muted-foreground">Require an additional verification step when signing in.</p>
          </div>
          <div className="shrink-0">
            <Switch
              aria-label="Two-Factor Authentication"
              checked={dialogMode === "enable" || (enrolled && dialogMode !== "disable")}
              disabled={twoFactorQuery.isPending || lockedOn}
              title={lockedOn ? "The platform requires two-factor, so it can't be turned off." : undefined}
              onCheckedChange={on => setDialogMode(on ? "enable" : "disable")}
            />
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium">Portal Session Timeout</p>
            <p className="text-xs text-muted-foreground">Automatically sign out after a period of inactivity.</p>
          </div>
          <div className="shrink-0">
            {/* No endpoint stores a session timeout yet, so the control shows "-" and is locked. */}
            <Select disabled>
              <SelectTrigger
                aria-label="Portal Session Timeout"
                className="h-10 rounded-xl px-3.5 w-[150px]"
              >
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium">Change Password</p>
            <p className="text-xs text-muted-foreground">Update the password used to sign in to your account.</p>
          </div>
          <div className="shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => toast.info("Changing your password is not available yet.")}
            >
              Change Password
            </Button>
          </div>
        </div>
      </div>
      <TwoFactorDialog
        mode={dialogMode}
        onClose={closeDialog}
      />
    </div>
  );
}
