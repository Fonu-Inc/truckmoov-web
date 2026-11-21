import {
  useSystemChangePassword, useTwoFactor,
} from "@truckmoov/api/auth";
import { useAuthStore as useApiAuthStore } from "@truckmoov/api/lib/auth-store";
import { TwoFactorSetupCard } from "@truckmoov/reusables/components/auth/TwoFactorSetupCard";
import { Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";
import { useAuthStore } from "@/stores/authStore";

function readSessionTimeout(storageKey: string): string {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}") as { sessionTimeout?: string };
    return parsed.sessionTimeout || "60";
  }
  catch {
    // Keep safe defaults if locally saved settings are invalid.
    return "60";
  }
}

/**
 * Settings → Team & Access, under the team — fleetflow's `AccountSecurityCard`
 * (Two-Factor Authentication, Portal Session Timeout, Change Password).
 *
 * - **Two-Factor** reflects the signed-in admin's real status
 *   (`useTwoFactor`). Turning it on or off needs an authenticator code, so the
 *   switch opens the shared `TwoFactorSetupCard` (TRU-FE-23) in a dialog
 *   instead of flipping a local flag as fleetflow does.
 * - **Portal Session Timeout** — ponytail: mock data from fleetflow parity port —
 *   wire to packages/api. Per-browser, as in fleetflow; the API's
 *   `security.sessionTimeoutMinutes` is platform-wide and has no 4-hour option.
 * - **Change Password** is `PATCH /auth/system/change-password`.
 */
export function AccountSecurityCard({ className }: { className?: string }) {
  const userId = useAuthStore(s => s.user?.id);
  // App-prefixed: both dev servers share localhost storage (see sidebarStore).
  const storageKey = `admin-platform-account-security-${userId ?? "default"}`;
  const twoFactor = useTwoFactor();
  const twoFactorEnabled = twoFactor.data?.data?.enrolled ?? false;
  const [
    twoFactorOpen,
    setTwoFactorOpen,
  ] = useState(false);
  const [
    sessionTimeout,
    setSessionTimeout,
  ] = useState(() => readSessionTimeout(storageKey));
  const changePasswordMutation = useSystemChangePassword();
  const [
    passwordOpen,
    setPasswordOpen,
  ] = useState(false);
  const [
    password,
    setPassword,
  ] = useState({
    current: "", next: "", confirm: "",
  });
  const changingPassword = changePasswordMutation.isPending;

  const changePassword = () => {
    if (!password.current)
      return toast.error("Enter your current password");
    if (password.next.length < 8)
      return toast.error("New password must be at least 8 characters");
    if (password.next !== password.confirm)
      return toast.error("New passwords do not match");
    changePasswordMutation.mutate(
      {
        data: {
          currentPassword: password.current, newPassword: password.next,
        },
      },
      {
        onSuccess: (res) => {
          // The server rotates the session on a password change; keep the new pair.
          if (res.data?.accessToken && res.data?.refreshToken) {
            useApiAuthStore.setState({
              accessToken: res.data.accessToken,
              refreshToken: res.data.refreshToken,
            });
          }
          setPassword({
            current: "", next: "", confirm: "",
          });
          setPasswordOpen(false);
          toast.success("Password changed successfully");
        },
        onError: error => toast.error(error instanceof Error ? error.message : "Could not change password"),
      },
    );
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Account &amp; Security
          </CardTitle>
          <CardDescription>Manage sign-in protection and account access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Two-Factor Authentication"
            description="Require an additional verification step when signing in."
          >
            <Switch
              checked={twoFactorEnabled}
              disabled={twoFactor.isLoading}
              onCheckedChange={() => setTwoFactorOpen(true)}
              aria-label="Two-Factor Authentication"
            />
          </SettingRow>
          <SettingRow
            label="Portal Session Timeout"
            description="Automatically sign out after a period of inactivity."
          >
            <Select
              value={sessionTimeout}
              onValueChange={(value) => {
                setSessionTimeout(value);
                try {
                  localStorage.setItem(
                    storageKey,
                    JSON.stringify({ sessionTimeout: value }),
                  );
                }
                catch {
                  // Storage blocked — the choice still holds for this visit.
                }
                toast.success("Session timeout updated");
              }}
            >
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow
            label="Change Password"
            description="Update the password used to sign in to your account."
          >
            <Button
              variant="outline"
              onClick={() => setPasswordOpen(true)}
            >
              Change Password
            </Button>
          </SettingRow>
        </CardContent>
      </Card>

      <Dialog
        open={twoFactorOpen}
        onOpenChange={setTwoFactorOpen}
      >
        <DialogContent className="sm:max-w-lg p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Two-Factor Authentication</DialogTitle>
            <DialogDescription>Require an additional verification step when signing in.</DialogDescription>
          </DialogHeader>
          <TwoFactorSetupCard className="border-0 shadow-none" />
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Confirm your current password, then choose a new password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <PasswordField
              id="security-current-password"
              label="Current Password"
              value={password.current}
              onChange={current => setPassword({
                ...password, current,
              })}
              autoComplete="current-password"
            />
            <PasswordField
              id="security-new-password"
              label="New Password"
              value={password.next}
              onChange={next => setPassword({
                ...password, next,
              })}
              autoComplete="new-password"
            />
            <PasswordField
              id="security-confirm-password"
              label="Confirm New Password"
              value={password.confirm}
              onChange={confirm => setPassword({
                ...password, confirm,
              })}
              autoComplete="new-password"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPasswordOpen(false)}
                disabled={changingPassword}
              >
                Cancel
              </Button>
              <Button
                onClick={changePassword}
                disabled={changingPassword}
              >
                {changingPassword ? "Changing Password…" : "Change Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SettingRow({
  label, description, children,
}: {
  label: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function PasswordField({
  id, label, value, onChange, autoComplete,
}: {
  id: string; label: string; value: string; onChange: (value: string) => void; autoComplete: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </div>
  );
}
