import { Link } from "react-router";
import { SignInForm } from "@/features/auth/components/forms/SignInForm";

/** Rendered inside AuthLayout, which supplies the branding panel and mobile logo. */
export default function AuthPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-left">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your FleetPro account</p>
      </div>

      <SignInForm />

      <p className="text-center text-sm text-muted-foreground">
        New to FleetPro?
        {" "}
        <Link
          to="/auth/signup"
          className="font-medium text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
