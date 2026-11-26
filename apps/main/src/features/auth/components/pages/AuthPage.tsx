import { useLoginTwoFactor } from "@truckmoov/api/auth";
import { TwoFactorCodeForm } from "@truckmoov/reusables/components/auth/TwoFactorCodeForm";
import { useState } from "react";
import {
  Link, useLocation, useNavigate,
} from "react-router";

import { SignInForm } from "@/features/auth/components/forms/SignInForm";
import { useAuthStore } from "@/features/auth/stores/authStore";
import {
  getReturnPath, resolvePostLoginPath,
} from "@/features/auth/utils/authRedirect";

/** Rendered inside AuthLayout, which supplies the branding panel and mobile logo. */
export default function AuthPage() {
  // ponytail: the challenge lives in state only — a reload drops it and the user re-enters the password, which a five-minute single-use token requires anyway.
  const [
    challengeToken,
    setChallengeToken,
  ] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const verify = useLoginTwoFactor();

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-left">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {challengeToken ? "Two-factor verification" : "Welcome back"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {challengeToken
            ? "Enter the code from your authenticator app, or one of your recovery codes."
            : "Sign in to your FleetPro account"}
        </p>
      </div>

      {challengeToken
        ? (
            <TwoFactorCodeForm
              verify={async (code) => {
                const res = await verify.mutateAsync({
                  data: {
                    challengeToken, code,
                  },
                });
                // Resolve before syncing, same reason as SignInForm.
                const to = await resolvePostLoginPath(
                  res.data.user.role,
                  getReturnPath(location.state),
                );
                useAuthStore.getState().syncFromSession();
                navigate(
                  to,
                  { replace: true },
                );
              }}
              onRestart={() => setChallengeToken(null)}
            />
          )
        : <SignInForm onChallenge={setChallengeToken} />}

      {challengeToken
        ? null
        : (
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?
              {" "}
              <Link
                to="/apply"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Apply for one
              </Link>
            </p>
          )}
    </div>
  );
}
