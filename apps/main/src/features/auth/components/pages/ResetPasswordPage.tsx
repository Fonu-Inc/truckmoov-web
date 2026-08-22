import { ArrowLeft } from "lucide-react";
import {
  Link, useSearchParams,
} from "react-router";
import { Button } from "@/components/shadcn/button";
import { ResetPasswordForm } from "@/features/auth/components/forms/ResetPasswordForm";
import { AuthCardShell } from "@/features/auth/components/ui/AuthCardShell";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  return (
    <AuthCardShell
      title="Set a new password"
      description="Choose a strong password for your account."
    >
      {!token
        ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                This reset link is invalid or missing its token. Request a new password reset link to continue.
              </p>
              <Button
                asChild
                className="w-full"
              >
                <Link to="/auth/forgot-password">
                  Request a new link
                </Link>
              </Button>
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
        : <ResetPasswordForm token={token} />}
    </AuthCardShell>
  );
}
