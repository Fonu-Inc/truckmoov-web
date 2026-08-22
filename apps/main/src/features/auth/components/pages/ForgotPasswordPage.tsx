import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/shadcn/button";
import { ForgotPasswordForm } from "@/features/auth/components/forms/ForgotPasswordForm";

/** Rendered inside AuthLayout, which supplies the branding panel and mobile logo. */
export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-3"
      >
        <Link to="/auth">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </Button>

      <div className="text-left">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Reset your password</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter the email associated with your account.</p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
