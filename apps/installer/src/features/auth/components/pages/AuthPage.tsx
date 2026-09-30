import { useInstallerLoginTwoFactor } from "@truckmoov/api/auth";
import { TwoFactorCodeForm } from "@truckmoov/reusables/components/auth/TwoFactorCodeForm";
import {
  ShieldCheck, Wrench,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { InstallerSignInForm } from "@/features/auth/components/forms/InstallerSignInForm";
import { useAuthStore } from "@/stores/authStore";

/** Rendered inside AuthLayout, which supplies the branding panel and mobile logo. */
export default function AuthPage() {
  // ponytail: the challenge lives in state only — a reload drops it and the installer re-enters the password, which a five-minute single-use token requires anyway.
  const [
    challengeToken,
    setChallengeToken,
  ] = useState<string | null>(null);
  const navigate = useNavigate();
  const verify = useInstallerLoginTwoFactor();

  const Icon = challengeToken ? ShieldCheck : Wrench;

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-left">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {challengeToken ? "Two-factor verification" : "Installer sign in"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {challengeToken
            ? "Enter the code from your authenticator app, or one of your recovery codes."
            : "Sign in to manage your installation jobs."}
        </p>
      </div>

      {challengeToken
        ? (
            <TwoFactorCodeForm
              verify={async (code) => {
                await verify.mutateAsync({
                  data: {
                    challengeToken, code,
                  },
                });
                await useAuthStore.getState().bootstrapFromSession();
                navigate(
                  "/",
                  { replace: true },
                );
              }}
              onRestart={() => setChallengeToken(null)}
            />
          )
        : <InstallerSignInForm onChallenge={c => setChallengeToken(c.challengeToken)} />}
    </div>
  );
}
