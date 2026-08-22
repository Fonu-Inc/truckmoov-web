import { Link } from "react-router";
import { SignUpForm } from "@/features/auth/components/forms/SignUpForm";

/** Rendered inside AuthLayout, which supplies the branding panel and mobile logo. */
export default function SignUpPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-left">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Create your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Start managing your fleet today</p>
      </div>

      <SignUpForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?
        {" "}
        <Link
          to="/auth"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
