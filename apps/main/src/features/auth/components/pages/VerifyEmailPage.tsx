import {
  useVerifyEmail, useVerifyReset,
} from "@truckmoov/api/auth";
import {
  ArrowLeft, Loader2,
} from "lucide-react";
import {
  useEffect, useRef, useState,
} from "react";
import {
  Link, useNavigate, useSearchParams,
} from "react-router";
import { Button } from "@/components/shadcn/button";
import { AuthCardShell } from "@/features/auth/components/ui/AuthCardShell";

type VerifyType = "new-user" | "reset-password";

function isVerifyType(value: string): value is VerifyType {
  return value === "new-user" || value === "reset-password";
}

const COPY: Record<VerifyType, {
  title: string; description: string; requestLinkHref: string; requestLinkLabel: string;
}> = {
  "new-user": {
    title: "Verifying your email",
    description: "Hold tight while we confirm your account.",
    requestLinkHref: "/auth",
    requestLinkLabel: "Back to sign in",
  },
  "reset-password": {
    title: "Verifying your reset link",
    description: "Hold tight while we confirm your password reset.",
    requestLinkHref: "/auth/forgot-password",
    requestLinkLabel: "Request a new link",
  },
};

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token")?.trim() ?? "";
  const rawType = searchParams.get("type")?.trim() ?? "";
  const type: VerifyType | null = isVerifyType(rawType) ? rawType : null;

  const verifyEmail = useVerifyEmail();
  const verifyReset = useVerifyReset();
  const [
    error,
    setError,
  ] = useState<string | null>(null);
  const firedRef = useRef(false);

  useEffect(
    () => {
      if (firedRef.current)
        return;
      if (!token || !type)
        return;

      firedRef.current = true;

      const mutation = type === "new-user" ? verifyEmail : verifyReset;
      const nextPath = type === "new-user" ? "/auth/complete-profile" : "/auth/reset-password";

      mutation.mutate(
        { data: { token } },
        {
          onSuccess: () => {
            navigate(
              `${nextPath}?token=${encodeURIComponent(token)}`,
              { replace: true },
            );
          },
          onError: (err) => {
            setError(err.message);
          },
        },
      );
    },
    [
      token,
      type,
      verifyEmail,
      verifyReset,
      navigate,
    ],
  );

  if (!token || !type) {
    return (
      <AuthCardShell
        title="Verification link is invalid"
        description="This link is missing information we need to verify your email."
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Open the link from your most recent email, or start again from sign in.
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
      </AuthCardShell>
    );
  }

  const copy = COPY[type];

  return (
    <AuthCardShell
      title={error ? "We couldn't verify your link" : copy.title}
      description={error ? "The link may have expired or already been used." : copy.description}
    >
      {error
        ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                asChild
                className="w-full"
              >
                <Link to={copy.requestLinkHref}>
                  {copy.requestLinkLabel}
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
        : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">This only takes a moment.</p>
            </div>
          )}
    </AuthCardShell>
  );
}
