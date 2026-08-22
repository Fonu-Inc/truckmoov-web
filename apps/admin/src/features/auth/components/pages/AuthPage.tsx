import { ShieldCheck } from "lucide-react";
import { AdminSignInForm } from "@/features/auth/components/forms/AdminSignInForm";

/** Rendered inside AuthLayout, which supplies the branding panel and mobile logo. */
export default function AuthPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-left">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Platform admin sign in</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to manage platform operations.</p>
      </div>

      <AdminSignInForm />
    </div>
  );
}
