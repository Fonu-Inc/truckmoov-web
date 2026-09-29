import { useVerifyReset } from "@truckmoov/api/auth";
import {
  ArrowLeft, Loader2,
} from "lucide-react";
import {
  useEffect, useRef,
} from "react";
import {
  Link, useSearchParams,
} from "react-router";
import { Button } from "@/components/shadcn/button";
import { ResetPasswordForm } from "@/features/auth/components/forms/ResetPasswordForm";
import { AuthCardShell } from "@/features/auth/components/ui/AuthCardShell";

/**
 * The reset email links here with `?token=`. The token is checked with
 * POST /auth/verify-reset before the form shows, so a dead link says so up
 * front instead of after the installer has typed a new password twice.
 */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const verify = useVerifyReset();
  const firedRef = useRef(false);

  useEffect(
    () => {
      // Once per mount — StrictMode double-invokes effects in dev.
      if (!token || firedRef.current)
        return;
      firedRef.current = true;
      verify.mutate({ data: { token } });
    },
    [
      token,
      verify,
    ],
  );

  const broken = !token || verify.isError;

  return (
    <AuthCardShell
      title={broken ? "This reset link doesn't work" : "Set a new password"}
      description={broken ? "It may have expired or already been used." : "Choose a strong password for your account."}
    >
      {broken
        ? (
            <div className="space-y-4 text-center">
              {verify.error && <p className="text-sm text-muted-foreground">{verify.error.message}</p>}
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
        : verify.isSuccess
          ? <ResetPasswordForm token={token} />
          : (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking your link…
              </p>
            )}
    </AuthCardShell>
  );
}
