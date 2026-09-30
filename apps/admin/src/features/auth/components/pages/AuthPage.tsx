import type {
  TwoFactorChallenge, TwoFactorEnrolmentChallenge,
} from "@truckmoov/api/auth";
import { useSystemLoginTwoFactor } from "@truckmoov/api/auth";
import { TwoFactorCodeForm } from "@truckmoov/reusables/components/auth/TwoFactorCodeForm";
import { TwoFactorEnrolmentStep } from "@truckmoov/reusables/components/auth/TwoFactorEnrolmentStep";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { AdminSignInForm } from "@/features/auth/components/forms/AdminSignInForm";
import { useAuthStore } from "@/stores/authStore";

const COPY = {
  password: [
    "Platform admin sign in",
    "Sign in to manage platform operations.",
  ],
  code: [
    "Two-factor verification",
    "Enter the code from your authenticator app, or one of your recovery codes.",
  ],
  enrolment: [
    "Set up two-factor",
    "Scan the code with your authenticator app to finish signing in.",
  ],
} as const;

/** Rendered inside AuthLayout, which supplies the branding panel and mobile logo. */
export default function AuthPage() {
  // ponytail: the challenge lives in state only — a reload drops it and the admin re-enters the password, which a five-minute single-use token requires anyway.
  const [
    challenge,
    setChallenge,
  ] = useState<TwoFactorChallenge | TwoFactorEnrolmentChallenge | null>(null);
  const navigate = useNavigate();
  const verify = useSystemLoginTwoFactor();
  const [
    title,
    subtitle,
  ] = COPY[challenge?.step ?? "password"];

  const signIn = (code: string) => verify.mutateAsync({
    data: {
      challengeToken: challenge!.challengeToken, code,
    },
  });
  const finish = async () => {
    await useAuthStore.getState().bootstrapFromSession();
    navigate(
      "/",
      { replace: true },
    );
  };
  const restart = () => setChallenge(null);

  let step;
  if (challenge?.step === "enrolment") {
    step = (
      <TwoFactorEnrolmentStep
        enrolment={challenge.enrolment}
        verify={async code => (await signIn(code)).data.recoveryCodes}
        onSignedIn={finish}
        onRestart={restart}
      />
    );
  }
  else if (challenge) {
    step = (
      <TwoFactorCodeForm
        verify={async (code) => {
          await signIn(code);
          await finish();
        }}
        onRestart={restart}
      />
    );
  }
  else {
    step = <AdminSignInForm onChallenge={setChallenge} />;
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-left">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {step}
    </div>
  );
}
