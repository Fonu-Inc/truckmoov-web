import { useValidateInvite } from "@truckmoov/api/auth";
import {
  ArrowLeft, Loader2,
} from "lucide-react";
import {
  Link, useSearchParams,
} from "react-router";
import { Button } from "@/components/shadcn/button";
import { InviteForm } from "@/features/auth/components/forms/InviteForm";
import { AuthCardShell } from "@/features/auth/components/ui/AuthCardShell";

/**
 * Landing page for the invite email a platform admin's "Add Installer" sends.
 * The token is checked with GET /auth/invite/validate before the form shows.
 */
export default function InvitePage() {
  const [searchParams] = useSearchParams();
  // The email links to /auth/invite?invite=<token>&email=<email>; the email shown comes from validate, not the URL.
  const token = searchParams.get("invite")?.trim() || null;
  const invite = useValidateInvite(token);

  const broken = !token || invite.isError;

  return (
    <AuthCardShell
      title={broken ? "This invite link doesn't work" : "Set up your installer account"}
      description={broken
        ? "It may have expired or already been used. Ask your platform admin to resend the invite."
        : "Choose a password to activate your account."}
    >
      {broken
        ? (
            <div className="space-y-4 text-center">
              {invite.error && <p className="text-sm text-muted-foreground">{invite.error.message}</p>}
              <Button
                variant="ghost"
                asChild
                className="w-full"
              >
                <Link to="/auth">
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </Button>
            </div>
          )
        : invite.data
          ? (
              <InviteForm
                inviteToken={token}
                email={invite.data.data.email}
                fullName={invite.data.data.fullName}
              />
            )
          : (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking your invite…
              </p>
            )}
    </AuthCardShell>
  );
}
