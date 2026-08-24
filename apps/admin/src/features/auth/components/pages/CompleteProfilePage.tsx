import { ArrowLeft } from "lucide-react";
import {
  Link, useSearchParams,
} from "react-router";
import { Button } from "@/components/shadcn/button";
import { CompleteProfileForm } from "@/features/auth/components/forms/CompleteProfileForm";
import { AuthCardShell } from "@/features/auth/components/ui/AuthCardShell";

export default function CompleteProfilePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  return (
    <AuthCardShell
      title="Complete your profile"
      description="Set your name and password to finish setting up your account."
    >
      {!token
        ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                This profile link is invalid or missing its token. Verify your email again to continue.
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
        : <CompleteProfileForm token={token} />}
    </AuthCardShell>
  );
}
