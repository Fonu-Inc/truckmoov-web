import { Wrench } from "lucide-react";
import { InstallerSignInForm } from "@/features/auth/components/forms/InstallerSignInForm";

/** Rendered inside AuthLayout, which supplies the branding panel and mobile logo. */
export default function AuthPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-left">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Wrench className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Installer sign in</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your installation jobs.</p>
      </div>

      <InstallerSignInForm />
    </div>
  );
}
