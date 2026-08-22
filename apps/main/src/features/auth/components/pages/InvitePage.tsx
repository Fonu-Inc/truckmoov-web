import { ArrowLeft } from "lucide-react";
import {
  Link, useSearchParams,
} from "react-router";
import { Button } from "@/components/shadcn/button";
import { InviteProfileForm } from "@/features/auth/components/forms/InviteProfileForm";
import { AuthCardShell } from "@/features/auth/components/ui/AuthCardShell";

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite")?.trim() ?? "";
  const email = searchParams.get("email")?.trim() ?? "";
  const hasInvite = inviteToken.length > 0 && email.length > 0;

  return (
    <AuthCardShell
      title="Complete your profile"
      description="Add your name and choose a password to finish activating your FleetPro account."
    >
      {!hasInvite
        ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                This invitation link is incomplete. Open the link from your invitation email again, or ask your
                admin to resend the invitation.
              </p>
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
        : (
            <InviteProfileForm
              inviteToken={inviteToken}
              email={email}
            />
          )}
    </AuthCardShell>
  );
}
