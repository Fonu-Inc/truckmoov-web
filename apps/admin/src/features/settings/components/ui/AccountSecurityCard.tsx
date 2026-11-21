import { useSystemChangePassword } from "@truckmoov/api/auth";
import { useAuthStore as useApiAuthStore } from "@truckmoov/api/lib/auth-store";
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

/**
 * Settings → My Profile, under two-factor — fleetflow's `AccountSecurityCard`,
 * trimmed to its Change Password row and wired to
 * `PATCH /auth/system/change-password`.
 *
 * Its Two-Factor switch is the real `TwoFactorSetupCard` above this card, and
 * its per-browser "Portal Session Timeout" select has no per-account API, so
 * both rows are left out rather than faked.
 */
export function AccountSecurityCard({ className }: { className?: string }) {
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
